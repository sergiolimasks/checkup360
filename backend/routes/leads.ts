import { Router, Response } from "express";
import { query } from "../db";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();

router.get("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { page = "1", limit = "20", status, source, search, sort_by = "created_at", sort_order = "desc", pipeline_stage } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = Math.min(parseInt(limit as string), 100);
    const offset = (pageNum - 1) * limitNum;
    let where = "WHERE 1=1";
    const params: any[] = [];
    let pi = 1;
    if (status) { where += " AND l.status = $" + pi++; params.push(status); }
    if (pipeline_stage) { where += " AND l.pipeline_stage = $" + pi++; params.push(pipeline_stage); }
    if (source) { where += " AND l.source = $" + pi++; params.push(source); }
    if (search) { where += " AND (l.name ILIKE $" + pi + " OR l.cpf ILIKE $" + pi + " OR l.phone ILIKE $" + pi + ")"; params.push("%" + search + "%"); pi++; }
    const allowedSort = ["created_at", "name", "status", "wa_last_message_at", "pipeline_stage"];
    const sf = allowedSort.includes(sort_by as string) ? sort_by : "created_at";
    const sd = sort_order === "asc" ? "ASC" : "DESC";
    const countR = await query("SELECT COUNT(*) FROM leads l " + where, params);
    const total = parseInt(countR.rows[0].count);
    const leadsR = await query(
      "SELECT l.*, a.name as assigned_name, (SELECT COUNT(*) FROM conversations c WHERE c.lead_id = l.id) as message_count, (SELECT SUM(amount) FROM payments p WHERE p.lead_id = l.id AND p.status = 'approved') as total_paid FROM leads l LEFT JOIN admin_users a ON a.id = l.assigned_to " + where + " ORDER BY l." + sf + " " + sd + " LIMIT $" + pi++ + " OFFSET $" + pi++,
      [...params, limitNum, offset]
    );
    res.json({ leads: leadsR.rows, pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) } });
  } catch (err) { console.error("Erro leads:", err); res.status(500).json({ error: "Erro interno" }); }
});

// Get all leads grouped by pipeline stage (for CRM kanban)
router.get("/pipeline", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { search } = req.query;
    let where = "WHERE 1=1";
    const params: any[] = [];
    if (search) { where += " AND (l.name ILIKE $1 OR l.cpf ILIKE $1 OR l.phone ILIKE $1)"; params.push("%" + search + "%"); }
    const result = await query(
      "SELECT l.*, a.name as assigned_name, (SELECT COUNT(*) FROM conversations c WHERE c.lead_id = l.id) as message_count FROM leads l LEFT JOIN admin_users a ON a.id = l.assigned_to " + where + " ORDER BY l.updated_at DESC",
      params
    );
    const stages = ['novo', 'consulta_realizada', 'em_negociacao', 'aguardando_pagamento', 'pago', 'em_andamento', 'concluido', 'perdido'];
    const pipeline: Record<string, any[]> = {};
    stages.forEach(s => pipeline[s] = []);
    result.rows.forEach((lead: any) => {
      const stage = lead.pipeline_stage || 'novo';
      if (pipeline[stage]) pipeline[stage].push(lead);
      else pipeline['novo'].push(lead);
    });
    res.json({ pipeline, stages });
  } catch (err) { console.error("Erro pipeline:", err); res.status(500).json({ error: "Erro interno" }); }
});

router.get("/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const leadR = await query("SELECT l.*, a.name as assigned_name FROM leads l LEFT JOIN admin_users a ON a.id = l.assigned_to WHERE l.id = $1", [id]);
    if (leadR.rows.length === 0) return res.status(404).json({ error: "Lead nao encontrado" });
    const convR = await query("SELECT * FROM conversations WHERE lead_id = $1 ORDER BY created_at ASC", [id]);
    const payR = await query("SELECT * FROM payments WHERE lead_id = $1 ORDER BY created_at DESC", [id]);
    res.json({ lead: leadR.rows[0], conversations: convR.rows, payments: payR.rows });
  } catch (err) { res.status(500).json({ error: "Erro interno" }); }
});

router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const { name, cpf, phone, source = "website", utm_source, utm_medium, utm_campaign } = req.body;
    if (!name || !cpf || !phone) return res.status(400).json({ error: "Nome, CPF e telefone obrigatorios" });
    const np = phone.replace(/\D/g, "");
    const fp = np.startsWith("55") ? np : "55" + np;
    const existing = await query("SELECT id, status FROM leads WHERE cpf = $1", [cpf]);
    if (existing.rows.length > 0) return res.json({ lead: existing.rows[0], message: "Lead ja cadastrado", existing: true });
    const result = await query("INSERT INTO leads (name, cpf, phone, source, utm_source, utm_medium, utm_campaign, pipeline_stage, wa_opted_in) VALUES ($1,$2,$3,$4,$5,$6,$7,'novo',true) RETURNING *", [name, cpf, fp, source, utm_source, utm_medium, utm_campaign]);
    const lead = result.rows[0];
    await query("INSERT INTO webhook_logs (source, event_type, payload, status, processed_at) VALUES ('website', 'lead_created', $1, 'processed', NOW())", [JSON.stringify({ lead_id: lead.id, name, cpf, phone: fp })]);

    // Enviar template de boas-vindas via WhatsApp (primeiro contato automático)
    try {
      const welcomeRes = await fetch('http://localhost:' + (process.env.PORT || 3001) + '/api/webhooks/send-welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-automation-key': process.env.AUTOMATION_API_KEY || '' },
        body: JSON.stringify({ phone: fp, name })
      });
      const welcomeData = await welcomeRes.json() as any;
      if (welcomeData.status === 'sent') { console.log('[Lead] Welcome template enviado para ' + fp); }
      else if (welcomeData.status === 'skipped') { console.log('[Lead] Welcome template ignorado (numero interno): ' + fp); }
      else { console.error('[Lead] Erro ao enviar welcome template:', JSON.stringify(welcomeData)); }
    } catch (welErr: any) { console.error('[Lead] Erro ao chamar send-welcome:', welErr.message); }

    res.status(201).json({ lead, message: "Lead criado", existing: false });
  } catch (err) { console.error("Erro criar lead:", err); res.status(500).json({ error: "Erro interno" }); }
});

router.patch("/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const allowed = ["status", "product_interest", "consultation_result", "wa_opted_in", "pipeline_stage", "assigned_to", "notes", "lost_reason"];
    const updates: string[] = []; const values: any[] = []; let pi = 1;
    for (const f of allowed) {
      if (req.body[f] !== undefined) {
        updates.push(f + " = $" + pi++);
        values.push(f === "consultation_result" ? JSON.stringify(req.body[f]) : req.body[f]);
      }
    }
    if (updates.length === 0) return res.status(400).json({ error: "Nenhum campo" });
    updates.push("updated_at = NOW()");
    values.push(id);
    const result = await query("UPDATE leads SET " + updates.join(", ") + " WHERE id = $" + pi + " RETURNING *", values);
    if (result.rows.length === 0) return res.status(404).json({ error: "Lead nao encontrado" });
    res.json({ lead: result.rows[0] });
  } catch (err) { res.status(500).json({ error: "Erro interno" }); }
});

router.delete("/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== "admin" && req.user?.role !== "administrador") {
      return res.status(403).json({ error: "Apenas administradores podem excluir leads" });
    }
    const { id } = req.params;
    // Delete related records first (foreign keys)
    await query("DELETE FROM conversations WHERE lead_id = $1", [id]);
    await query("DELETE FROM payments WHERE lead_id = $1", [id]);
    await query("DELETE FROM rpa_jobs WHERE lead_id = $1", [id]);
    await query("DELETE FROM stage_transitions WHERE lead_id = $1", [id]);
    await query("DELETE FROM upsell_leads WHERE lead_id = $1", [id]);
    const result = await query("DELETE FROM leads WHERE id = $1 RETURNING id", [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Lead nao encontrado" });
    res.json({ message: "Lead excluido", id });
  } catch (err) { console.error("Erro excluir lead:", err); res.status(500).json({ error: "Erro ao excluir lead" }); }
});

export default router;

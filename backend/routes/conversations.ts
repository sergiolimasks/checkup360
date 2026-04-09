// @ts-nocheck
import { Router, Response } from "express";
import { query } from "../db";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();

router.get("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { search } = req.query;
    let where = "WHERE l.wa_last_message_at IS NOT NULL";
    const params: any[] = [];
    if (search) { where += " AND (l.name ILIKE $1 OR l.phone ILIKE $1)"; params.push("%" + search + "%"); }
    const result = await query(
      "SELECT l.id, l.name, l.phone, l.pipeline_stage, l.wa_last_message_at, " +
      "(SELECT content FROM consulta_credito.conversations c WHERE c.lead_id = l.id ORDER BY c.created_at DESC LIMIT 1) as last_message, " +
      "(SELECT direction FROM consulta_credito.conversations c WHERE c.lead_id = l.id ORDER BY c.created_at DESC LIMIT 1) as last_direction, " +
      "(SELECT COUNT(*) FROM consulta_credito.conversations c WHERE c.lead_id = l.id) as message_count " +
      "FROM consulta_credito.leads l " + where + " ORDER BY l.wa_last_message_at DESC",
      params
    );
    res.json({ leads: result.rows });
  } catch (err) { console.error("Erro inbox:", err); res.status(500).json({ error: "Erro interno" }); }
});

router.get("/:leadId", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { leadId } = req.params;
    const { page = "1", limit = "50" } = req.query;
    const limitNum = Math.min(parseInt(limit as string), 200);
    const offset = (parseInt(page as string) - 1) * limitNum;
    const result = await query("SELECT * FROM consulta_credito.conversations WHERE lead_id = $1 ORDER BY created_at ASC LIMIT $2 OFFSET $3", [leadId, limitNum, offset]);
    const countR = await query("SELECT COUNT(*) FROM consulta_credito.conversations WHERE lead_id = $1", [leadId]);
    const leadR = await query("SELECT id, name, phone, pipeline_stage FROM consulta_credito.leads WHERE id = $1", [leadId]);
    res.json({ messages: result.rows, total: parseInt(countR.rows[0].count), lead: leadR.rows[0] || null });
  } catch (err) { res.status(500).json({ error: "Erro interno" }); }
});

router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const { lead_id, direction, message_type = "text", content, wa_message_id, wa_status, wa_timestamp, is_ai_generated = false, ai_model, ai_tokens_used = 0 } = req.body;
    if (!lead_id || !direction || !content) return res.status(400).json({ error: "lead_id, direction e content obrigatorios" });
    const result = await query("INSERT INTO consulta_credito.conversations (lead_id, direction, message_type, content, wa_message_id, wa_status, wa_timestamp, is_ai_generated, ai_model, ai_tokens_used) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *", [lead_id, direction, message_type, content, wa_message_id, wa_status, wa_timestamp, is_ai_generated, ai_model, ai_tokens_used]);
    await query("UPDATE consulta_credito.leads SET wa_last_message_at = NOW() WHERE id = $1", [lead_id]);
    res.status(201).json({ message: result.rows[0] });
  } catch (err) { res.status(500).json({ error: "Erro interno" }); }
});

router.post("/send", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { lead_id, content, message_type = "text", template_name, template_language, template_variables } = req.body;
    if (!lead_id) return res.status(400).json({ error: "lead_id obrigatorio" });
    const leadR = await query("SELECT * FROM consulta_credito.leads WHERE id = $1", [lead_id]);
    if (leadR.rows.length === 0) return res.status(404).json({ error: "Lead nao encontrado" });
    const lead = leadR.rows[0];
    const META_TOKEN = process.env.META_WHATSAPP_TOKEN;
    const PHONE_ID = process.env.META_PHONE_NUMBER_ID;
    if (!META_TOKEN || !PHONE_ID) {
      return res.status(500).json({ error: "WhatsApp API nao configurada (META_WHATSAPP_TOKEN ou META_PHONE_NUMBER_ID ausente)" });
    }
    let waMessageId = null;
    let sentContent = content;
    let waStatus = "failed";
    let metaErrorCode: string | null = null;
    let metaErrorMessage: string | null = null;
    let payload: any;
    if (template_name) {
      payload = { messaging_product: "whatsapp", to: lead.phone, type: "template", template: { name: template_name, language: { code: template_language || "pt_BR" }, components: template_variables && template_variables.length > 0 ? [{ type: "body", parameters: template_variables.map((v: string) => ({ type: "text", text: v })) }] : [] } };
      sentContent = "[Template: " + template_name + "]" + (template_variables ? " vars: " + template_variables.join(", ") : "");
    } else {
      if (!content) return res.status(400).json({ error: "content obrigatorio para mensagem de texto" });
      payload = { messaging_product: "whatsapp", to: lead.phone, type: "text", text: { body: content } };
    }
    try {
      const metaRes = await fetch("https://graph.facebook.com/v22.0/" + PHONE_ID + "/messages", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + META_TOKEN }, body: JSON.stringify(payload) });
      const metaData = await metaRes.json();
      if (metaData.messages && metaData.messages[0]) { waMessageId = metaData.messages[0].id; waStatus = "sent"; }
      else { const e = metaData.error || {}; metaErrorCode = String(e.code || metaRes.status); metaErrorMessage = e.error_user_title || e.message || JSON.stringify(metaData); waStatus = "failed"; }
    } catch (metaErr: any) { metaErrorCode = "NETWORK_ERROR"; metaErrorMessage = metaErr.message || "Erro de conexao com WhatsApp API"; waStatus = "failed"; }
    const msgR = await query("INSERT INTO consulta_credito.conversations (lead_id, direction, message_type, content, wa_message_id, wa_status, meta_error_code, meta_error_message) VALUES ($1, 'outbound', $2, $3, $4, $5, $6, $7) RETURNING *", [lead_id, template_name ? "template" : message_type, sentContent, waMessageId, waStatus, metaErrorCode, metaErrorMessage]);
    await query("UPDATE consulta_credito.leads SET wa_last_message_at = NOW() WHERE id = $1", [lead_id]);
    if (waStatus === "failed") { return res.status(400).json({ message: msgR.rows[0], error: "Falha ao enviar mensagem", meta_error_code: metaErrorCode, meta_error_message: metaErrorMessage }); }
    res.status(201).json({ message: msgR.rows[0], wa_message_id: waMessageId, sent_via_api: true });
  } catch (err) { console.error("Erro send:", err); res.status(500).json({ error: "Erro interno" }); }
});

export default router;

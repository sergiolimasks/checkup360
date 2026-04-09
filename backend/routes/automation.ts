import { Router, Request, Response } from "express";
import { query } from "../db";

const router = Router();

function isInternalPhone(phone: string): boolean {
  const internals = (process.env.INTERNAL_PHONES || '').split(',').map(p => p.trim()).filter(Boolean);
  const clean = phone.replace(/\D/g, '');
  return internals.some(p => clean === p || clean.endsWith(p));
}

// Middleware: verify n8n API key
function n8nAuth(req: Request, res: Response, next: any) {
  const key = req.headers["x-n8n-api-key"] || req.query.api_key;
  const expected = process.env.N8N_API_KEY;
  if (!expected || key === expected) return next();
  res.status(403).json({ error: "API key invalida" });
}

// === LEAD PIPELINE MANAGEMENT ===

// Move lead to a pipeline stage
router.post("/leads/:id/move", n8nAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { pipeline_stage, notes, status } = req.body;
    const validStages = ['novo', 'tentativa_contato', 'qualificado', 'negociando', 'pago', 'processando', 'entregue', 'upsell', 'follow_up', 'perdido', 'consulta_realizada', 'em_negociacao', 'aguardando_pagamento', 'em_andamento', 'concluido'];
    if (!validStages.includes(pipeline_stage)) return res.status(400).json({ error: "Stage invalido", valid_stages: validStages });

    let sql = "UPDATE consulta_credito.leads SET pipeline_stage = $1, updated_at = NOW()";
    const params: any[] = [pipeline_stage];
    let pi = 2;
    if (status) { sql += ", status = $" + pi++; params.push(status); }
    if (notes) { sql += ", notes = COALESCE(notes, '') || E'\\n' || $" + pi++; params.push('[Auto] ' + notes); }
    if (pipeline_stage === 'entregue') { sql += ", consultation_done_at = NOW()"; }
    sql += " WHERE id = $" + pi + " RETURNING id, name, phone, pipeline_stage, status";
    params.push(id);

    const result = await query(sql, params);
    if (result.rows.length === 0) return res.status(404).json({ error: "Lead nao encontrado" });
    res.json({ success: true, lead: result.rows[0] });
  } catch (err) { console.error("Erro move lead:", err); res.status(500).json({ error: "Erro interno" }); }
});

// Get leads needing follow-up (no message in X hours)
router.get("/leads/follow-up", n8nAuth, async (req: Request, res: Response) => {
  try {
    const { hours = "24", pipeline_stage, limit = "50" } = req.query;
    const hoursNum = parseInt(hours as string);
    const limitNum = Math.min(parseInt(limit as string), 200);

    let where = "WHERE l.pipeline_stage NOT IN ('concluido', 'perdido')";
    const params: any[] = [];
    let pi = 1;

    // Leads where last message is older than X hours OR never messaged
    where += " AND (l.wa_last_message_at IS NULL OR l.wa_last_message_at < NOW() - INTERVAL '" + hoursNum + " hours')";

    if (pipeline_stage) {
      where += " AND l.pipeline_stage = $" + pi++;
      params.push(pipeline_stage);
    }

    const result = await query(
      "SELECT l.id, l.name, l.phone, l.cpf, l.status, l.pipeline_stage, l.wa_last_message_at, l.created_at, l.notes, " +
      "(SELECT content FROM consulta_credito.conversations c WHERE c.lead_id = l.id ORDER BY c.created_at DESC LIMIT 1) as last_message " +
      "FROM consulta_credito.leads l " + where + " ORDER BY l.created_at ASC LIMIT $" + pi,
      [...params, limitNum]
    );
    const filtered = result.rows.filter((l: any) => !isInternalPhone(l.phone));
    res.json({ leads: filtered, total: filtered.length });
  } catch (err) { console.error("Erro follow-up:", err); res.status(500).json({ error: "Erro interno" }); }
});

// Get leads by stage (for CRM automation)
router.get("/leads/by-stage/:stage", n8nAuth, async (req: Request, res: Response) => {
  try {
    const { stage } = req.params;
    const { hours_in_stage } = req.query;

    let where = "WHERE l.pipeline_stage = $1";
    const params: any[] = [stage];
    let pi = 2;

    if (hours_in_stage) {
      where += " AND l.updated_at < NOW() - INTERVAL '" + parseInt(hours_in_stage as string) + " hours'";
    }

    const result = await query(
      "SELECT l.id, l.name, l.phone, l.cpf, l.status, l.pipeline_stage, l.wa_last_message_at, l.created_at, l.updated_at, l.notes " +
      "FROM consulta_credito.leads l " + where + " ORDER BY l.updated_at ASC",
      params
    );
    res.json({ leads: result.rows, total: result.rows.length });
  } catch (err) { res.status(500).json({ error: "Erro interno" }); }
});

// === MESSAGING ===

// Send WhatsApp message (from n8n)
router.post("/send-message", n8nAuth, async (req: Request, res: Response) => {
  try {
    const { lead_id, content, template_name, template_variables } = req.body;
    if (!lead_id) return res.status(400).json({ error: "lead_id obrigatorio" });

    const leadR = await query("SELECT * FROM consulta_credito.leads WHERE id = $1", [lead_id]);
    if (leadR.rows.length === 0) return res.status(404).json({ error: "Lead nao encontrado" });
    const lead = leadR.rows[0];

    if (isInternalPhone(lead.phone)) {
      console.log(`[Internal] Bloqueando envio para numero interno: ${lead.phone}`);
      return res.json({ success: false, skipped: true, reason: "Numero interno da empresa" });
    }

    const META_TOKEN = process.env.META_WHATSAPP_TOKEN;
    const PHONE_ID = process.env.META_PHONE_NUMBER_ID;

    if (!META_TOKEN || !PHONE_ID) {
      // Save message locally even without Meta API
      const msgR = await query(
        "INSERT INTO consulta_credito.conversations (lead_id, direction, message_type, content, wa_status) VALUES ($1, 'outbound', 'text', $2, 'pending') RETURNING *",
        [lead_id, content || '[Template: ' + (template_name || 'unknown') + ']']
      );
      await query("UPDATE consulta_credito.leads SET wa_last_message_at = NOW() WHERE id = $1", [lead_id]);
      return res.json({ success: true, message: msgR.rows[0], sent_via_api: false, note: "Meta API nao configurada - mensagem salva localmente" });
    }

    let payload: any;
    let sentContent = content;
    if (template_name) {
      payload = {
        messaging_product: "whatsapp",
        to: lead.phone,
        type: "template",
        template: {
          name: template_name,
          language: { code: "pt_BR" },
          components: template_variables ? [{ type: "body", parameters: template_variables.map((v: string) => ({ type: "text", text: v })) }] : []
        }
      };
      sentContent = "[Template: " + template_name + "]";
    } else {
      if (!content) return res.status(400).json({ error: "content ou template_name obrigatorio" });
      payload = { messaging_product: "whatsapp", to: lead.phone, type: "text", text: { body: content } };
    }

    const metaRes = await fetch("https://graph.facebook.com/v18.0/" + PHONE_ID + "/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + META_TOKEN },
      body: JSON.stringify(payload)
    });
    const metaData: any = await metaRes.json();

    const waMessageId = metaData.messages?.[0]?.id || null;
    const msgR = await query(
      "INSERT INTO consulta_credito.conversations (lead_id, direction, message_type, content, wa_message_id, wa_status) VALUES ($1, 'outbound', $2, $3, $4, $5) RETURNING *",
      [lead_id, template_name ? "template" : "text", sentContent, waMessageId, waMessageId ? "sent" : "failed"]
    );
    await query("UPDATE consulta_credito.leads SET wa_last_message_at = NOW() WHERE id = $1", [lead_id]);

    res.json({ success: true, message: msgR.rows[0], wa_message_id: waMessageId, sent_via_api: true });
  } catch (err) { console.error("Erro send-message:", err); res.status(500).json({ error: "Erro interno" }); }
});

// === AUTOMATION EVENTS ===

// Log automation event (for tracking)
router.post("/log-event", n8nAuth, async (req: Request, res: Response) => {
  try {
    const { lead_id, event_type, details } = req.body;
    await query(
      "INSERT INTO consulta_credito.webhook_logs (source, event_type, payload, status, processed_at) VALUES ('n8n_automation', $1, $2, 'processed', NOW())",
      [event_type || 'automation', JSON.stringify({ lead_id, details, timestamp: new Date().toISOString() })]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Erro interno" }); }
});

// Get daily stats (for scheduled reports)
router.get("/stats", n8nAuth, async (req: Request, res: Response) => {
  try {
    const leadsToday = await query("SELECT COUNT(*) FROM consulta_credito.leads WHERE created_at >= CURRENT_DATE");
    const totalLeads = await query("SELECT COUNT(*) FROM consulta_credito.leads");
    const byStage = await query("SELECT pipeline_stage, COUNT(*) as count FROM consulta_credito.leads GROUP BY pipeline_stage ORDER BY count DESC");
    const msgsToday = await query("SELECT COUNT(*) FROM consulta_credito.conversations WHERE created_at >= CURRENT_DATE");
    const pendingFollowUp = await query(
      "SELECT COUNT(*) FROM consulta_credito.leads WHERE pipeline_stage NOT IN ('concluido', 'perdido') AND (wa_last_message_at IS NULL OR wa_last_message_at < NOW() - INTERVAL '24 hours')"
    );
    res.json({
      leads_today: parseInt(leadsToday.rows[0].count),
      total_leads: parseInt(totalLeads.rows[0].count),
      by_stage: byStage.rows,
      messages_today: parseInt(msgsToday.rows[0].count),
      pending_follow_up: parseInt(pendingFollowUp.rows[0].count)
    });
  } catch (err) { res.status(500).json({ error: "Erro interno" }); }
});

// === FLOWISE TOOL ENDPOINTS ===

// Fetch lead context by phone (used by Flowise tool "buscar_contexto_lead")
router.get("/leads/by-phone/:phone", n8nAuth, async (req: Request, res: Response) => {
  try {
    let phone = req.params.phone.replace(/\D/g, '');
    const rawPhone = phone;
    if (phone.length <= 11 && !phone.startsWith('55')) {
      phone = '55' + phone;
    }

    // Try both raw and cleaned phone
    const leadR = await query(
      "SELECT * FROM consulta_credito.leads WHERE phone = $1 OR phone = $2 LIMIT 1",
      [rawPhone, phone]
    );
    if (leadR.rows.length === 0) {
      return res.status(404).json({ error: "Lead nao encontrado para este telefone" });
    }
    const lead = leadR.rows[0];

    // Last 10 conversations
    const convsR = await query(
      "SELECT direction, message_type, content, created_at FROM consulta_credito.conversations WHERE lead_id = $1 ORDER BY created_at DESC LIMIT 10",
      [lead.id]
    );

    // Last payment
    const paymentR = await query(
      "SELECT status, amount, paid_at FROM consulta_credito.payments WHERE lead_id = $1 ORDER BY created_at DESC LIMIT 1",
      [lead.id]
    );

    // Last RPA report
    const reportR = await query(
      "SELECT status, report_summary, has_pendencias, analysis_json FROM consulta_credito.rpa_jobs WHERE lead_id = $1 ORDER BY created_at DESC LIMIT 1",
      [lead.id]
    );

    res.json({
      lead,
      conversations: convsR.rows.reverse(),
      payment: paymentR.rows[0] || null,
      report: reportR.rows[0] || null
    });
  } catch (err) {
    console.error("Erro buscar lead por telefone:", err);
    res.status(500).json({ error: "Erro interno" });
  }
});

// Fetch lead + analysis report (used by Flowise tool "buscar_relatorio")
router.get("/leads/:id/report", n8nAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const leadR = await query(
      "SELECT id, name, phone, pipeline_stage, status FROM consulta_credito.leads WHERE id = $1",
      [id]
    );
    if (leadR.rows.length === 0) {
      return res.status(404).json({ error: "Lead nao encontrado" });
    }
    const lead = leadR.rows[0];

    // Last RPA report
    const reportR = await query(
      "SELECT * FROM consulta_credito.rpa_jobs WHERE lead_id = $1 ORDER BY created_at DESC LIMIT 1",
      [id]
    );
    const rpaJob = reportR.rows[0] || null;

    // Last 5 conversations
    const convsR = await query(
      "SELECT direction, message_type, content, created_at FROM consulta_credito.conversations WHERE lead_id = $1 ORDER BY created_at DESC LIMIT 5",
      [id]
    );

    res.json({
      lead,
      report: rpaJob ? {
        analysis_json: rpaJob.analysis_json,
        report_summary: rpaJob.report_summary,
        has_pendencias: rpaJob.has_pendencias,
        status: rpaJob.status
      } : null,
      conversations: convsR.rows.reverse()
    });
  } catch (err) {
    console.error("Erro buscar relatorio:", err);
    res.status(500).json({ error: "Erro interno" });
  }
});

// === REPORT ANALYSIS (called by RPA service) ===

// Analyze credit report text via Gemini AI
router.post("/analyze-report", n8nAuth, async (req: Request, res: Response) => {
  try {
    const { report_text, cpf } = req.body;
    if (!report_text || !cpf) {
      return res.status(400).json({ error: "report_text e cpf sao obrigatorios" });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY nao configurada" });
    }

    const systemPrompt = "Analise este relatório de crédito e extraia: rating (AAA a H), score (0-1000), conclusao (Aprovado/Reprovado/Aprovado com ressalvas), has_pendencias (true/false), resumo em 2-3 frases. Retorne APENAS um JSON válido com esses campos: {rating, score, conclusao, has_pendencias, resumo}";

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: `CPF: ${cpf}\n\nRelatório:\n${report_text}` }] }],
          generationConfig: { temperature: 0.1, responseMimeType: "application/json" }
        })
      }
    );

    if (!geminiRes.ok) {
      const errBody = await geminiRes.text();
      console.error("Gemini API error:", geminiRes.status, errBody);
      return res.status(502).json({ error: "Erro na API Gemini", status: geminiRes.status });
    }

    const geminiData: any = await geminiRes.json();
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      return res.status(502).json({ error: "Resposta vazia do Gemini" });
    }

    const analysis = JSON.parse(rawText);
    res.json({ success: true, analysis });
  } catch (err: any) {
    console.error("Erro analyze-report:", err);
    if (err instanceof SyntaxError) {
      return res.status(502).json({ error: "Gemini retornou JSON invalido" });
    }
    res.status(500).json({ error: "Erro interno" });
  }
});

export default router;
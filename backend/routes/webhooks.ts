import { Router, Request, Response } from "express";
import crypto from "crypto";
import { query } from "../db";
import { getFlowiseResponse, handleTag } from "../flowise";

const router = Router();

// ===== AUDIO TRANSCRIPTION via Gemini =====
async function downloadWhatsAppMedia(mediaId: string): Promise<{ base64: string; mimeType: string } | null> {
  const META_TOKEN = process.env.META_WHATSAPP_TOKEN;
  if (!META_TOKEN) return null;
  try {
    // Step 1: Get media URL
    const mediaRes = await fetch(`https://graph.facebook.com/v21.0/${mediaId}`, {
      headers: { 'Authorization': `Bearer ${META_TOKEN}` }
    });
    const mediaInfo = await mediaRes.json() as any;
    if (!mediaInfo.url) { console.error('[Audio] No URL in media info'); return null; }

    // Step 2: Download binary
    const audioRes = await fetch(mediaInfo.url, {
      headers: { 'Authorization': `Bearer ${META_TOKEN}` }
    });
    const audioBuffer = Buffer.from(await audioRes.arrayBuffer());
    console.log(`[Audio] Downloaded ${audioBuffer.length} bytes`);

    return {
      base64: audioBuffer.toString('base64'),
      mimeType: mediaInfo.mime_type || 'audio/ogg'
    };
  } catch (err: any) {
    console.error('[Audio] Download error:', err.message);
    return null;
  }
}

async function transcribeAudio(mediaId: string): Promise<string | null> {
  const GEMINI_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_KEY) { console.error('[Audio] GEMINI_API_KEY not set'); return null; }

  const audioData = await downloadWhatsAppMedia(mediaId);
  if (!audioData) return null;

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: audioData.mimeType, data: audioData.base64 } },
            { text: 'Transcreva este audio em portugues. Retorne APENAS a transcricao, sem comentarios adicionais.' }
          ]
        }]
      })
    });

    const data = await res.json() as any;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) {
      console.log(`[Audio] Transcribed: "${text.substring(0, 80)}..."`);
      return text.trim();
    }
    console.error('[Audio] No transcription in Gemini response:', JSON.stringify(data).substring(0, 200));
    return null;
  } catch (err: any) {
    console.error('[Audio] Gemini transcription error:', err.message);
    return null;
  }
}

function isInternalPhone(phone: string): boolean {
  const internals = (process.env.INTERNAL_PHONES || '').split(',').map(p => p.trim()).filter(Boolean);
  const clean = phone.replace(/\D/g, '');
  return internals.some(p => clean === p || clean.endsWith(p));
}

router.get("/whatsapp", (req: Request, res: Response) => {
  const mode = req.query["hub.mode"]; const token = req.query["hub.verify_token"]; const challenge = req.query["hub.challenge"];
  if (mode === "subscribe" && token === process.env.META_WEBHOOK_VERIFY_TOKEN) { return res.status(200).send(challenge); }
  res.status(403).send("Verificacao falhou");
});

router.post("/whatsapp", async (req: Request, res: Response) => {
  try {
    const body = req.body;
    await query("INSERT INTO webhook_logs (source, event_type, payload) VALUES ('meta_whatsapp', $1, $2)", [body.entry?.[0]?.changes?.[0]?.field || "unknown", JSON.stringify(body)]);
    if (body.entry) {
      for (const entry of body.entry) {
        for (const change of entry.changes || []) {
          if (change.field === "messages" && change.value.messages) {
            for (const msg of change.value.messages) {
              const phone = msg.from;
              let content = msg.text?.body || `[${msg.type}]`;
              const msgType = msg.type || 'text';
              if (isInternalPhone(phone)) { console.log(`[Internal] Ignorando mensagem de numero interno: ${phone}`); continue; }

              // Transcrever audio antes de salvar
              let transcribedText: string | null = null;
              if (msgType === 'audio' && msg.audio?.id) {
                transcribedText = await transcribeAudio(msg.audio.id);
                if (transcribedText) {
                  content = `[Audio transcrito] ${transcribedText}`;
                } else {
                  content = '[Audio recebido - nao foi possivel transcrever]';
                }
              }

              let leadR = await query("SELECT * FROM leads WHERE phone = $1", [phone]);
              if (leadR.rows.length === 0) { leadR = await query("INSERT INTO leads (name, cpf, phone, source, status, wa_opted_in) VALUES ($1, $2, $3, 'whatsapp', 'contacted', true) RETURNING *", [`WhatsApp ${phone}`, "", phone]); }
              const lead = leadR.rows[0];
              await query("INSERT INTO conversations (lead_id, direction, message_type, content, wa_message_id, wa_timestamp) VALUES ($1, 'inbound', $2, $3, $4, $5)", [lead.id, msgType, content, msg.id, new Date(parseInt(msg.timestamp) * 1000)]);
              await query("UPDATE leads SET wa_last_message_at = NOW(), wa_opted_in = true, last_message_direction = 'inbound', window_expires_at = NOW() + INTERVAL '24 hours', status = CASE WHEN status = 'registered' THEN 'contacted' ELSE status END WHERE id = $1", [lead.id]);

              // Chamar Flowise pra gerar resposta IA (texto e audio transcrito)
              const aiContent = msgType === 'audio' ? transcribedText : (msgType === 'text' ? msg.text?.body : null);
              if (process.env.FLOWISE_CHATFLOW_ID && aiContent) {
                try {
                  // Refresh lead data (status may have changed)
                  const freshLead = (await query("SELECT * FROM leads WHERE id = $1", [lead.id])).rows[0];
                  // Buscar historico de conversas
                  const convR = await query("SELECT direction, content, created_at FROM conversations WHERE lead_id = $1 ORDER BY created_at DESC LIMIT 10", [lead.id]);
                  const conversations = convR.rows.reverse();
                  // Buscar relatório RPA se existir
                  const rpaR = await query("SELECT status, report_summary, has_pendencias, analysis_json FROM rpa_jobs WHERE lead_id = $1 ORDER BY created_at DESC LIMIT 1", [lead.id]);
                  const rpaJob = rpaR.rows[0] || null;

                  const { text: aiResponse, tag } = await getFlowiseResponse(freshLead, aiContent, conversations, rpaJob);

                  if (aiResponse) {
                    // Enviar resposta pelo WhatsApp
                    const META_TOKEN = process.env.META_WHATSAPP_TOKEN;
                    const PHONE_ID = process.env.META_PHONE_NUMBER_ID;
                    if (META_TOKEN && PHONE_ID) {
                      const waRes = await fetch(`https://graph.facebook.com/v21.0/${PHONE_ID}/messages`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${META_TOKEN}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ messaging_product: 'whatsapp', to: phone, type: 'text', text: { body: aiResponse } })
                      });
                      const waData = await waRes.json() as any;
                      const replyWaId = waData.messages?.[0]?.id || null;

                      // Salvar resposta no banco
                      await query("INSERT INTO conversations (lead_id, direction, message_type, content, wa_message_id, wa_status, is_ai_generated, ai_model) VALUES ($1, 'outbound', 'text', $2, $3, 'sent', true, 'flowise-gemini')", [lead.id, aiResponse, replyWaId]);
                      await query("UPDATE leads SET wa_last_message_at = NOW(), last_message_direction = 'outbound' WHERE id = $1", [lead.id]);
                      console.log(`[Flowise] Resposta enviada para ${phone} (${freshLead.pipeline_stage}) tag=${tag || 'none'}`);
                    }

                    // Processar tag (mudar stage, disparar ações)
                    if (tag) await handleTag(tag, freshLead, query);
                  }
                } catch (flowErr: any) { console.error('[Flowise] Erro:', flowErr.message); }
              }
            }
          }
          if (change.field === "messages" && change.value.statuses) {
            for (const s of change.value.statuses) { await query("UPDATE conversations SET wa_status = $1 WHERE wa_message_id = $2", [s.status, s.id]); }
          }
        }
      }
    }
    res.status(200).send("OK");
  } catch (err) { console.error("Webhook WA error:", err); res.status(200).send("OK"); }
});

router.post("/payment", async (req: Request, res: Response) => {
  try {
    const body = req.body;
    await query("INSERT INTO webhook_logs (source, event_type, payload) VALUES ('payment_gateway', $1, $2)", [body.event || "payment_update", JSON.stringify(body)]);
    const payment = body.payment;
    if (!payment) return res.status(200).send("OK");
    const payR = await query("SELECT * FROM payments WHERE gateway_payment_id = $1", [payment.id]);
    if (payR.rows.length === 0) return res.status(200).send("OK");
    const dbPay = payR.rows[0];
    let newStatus = dbPay.status; let paidAt = null;
    if (body.event === "PAYMENT_CONFIRMED" || body.event === "PAYMENT_RECEIVED") { newStatus = "approved"; paidAt = new Date(); }
    else if (body.event === "PAYMENT_OVERDUE") newStatus = "expired";
    await query("UPDATE payments SET status = $1, paid_at = $2, payment_method = $3 WHERE id = $4", [newStatus, paidAt, payment.billingType?.toLowerCase(), dbPay.id]);
    if (newStatus === "approved") {
      await query("UPDATE leads SET status = 'paid' WHERE id = $1", [dbPay.lead_id]);
      if (process.env.N8N_WEBHOOK_URL) { fetch(`${process.env.N8N_WEBHOOK_URL}/payment-confirmed`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lead_id: dbPay.lead_id, payment_id: dbPay.id, amount: dbPay.amount, product: dbPay.product }) }).catch(e => console.error("n8n error:", e)); }
    }
    res.status(200).send("OK");
  } catch (err) { console.error("Webhook pay error:", err); res.status(200).send("OK"); }
});

// Template de boas-vindas — UTILITY, pede pro lead responder pra abrir janela 24h
const WELCOME_TEMPLATE = 'confirmacao_atendimento';

async function sendWelcomeTemplate(phone: string, name: string): Promise<string | null> {
  const META_TOKEN = process.env.META_WHATSAPP_TOKEN;
  const PHONE_ID = process.env.META_PHONE_NUMBER_ID;
  if (!META_TOKEN || !PHONE_ID) return null;
  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${PHONE_ID}/messages`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${META_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp', to: phone, type: 'template',
        template: { name: WELCOME_TEMPLATE, language: { code: 'pt_BR' }, components: [{ type: 'body', parameters: [{ type: 'text', text: name }] }] }
      })
    });
    const data = await res.json() as any;
    if (data.error) { console.error(`[Template] Erro ao enviar ${WELCOME_TEMPLATE}:`, data.error.message); return null; }
    const waMessageId = data.messages?.[0]?.id || null;
    console.log(`[Template] ${WELCOME_TEMPLATE} enviado para ${phone} wa_id=${waMessageId}`);
    return waMessageId;
  } catch (err: any) { console.error('[Template] Fetch error:', err.message); return null; }
}

async function findLeadByPhone(phone: string) {
  const clean = phone.replace(/\D/g, '');
  return query("SELECT * FROM leads WHERE phone = $1 OR phone = $2 LIMIT 1", [phone, clean]);
}

router.post("/send-welcome", async (req: Request, res: Response) => {
  const autoKey = req.headers['x-automation-key'] as string;
  const token = req.headers.authorization?.replace('Bearer ', '');
  const validAutoKey = process.env.AUTOMATION_API_KEY;
  let authenticated = false;
  if (autoKey && validAutoKey && autoKey === validAutoKey) authenticated = true;
  if (!authenticated && token) {
    try { require('jsonwebtoken').verify(token, process.env.JWT_SECRET); authenticated = true; } catch {}
  }
  if (!authenticated) return res.status(401).json({ error: 'Autenticacao necessaria' });
  try {
    const { phone, name } = req.body;
    if (!phone) return res.status(400).json({ error: 'phone obrigatorio' });
    if (isInternalPhone(phone)) return res.json({ status: 'skipped', reason: 'Numero interno' });

    let leadResult = await findLeadByPhone(phone);
    if (leadResult.rows.length === 0) {
      leadResult = await query("INSERT INTO leads (name, phone, source, status, wa_opted_in) VALUES ($1, $2, 'landing_page', 'registered', true) RETURNING *", [name || ('WhatsApp ' + phone), phone]);
    }
    const lead = leadResult.rows[0];

    const waMessageId = await sendWelcomeTemplate(phone, name || lead.name || 'cliente');
    if (!waMessageId) return res.status(500).json({ error: 'Falha ao enviar template' });

    await query("INSERT INTO conversations (lead_id, direction, message_type, content, wa_message_id, wa_status, is_ai_generated, ai_model) VALUES ($1, 'outbound', 'template', $2, $3, 'sent', false, 'system')", [lead.id, `[Template ${WELCOME_TEMPLATE} enviado]`, waMessageId]);
    await query("UPDATE leads SET wa_last_message_at = NOW(), last_message_direction = 'outbound' WHERE id = $1", [lead.id]);

    res.json({ status: 'sent', wa_message_id: waMessageId, lead_id: lead.id });
  } catch (err: any) { console.error('[Welcome] Erro:', err.message); res.status(500).json({ error: err.message }); }
});

export default router;

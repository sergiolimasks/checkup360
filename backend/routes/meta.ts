import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { query } from "../db";

const router = Router();

// GET /api/meta/templates
router.get('/templates', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const token = process.env.META_WHATSAPP_TOKEN;
    const waba = process.env.META_BUSINESS_ACCOUNT_ID;
    if (!token || !waba) return res.status(500).json({ error: 'Meta credentials not configured' });
    const url = 'https://graph.facebook.com/v21.0/' + waba + '/message_templates';
    const response = await fetch(url, { headers: { 'Authorization': 'Bearer ' + token } });
    const data = await response.json() as any;
    if (data.error) throw new Error(data.error.message);
    res.json({ templates: data.data || [] });
  } catch (err: any) {
    console.error('Erro ao buscar templates Meta:', err);
    res.status(500).json({ error: err.message || 'Erro ao buscar templates' });
  }
});

// POST /api/meta/create-template
router.post('/create-template', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { name, category, language, header, body, footer, body_examples } = req.body;
    if (!name || !body) return res.status(400).json({ error: 'name e body sao obrigatorios' });
    const token = process.env.META_WHATSAPP_TOKEN;
    const waba = process.env.META_BUSINESS_ACCOUNT_ID;
    if (!token || !waba) return res.status(500).json({ error: 'Meta credentials not configured' });

    const components: any[] = [];
    if (header) components.push({ type: 'HEADER', format: 'TEXT', text: header });
    const bodyComponent: any = { type: 'BODY', text: body };
    if (body_examples && body_examples.length > 0) { bodyComponent.example = { body_text: [body_examples] }; }
    components.push(bodyComponent);
    if (footer) components.push({ type: 'FOOTER', text: footer });

    const payload = {
      name: name.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
      language: language || 'pt_BR',
      category: (category || 'MARKETING').toUpperCase(),
      components
    };

    const url = 'https://graph.facebook.com/v21.0/' + waba + '/message_templates';
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json() as any;
    if (data.error) throw new Error(data.error.message + (data.error.error_user_title ? ' - ' + data.error.error_user_title : '') + (data.error.error_user_msg ? ': ' + data.error.error_user_msg : ''));
    res.json({ success: true, template_id: data.id, status: data.status, data });
  } catch (err: any) {
    console.error('Erro ao criar template Meta:', err);
    res.status(500).json({ error: err.message || 'Erro ao criar template' });
  }
});

// DELETE /api/meta/delete-template/:name
router.delete('/delete-template/:name', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const token = process.env.META_WHATSAPP_TOKEN;
    const waba = process.env.META_BUSINESS_ACCOUNT_ID;
    const url = 'https://graph.facebook.com/v21.0/' + waba + '/message_templates?name=' + encodeURIComponent(req.params.name);
    const response = await fetch(url, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token } });
    const data = await response.json() as any;
    if (data.error) throw new Error(data.error.message);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/meta/send-template
router.post('/send-template', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { phone, template_name, language, variables = [], lead_id } = req.body;
    if (!phone || !template_name) return res.status(400).json({ error: 'phone e template_name sao obrigatorios' });
    const token = process.env.META_WHATSAPP_TOKEN;
    const phoneId = process.env.META_PHONE_NUMBER_ID;
    if (!token || !phoneId) return res.status(500).json({ error: 'Meta credentials not configured' });

    const components: any[] = [];
    if (variables.length > 0) {
      components.push({ type: 'body', parameters: variables.map((v: string) => ({ type: 'text', text: v })) });
    }

    const payload = {
      messaging_product: 'whatsapp',
      to: phone.replace(/\D/g, ''),
      type: 'template',
      template: {
        name: template_name,
        language: { code: language || 'pt_BR' },
        components: components.length ? components : undefined
      }
    };

    const url = 'https://graph.facebook.com/v21.0/' + phoneId + '/messages';
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json() as any;
    if (data.error) throw new Error(data.error.message);

    const waMessageId = data.messages && data.messages[0] ? data.messages[0].id : null;

    let resolvedLeadId = lead_id;
    if (!resolvedLeadId) {
      const cleanPhone = phone.replace(/\D/g, '');
      const leadResult = await query('SELECT id FROM leads WHERE phone = $1 LIMIT 1', [cleanPhone]);
      if (leadResult.rows.length > 0) resolvedLeadId = leadResult.rows[0].id;
    }

    if (resolvedLeadId) {
      const content = '[Template: ' + template_name + ']' + (variables.length > 0 ? ' Vars: ' + variables.join(', ') : '');
      await query(
        "INSERT INTO conversations (lead_id, direction, message_type, content, wa_message_id, wa_status, wa_timestamp) VALUES ($1, 'outbound', 'template', $2, $3, 'sent', NOW()) RETURNING *",
        [resolvedLeadId, content, waMessageId]
      );
      await query('UPDATE leads SET wa_last_message_at = NOW(), wa_template_sent = true WHERE id = $1', [resolvedLeadId]);
    }

    res.json({ success: true, message_id: waMessageId, data });
  } catch (err: any) {
    console.error('Erro ao enviar template:', err);
    res.status(500).json({ error: err.message || 'Erro ao enviar template' });
  }
});

export default router;

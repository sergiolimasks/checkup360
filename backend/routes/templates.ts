// @ts-nocheck
import { Router, Response } from "express";
import { query } from "../db";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();

router.get("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { status, category } = req.query;
    let where = "WHERE 1=1";
    const params: any[] = [];
    let idx = 1;
    if (status) { where += ` AND status = $${idx++}`; params.push(status); }
    if (category) { where += ` AND category = $${idx++}`; params.push(category); }
    const result = await query(`SELECT * FROM consulta_credito.wa_templates ${where} ORDER BY name ASC`, params);
    res.json({ templates: result.rows });
  } catch (err) { console.error("Erro ao listar templates:", err); res.status(500).json({ error: "Erro interno" }); }
});

router.get("/approved", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query("SELECT id, name, language, category, body_text, header_text, footer_text, buttons FROM consulta_credito.wa_templates WHERE status = 'APPROVED' ORDER BY name ASC");
    res.json({ templates: result.rows });
  } catch (err) { res.status(500).json({ error: "Erro interno" }); }
});

router.get("/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query("SELECT * FROM consulta_credito.wa_templates WHERE id = $1", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Template nao encontrado" });
    res.json({ template: result.rows[0] });
  } catch (err) { res.status(500).json({ error: "Erro interno" }); }
});

router.post("/sync", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const WABA_ID = process.env.META_BUSINESS_ACCOUNT_ID;
    const META_TOKEN = process.env.META_WHATSAPP_TOKEN;
    if (!WABA_ID || !META_TOKEN) {
      return res.status(500).json({ error: "META_BUSINESS_ACCOUNT_ID ou META_WHATSAPP_TOKEN nao configurado" });
    }
    let allTemplates: any[] = [];
    let url: string | null = `https://graph.facebook.com/v22.0/${WABA_ID}/message_templates?limit=100`;
    while (url) {
      const metaRes = await fetch(url, { headers: { "Authorization": "Bearer " + META_TOKEN } });
      const metaData = await metaRes.json();
      if (metaData.error) {
        return res.status(502).json({ error: "Erro ao buscar templates do Meta", meta_error: metaData.error });
      }
      if (metaData.data) { allTemplates = allTemplates.concat(metaData.data); }
      url = metaData.paging?.next || null;
    }
    let synced = 0;
    let errors: string[] = [];
    for (const tpl of allTemplates) {
      try {
        const name = tpl.name;
        const language = tpl.language || "pt_BR";
        const category = tpl.category || "UTILITY";
        const status = tpl.status;
        const metaTemplateId = tpl.id;
        let headerText = null;
        let bodyText = "";
        let footerText = null;
        let buttons = null;
        if (tpl.components) {
          for (const comp of tpl.components) {
            switch (comp.type) {
              case "HEADER": headerText = comp.text || (comp.format === "IMAGE" ? "[Imagem]" : comp.format || ""); break;
              case "BODY": bodyText = comp.text || ""; break;
              case "FOOTER": footerText = comp.text || ""; break;
              case "BUTTONS": buttons = JSON.stringify(comp.buttons || []); break;
            }
          }
        }
        const existing = await query("SELECT id FROM consulta_credito.wa_templates WHERE name = $1 AND language = $2", [name, language]);
        if (existing.rows.length > 0) {
          await query("UPDATE consulta_credito.wa_templates SET category = $1, status = $2, header_text = $3, body_text = $4, footer_text = $5, buttons = $6, meta_template_id = $7 WHERE name = $8 AND language = $9", [category, status, headerText, bodyText, footerText, buttons, metaTemplateId, name, language]);
        } else {
          await query("INSERT INTO consulta_credito.wa_templates (name, language, category, status, header_text, body_text, footer_text, buttons, meta_template_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)", [name, language, category, status, headerText, bodyText, footerText, buttons, metaTemplateId]);
        }
        synced++;
      } catch (tplErr: any) { errors.push(`${tpl.name}: ${tplErr.message}`); }
    }
    res.json({ synced, total_from_meta: allTemplates.length, errors: errors.length > 0 ? errors : undefined, message: `${synced} templates sincronizados do Meta` });
  } catch (err) { console.error("Erro ao sincronizar templates:", err); res.status(500).json({ error: "Erro interno" }); }
});

router.delete("/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query("DELETE FROM consulta_credito.wa_templates WHERE id = $1 RETURNING id", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Template nao encontrado" });
    res.json({ deleted: true });
  } catch (err) { res.status(500).json({ error: "Erro interno" }); }
});

export default router;

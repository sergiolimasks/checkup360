import { Router, Response } from "express";
import { query } from "../db";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();

router.get("/stats", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { period = "30" } = req.query;
    const days = parseInt(period as string);
    const dateFrom = new Date(Date.now() - days * 86400000).toISOString();
    const leadsTotal = await query("SELECT COUNT(*) FROM leads");
    const leadsNew = await query("SELECT COUNT(*) FROM leads WHERE created_at >= $1", [dateFrom]);
    const funnel = await query("SELECT status, COUNT(*) as count FROM leads GROUP BY status");
    const paymentsApproved = await query("SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'approved' AND paid_at >= $1", [dateFrom]);
    const avgTicket = await query("SELECT COALESCE(AVG(amount), 0) as avg_ticket FROM payments WHERE status = 'approved' AND paid_at >= $1", [dateFrom]);
    const conversions = await query("SELECT product_interest, COUNT(*) as count FROM leads WHERE product_interest IS NOT NULL AND updated_at >= $1 GROUP BY product_interest", [dateFrom]);
    const totalContacted = await query("SELECT COUNT(*) FROM leads WHERE status != 'registered' AND created_at >= $1", [dateFrom]);
    const totalPaid = await query("SELECT COUNT(*) FROM leads WHERE status IN ('paid','consulting','completed','converted') AND created_at >= $1", [dateFrom]);
    const aiMsgs = await query("SELECT COUNT(*) as count, COALESCE(SUM(ai_tokens_used), 0) as tokens FROM conversations WHERE is_ai_generated = true AND created_at >= $1", [dateFrom]);
    res.json({ leads: { total: parseInt(leadsTotal.rows[0].count), new_period: parseInt(leadsNew.rows[0].count) }, funnel: funnel.rows, revenue: { total: parseFloat(paymentsApproved.rows[0].total), count: parseInt(paymentsApproved.rows[0].count), avg_ticket: parseFloat(avgTicket.rows[0].avg_ticket) }, conversions: conversions.rows, conversion_rate: { contacted: parseInt(totalContacted.rows[0].count), paid: parseInt(totalPaid.rows[0].count), rate: parseInt(totalContacted.rows[0].count) > 0 ? (parseInt(totalPaid.rows[0].count) / parseInt(totalContacted.rows[0].count) * 100).toFixed(1) : 0 }, ai: { messages: parseInt(aiMsgs.rows[0].count), tokens: parseInt(aiMsgs.rows[0].tokens) } });
  } catch (err) { console.error("Erro stats:", err); res.status(500).json({ error: "Erro interno" }); }
});

router.get("/chart", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { period = "30", metric = "leads" } = req.query;
    const dateFrom = new Date(Date.now() - parseInt(period as string) * 86400000).toISOString();
    let q = "";
    if (metric === "leads") q = "SELECT DATE(created_at) as date, COUNT(*) as value FROM leads WHERE created_at >= $1 GROUP BY DATE(created_at) ORDER BY date";
    else if (metric === "revenue") q = "SELECT DATE(paid_at) as date, SUM(amount) as value FROM payments WHERE status = 'approved' AND paid_at >= $1 GROUP BY DATE(paid_at) ORDER BY date";
    else if (metric === "messages") q = "SELECT DATE(created_at) as date, COUNT(*) as value FROM conversations WHERE created_at >= $1 GROUP BY DATE(created_at) ORDER BY date";
    else q = "SELECT DATE(paid_at) as date, COUNT(*) as value FROM payments WHERE status = 'approved' AND paid_at >= $1 GROUP BY DATE(paid_at) ORDER BY date";
    const result = await query(q, [dateFrom]);
    res.json({ data: result.rows });
  } catch (err) { res.status(500).json({ error: "Erro interno" }); }
});

router.get("/source-breakdown", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query("SELECT source, COUNT(*) as count, COUNT(CASE WHEN status IN ('paid','consulting','completed','converted') THEN 1 END) as converted FROM leads GROUP BY source ORDER BY count DESC");
    res.json({ sources: result.rows });
  } catch (err) { res.status(500).json({ error: "Erro interno" }); }
});

export default router;

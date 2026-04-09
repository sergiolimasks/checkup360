import { Router, Response } from "express";
import { query } from "../db";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();

router.get("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { status, page = "1", limit = "20" } = req.query;
    const pageNum = parseInt(page as string); const limitNum = Math.min(parseInt(limit as string), 100); const offset = (pageNum - 1) * limitNum;
    let where = "WHERE 1=1"; const params: any[] = []; let pi = 1;
    if (status) { where += ` AND p.status = $${pi++}`; params.push(status); }
    const result = await query(`SELECT p.*, l.name as lead_name, l.cpf as lead_cpf, l.phone as lead_phone FROM payments p JOIN leads l ON l.id = p.lead_id ${where} ORDER BY p.created_at DESC LIMIT $${pi++} OFFSET $${pi++}`, [...params, limitNum, offset]);
    const countR = await query(`SELECT COUNT(*) FROM payments p ${where}`, params);
    res.json({ payments: result.rows, pagination: { page: pageNum, limit: limitNum, total: parseInt(countR.rows[0].count), pages: Math.ceil(parseInt(countR.rows[0].count) / limitNum) } });
  } catch (err) { res.status(500).json({ error: "Erro interno" }); }
});

router.post("/create-checkout", async (req: AuthRequest, res: Response) => {
  try {
    const { lead_id, product, amount } = req.body;
    if (!lead_id || !product || !amount) return res.status(400).json({ error: "lead_id, product e amount obrigatorios" });
    const leadR = await query("SELECT * FROM leads WHERE id = $1", [lead_id]);
    if (leadR.rows.length === 0) return res.status(404).json({ error: "Lead nao encontrado" });
    let checkoutUrl = ""; let gatewayPaymentId = "";
    if (process.env.ASAAS_API_KEY) {
      const resp = await fetch(`${process.env.ASAAS_BASE_URL}/payments`, { method: "POST", headers: { "Content-Type": "application/json", "access_token": process.env.ASAAS_API_KEY! }, body: JSON.stringify({ customer: leadR.rows[0].cpf, billingType: "UNDEFINED", value: amount, dueDate: new Date(Date.now() + 86400000).toISOString().split("T")[0], description: `Consulta Credito - ${product}`, externalReference: lead_id }) });
      const gw: any = await resp.json(); gatewayPaymentId = gw.id || ""; checkoutUrl = gw.invoiceUrl || "";
    }
    const payR = await query("INSERT INTO payments (lead_id, gateway, gateway_payment_id, gateway_checkout_url, amount, product, expires_at) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *", [lead_id, process.env.PAYMENT_GATEWAY || "asaas", gatewayPaymentId, checkoutUrl, amount, product, new Date(Date.now() + 86400000)]);
    await query("UPDATE leads SET status = 'payment_pending' WHERE id = $1", [lead_id]);
    res.status(201).json({ payment: payR.rows[0], checkout_url: checkoutUrl });
  } catch (err) { console.error("Erro pagamento:", err); res.status(500).json({ error: "Erro interno" }); }
});

export default router;

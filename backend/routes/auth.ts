import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query } from "../db";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();

router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email e senha obrigatorios" });
    const result = await query("SELECT * FROM admin_users WHERE email = $1", [email]);
    if (result.rows.length === 0) return res.status(401).json({ error: "Credenciais invalidas" });
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: "Credenciais invalidas" });
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET!, { expiresIn: "7d" });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) { console.error("Erro login:", err); res.status(500).json({ error: "Erro interno" }); }
});

router.get("/me", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query("SELECT id, name, email, role FROM admin_users WHERE id = $1", [req.user!.id]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: "Erro interno" }); }
});

export default router;

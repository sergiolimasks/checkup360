import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import { query } from "../db";
import { authMiddleware, AuthRequest, adminOnly } from "../middleware/auth";

const router = Router();

// List users (admin only)
router.get("/", authMiddleware, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query("SELECT id, name, email, role, is_active, phone, last_login, created_at FROM admin_users ORDER BY created_at DESC");
    res.json({ users: result.rows });
  } catch (err) { console.error("Erro users:", err); res.status(500).json({ error: "Erro interno" }); }
});

// Create user (admin only)
router.post("/", authMiddleware, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password, role = "atendente", phone } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: "Nome, email e senha obrigatorios" });
    if (!['admin', 'atendente'].includes(role)) return res.status(400).json({ error: "Role invalido" });
    const existing = await query("SELECT id FROM admin_users WHERE email = $1", [email]);
    if (existing.rows.length > 0) return res.status(409).json({ error: "Email ja cadastrado" });
    const hash = await bcrypt.hash(password, 10);
    const result = await query(
      "INSERT INTO admin_users (name, email, password_hash, role, phone) VALUES ($1,$2,$3,$4,$5) RETURNING id, name, email, role, is_active, phone, created_at",
      [name, email, hash, role, phone || null]
    );
    res.status(201).json({ user: result.rows[0] });
  } catch (err) { console.error("Erro criar user:", err); res.status(500).json({ error: "Erro interno" }); }
});

// Update user (admin only)
router.put("/:id", authMiddleware, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, role, is_active, phone } = req.body;
    const updates: string[] = []; const values: any[] = []; let pi = 1;
    if (name !== undefined) { updates.push("name = $" + pi++); values.push(name); }
    if (email !== undefined) { updates.push("email = $" + pi++); values.push(email); }
    if (role !== undefined) { updates.push("role = $" + pi++); values.push(role); }
    if (is_active !== undefined) { updates.push("is_active = $" + pi++); values.push(is_active); }
    if (phone !== undefined) { updates.push("phone = $" + pi++); values.push(phone); }
    if (updates.length === 0) return res.status(400).json({ error: "Nenhum campo" });
    updates.push("updated_at = NOW()");
    values.push(id);
    const result = await query(
      "UPDATE admin_users SET " + updates.join(", ") + " WHERE id = $" + pi + " RETURNING id, name, email, role, is_active, phone, created_at",
      values
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Usuario nao encontrado" });
    res.json({ user: result.rows[0] });
  } catch (err) { res.status(500).json({ error: "Erro interno" }); }
});

// Change password (admin or self)
router.put("/:id/password", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (req.user!.role !== "admin" && req.user!.id !== id) return res.status(403).json({ error: "Sem permissao" });
    const { password, current_password } = req.body;
    if (!password || password.length < 6) return res.status(400).json({ error: "Senha deve ter no minimo 6 caracteres" });
    // If not admin, require current password
    if (req.user!.role !== "admin") {
      if (!current_password) return res.status(400).json({ error: "Senha atual obrigatoria" });
      const userR = await query("SELECT password_hash FROM admin_users WHERE id = $1", [id]);
      if (userR.rows.length === 0) return res.status(404).json({ error: "Usuario nao encontrado" });
      const valid = await bcrypt.compare(current_password, userR.rows[0].password_hash);
      if (!valid) return res.status(401).json({ error: "Senha atual incorreta" });
    }
    const hash = await bcrypt.hash(password, 10);
    await query("UPDATE admin_users SET password_hash = $1, updated_at = NOW() WHERE id = $2", [hash, id]);
    res.json({ message: "Senha alterada" });
  } catch (err) { res.status(500).json({ error: "Erro interno" }); }
});

// Delete user (admin only, can't delete self)
router.delete("/:id", authMiddleware, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (req.user!.id === id) return res.status(400).json({ error: "Nao pode deletar a si mesmo" });
    const result = await query("DELETE FROM admin_users WHERE id = $1 RETURNING id", [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Usuario nao encontrado" });
    res.json({ message: "Usuario removido" });
  } catch (err) { res.status(500).json({ error: "Erro interno" }); }
});

export default router;

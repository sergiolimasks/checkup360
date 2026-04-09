import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: { id: string; email: string; role: string };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Token nao fornecido" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
    next();
  } catch {
    return res.status(401).json({ error: "Token invalido" });
  }
};

export const adminOnly = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== "admin" && req.user?.role !== "administrador") return res.status(403).json({ error: "Acesso restrito" });
  next();
};

import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";
import leadsRoutes from "./routes/leads";
import conversationsRoutes from "./routes/conversations";
import paymentsRoutes from "./routes/payments";
import webhooksRoutes from "./routes/webhooks";
import dashboardRoutes from "./routes/dashboard";
import usersRoutes from "./routes/users";
import templatesRoutes from "./routes/templates";
import automationRoutes from "./routes/automation";
import analyticsRoutes from "./routes/analytics";
import metaRoutes from "./routes/meta";

dotenv.config();
const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*' }));
app.use(express.json({ limit: "10mb" }));

const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10000, message: { error: "Muitas requisicoes" } });
const webhookLimiter = rateLimit({ windowMs: 60 * 1000, max: 5000 });

app.use("/api/auth", apiLimiter, authRoutes);
app.use("/api/leads", apiLimiter, leadsRoutes);
app.use("/api/conversations", apiLimiter, conversationsRoutes);
app.use("/api/payments", apiLimiter, paymentsRoutes);
app.use("/api/webhooks", webhookLimiter, webhooksRoutes);
app.use("/api/dashboard", apiLimiter, dashboardRoutes);
app.use("/api/users", apiLimiter, usersRoutes);
app.use("/api/templates", apiLimiter, templatesRoutes);
app.use("/api/automation", automationRoutes);
app.use("/api/analytics", apiLimiter, analyticsRoutes);
app.use("/api/meta", apiLimiter, metaRoutes);

app.get("/api/health", (_req, res) => { res.json({ status: "ok", timestamp: new Date().toISOString() }); });
app.use((_req, res) => { res.status(404).json({ error: "Rota nao encontrada" }); });

app.listen(PORT, () => { console.log("Consulta Credito API rodando na porta " + PORT); });
export default app;

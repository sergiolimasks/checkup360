import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on("error", (err) => {
  console.error("Erro inesperado no pool PostgreSQL:", err);
});

const SCHEMA = process.env.DATABASE_SCHEMA || "consulta_credito";

export const query = async (text: string, params?: any[]) => {
  const client = await pool.connect();
  try {
    await client.query(`SET search_path TO ${SCHEMA}, public`);
    const start = Date.now();
    const result = await client.query(text, params);
    const duration = Date.now() - start;
    if (duration > 1000) console.warn(`Query lenta (${duration}ms):`, text.substring(0, 100));
    return result;
  } finally {
    client.release();
  }
};

export const getClient = () => pool.connect();
export default pool;

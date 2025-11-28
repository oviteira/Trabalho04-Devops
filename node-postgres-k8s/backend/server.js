import express from "express";
import pkg from "pg";
const { Pool } = pkg;

const {
  DB_HOST = "localhost",
  DB_PORT = "5432",
  DB_NAME = "appdb",
  DB_USER = "appuser",
  DB_PASSWORD = "apppassword",
  PORT = 3000
} = process.env;

const pool = new Pool({
  host: DB_HOST,
  port: Number(DB_PORT),
  database: DB_NAME,
  user: DB_USER,
  password: DB_PASSWORD,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users(
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  console.log("Tabela 'users' pronta.");
}

const app = express();
app.use(express.json());

app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", db: "connected" });
  } catch (e) {
    res.status(500).json({ status: "error", error: e.message });
  }
});

app.get("/users", async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT id, name, created_at FROM users ORDER BY id DESC");
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/users", async (req, res) => {
  try {
    const name = req.body?.name ?? "Anon";
    const { rows } = await pool.query("INSERT INTO users(name) VALUES($1) RETURNING *", [name]);
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

init()
  .then(() => {
    app.listen(PORT, "0.0.0.0", () => console.log(`API on :${PORT}`));
  })
  .catch(err => {
    console.error("Falha ao inicializar:", err);
    process.exit(1);
  });

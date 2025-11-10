import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: String(process.env.DB_PASSWORD || ""), // 👈 ensure string
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

export default pool;

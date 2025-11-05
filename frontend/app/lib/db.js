import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: process.env.DB_USER,        // Your PostgreSQL username
  host: process.env.DB_HOST,        // Usually 'localhost'
  database: process.env.DB_NAME,    // Your database name
  password: process.env.DB_PASSWORD,// Your PostgreSQL password
  port: process.env.DB_PORT || 5432,// Default port
});

export default pool;

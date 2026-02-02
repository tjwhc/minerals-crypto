import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : undefined,
});

let initialized = false;

const init = async () => {
  if (initialized) return;
  initialized = true;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS metal_prices (
      id SERIAL PRIMARY KEY,
      code TEXT NOT NULL,
      price_usd DOUBLE PRECISION NOT NULL,
      ts BIGINT NOT NULL
    );
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_metal_prices_code_ts ON metal_prices(code, ts);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS metal_prices_daily (
      id SERIAL PRIMARY KEY,
      code TEXT NOT NULL,
      price_usd DOUBLE PRECISION NOT NULL,
      day TEXT NOT NULL,
      UNIQUE (code, day)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      verified BOOLEAN NOT NULL DEFAULT FALSE,
      verification_token TEXT,
      stripe_customer_id TEXT,
      subscription_tier TEXT DEFAULT 'free',
      subscription_status TEXT DEFAULT 'inactive',
      created_at BIGINT NOT NULL
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      expires_at BIGINT NOT NULL
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS alerts (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      code TEXT NOT NULL,
      condition TEXT NOT NULL,
      threshold DOUBLE PRECISION NOT NULL,
      email TEXT NOT NULL,
      created_at BIGINT NOT NULL,
      last_triggered BIGINT
    );
  `);
};

export const query = async (text: string, params?: any[]) => {
  await init();
  return pool.query(text, params);
};

export const getClient = async () => {
  await init();
  return pool.connect();
};

export { pool };

export default {
  query,
  getClient,
  pool,
};

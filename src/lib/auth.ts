import db from "@/lib/db";
import crypto from "crypto";
import bcrypt from "bcryptjs";

const SESSION_DAYS = 7;

export const createSession = async (userId: number) => {
  const token = crypto.randomBytes(24).toString("hex");
  const expiresAt = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  await db.query("INSERT INTO sessions (token, user_id, expires_at) VALUES ($1, $2, $3)", [
    token,
    userId,
    expiresAt,
  ]);
  return { token, expiresAt };
};

export const getSessionUser = async (token: string) => {
  if (!token) return null;
  const sessionRes = await db.query("SELECT user_id, expires_at FROM sessions WHERE token = $1", [
    token,
  ]);
  const session = sessionRes.rows[0] as { user_id: number; expires_at: number } | undefined;
  if (!session) return null;
  if (session.expires_at < Date.now()) return null;
  const userRes = await db.query("SELECT * FROM users WHERE id = $1", [session.user_id]);
  return userRes.rows[0] || null;
};

export const hashPassword = async (password: string) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (password: string, hash: string) => {
  return bcrypt.compare(password, hash);
};

export const createVerificationToken = () => crypto.randomBytes(20).toString("hex");

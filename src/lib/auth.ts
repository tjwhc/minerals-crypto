import db from "@/lib/db";
import crypto from "crypto";
import bcrypt from "bcryptjs";

const SESSION_DAYS = 7;

export const createSession = (userId: number) => {
  const token = crypto.randomBytes(24).toString("hex");
  const expiresAt = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const stmt = db.prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)");
  stmt.run(token, userId, expiresAt);
  return { token, expiresAt };
};

export const getSessionUser = (token: string) => {
  if (!token) return null;
  const session = db.prepare("SELECT user_id, expires_at FROM sessions WHERE token = ?").get(token) as
    | { user_id: number; expires_at: number }
    | undefined;
  if (!session) return null;
  if (session.expires_at < Date.now()) return null;
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(session.user_id);
  return user || null;
};

export const hashPassword = async (password: string) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (password: string, hash: string) => {
  return bcrypt.compare(password, hash);
};

export const createVerificationToken = () => crypto.randomBytes(20).toString("hex");

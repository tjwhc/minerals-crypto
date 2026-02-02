import { NextResponse } from "next/server";
import db from "@/lib/db";
import { createSession, createVerificationToken, hashPassword } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: "Missing email or password" }, { status: 400 });
  }

  const existingRes = await db.query("SELECT id FROM users WHERE email = $1", [email]);
  if (existingRes.rows[0]) {
    return NextResponse.json({ error: "Email already registered" }, { status: 400 });
  }

  const passwordHash = await hashPassword(password);
  const token = createVerificationToken();
  const createdAt = Date.now();

  const insertRes = await db.query(
    "INSERT INTO users (email, password_hash, verified, verification_token, created_at) VALUES ($1, $2, FALSE, $3, $4) RETURNING id",
    [email, passwordHash, token, createdAt]
  );
  const userId = insertRes.rows[0]?.id as number;

  const { token: sessionToken, expiresAt } = await createSession(userId);

  const verifyUrl = `${process.env.APP_URL || "https://mineralscrypto.onrender.com"}/api/auth/verify?token=${token}`;
  await sendEmail({
    to: email,
    subject: "Verify your email",
    html: `<p>Click to verify your email:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
  });

  const res = NextResponse.json({ ok: true });
  res.cookies.set("session", sessionToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    expires: new Date(expiresAt),
  });
  return res;
}

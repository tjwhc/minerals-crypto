import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const userRes = await db.query("SELECT id FROM users WHERE verification_token = $1", [token]);
  const user = userRes.rows[0] as any;
  if (!user) return NextResponse.json({ error: "Invalid token" }, { status: 400 });

  await db.query("UPDATE users SET verified = TRUE, verification_token = NULL WHERE id = $1", [user.id]);
  return NextResponse.redirect("/pricing");
}

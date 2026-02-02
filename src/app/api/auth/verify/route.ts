import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const user = db.prepare("SELECT id FROM users WHERE verification_token = ?").get(token) as any;
  if (!user) return NextResponse.json({ error: "Invalid token" }, { status: 400 });

  db.prepare("UPDATE users SET verified = 1, verification_token = NULL WHERE id = ?").run(user.id);
  return NextResponse.redirect("/pricing");
}

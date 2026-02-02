import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function POST(req: Request) {
  const token = req.headers.get("cookie")?.match(/session=([^;]+)/)?.[1];
  if (token) {
    db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set("session", "", { expires: new Date(0) });
  return res;
}

import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  const token = req.headers.get("cookie")?.match(/session=([^;]+)/)?.[1] || "";
  const user = getSessionUser(token) as any;
  if (!user || user.subscription_status !== "active") {
    return NextResponse.json({ error: "Pro required" }, { status: 403 });
  }

  const { code, condition, threshold, email } = await req.json();
  if (!code || !condition || !threshold || !email) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  db.prepare(
    "INSERT INTO alerts (user_id, code, condition, threshold, email, created_at) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(user.id, code, condition, threshold, email, Date.now());

  await sendEmail({
    to: email,
    subject: "Alert created",
    html: `<p>Alert created for ${code} ${condition} ${threshold}.</p>`,
  });

  return NextResponse.json({ ok: true });
}

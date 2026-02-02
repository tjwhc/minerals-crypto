import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getSessionUser } from "@/lib/auth";
import db from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", { apiVersion: "2026-01-28.clover" });

export async function POST(req: Request) {
  const token = req.headers.get("cookie")?.match(/session=([^;]+)/)?.[1] || "";
  const user = getSessionUser(token) as any;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let customerId = user.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({ email: user.email });
    customerId = customer.id;
    db.prepare("UPDATE users SET stripe_customer_id = ? WHERE id = ?").run(customerId, user.id);
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.APP_URL || "https://mineralscrypto.onrender.com"}/account`,
  });

  return NextResponse.json({ url: session.url });
}

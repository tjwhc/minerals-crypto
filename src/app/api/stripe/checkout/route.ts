import { NextResponse } from "next/server";
import Stripe from "stripe";
import db from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", { apiVersion: "2026-01-28.clover" });

export async function POST(req: Request) {
  const { plan } = await req.json();
  const token = req.headers.get("cookie")?.match(/session=([^;]+)/)?.[1] || "";
  const user = getSessionUser(token) as any;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (plan === "student" && !String(user.email).endsWith(".edu")) {
    return NextResponse.json({ error: "Student plan requires .edu email" }, { status: 400 });
  }

  const priceId = plan === "student" ? process.env.STRIPE_PRICE_STUDENT : process.env.STRIPE_PRICE_PRO;
  if (!priceId) return NextResponse.json({ error: "Missing price ID" }, { status: 500 });

  let customerId = user.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({ email: user.email });
    customerId = customer.id;
    db.prepare("UPDATE users SET stripe_customer_id = ? WHERE id = ?").run(customerId, user.id);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.APP_URL || "https://mineralscrypto.onrender.com"}/pricing?success=1`,
    cancel_url: `${process.env.APP_URL || "https://mineralscrypto.onrender.com"}/pricing?canceled=1`,
  });

  return NextResponse.json({ url: session.url });
}

import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import db from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", { apiVersion: "2026-01-28.clover" });

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature") || "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET || "");
  } catch (err: any) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const customerId = session.customer as string;
    await db.query(
      "UPDATE users SET subscription_status = 'active', subscription_tier = 'pro' WHERE stripe_customer_id = $1",
      [customerId]
    );

    // If student price, mark student tier
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
    const priceId = lineItems.data[0]?.price?.id;
    if (priceId === process.env.STRIPE_PRICE_STUDENT) {
      await db.query("UPDATE users SET subscription_tier = 'student' WHERE stripe_customer_id = $1", [
        customerId,
      ]);
    }

    await db.query("UPDATE users SET subscription_status = 'active' WHERE stripe_customer_id = $1", [
      customerId,
    ]);
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    const customerId = subscription.customer as string;
    const status = subscription.status;
    const active = status === "active" || status === "trialing";
    await db.query(
      "UPDATE users SET subscription_status = $1, subscription_tier = $2 WHERE stripe_customer_id = $3",
      [active ? "active" : "inactive", active ? "pro" : "free", customerId]
    );
  }

  return new Response("ok", { status: 200 });
}

import Stripe from "stripe";
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
    const subscriptionId = session.subscription as string;
    db.prepare(
      "UPDATE users SET subscription_status = 'active', subscription_tier = 'pro' WHERE stripe_customer_id = ?"
    ).run(customerId);

    // If student price, mark student tier
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
    const priceId = lineItems.data[0]?.price?.id;
    if (priceId === process.env.STRIPE_PRICE_STUDENT) {
      db.prepare("UPDATE users SET subscription_tier = 'student' WHERE stripe_customer_id = ?").run(customerId);
    }

    db.prepare("UPDATE users SET subscription_status = 'active' WHERE stripe_customer_id = ?").run(customerId);
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    const customerId = subscription.customer as string;
    const status = subscription.status;
    const active = status === "active" || status === "trialing";
    db.prepare(
      "UPDATE users SET subscription_status = ?, subscription_tier = ? WHERE stripe_customer_id = ?"
    ).run(active ? "active" : "inactive", active ? "pro" : "free", customerId);
  }

  return new Response("ok", { status: 200 });
}

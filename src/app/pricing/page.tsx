"use client";

import { useState } from "react";

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);

  const startCheckout = async (plan: "pro" | "student") => {
    setLoading(plan);
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const json = await res.json();
    if (json?.url) window.location.href = json.url;
    setLoading(null);
  };
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <header className="mb-10">
          <p className="text-sm uppercase tracking-[0.2em] text-zinc-400">Pricing</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Plans for traders & students</h1>
          <p className="mt-3 text-sm text-zinc-400">
            Free stays free. Pro unlocks real‑time data, longer history, and alerts.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-semibold">Free</h2>
            <p className="mt-2 text-3xl font-semibold">$0</p>
            <ul className="mt-4 space-y-2 text-sm text-zinc-300">
              <li>Delayed prices</li>
              <li>Short history</li>
              <li>Core charts</li>
            </ul>
            <button className="mt-6 w-full rounded-full border border-white/10 px-4 py-2 text-sm text-white">
              Current plan
            </button>
          </div>

          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-6">
            <h2 className="text-lg font-semibold">Pro</h2>
            <p className="mt-2 text-3xl font-semibold">$12 / mo</p>
            <ul className="mt-4 space-y-2 text-sm text-zinc-200">
              <li>Real‑time metals & crypto</li>
              <li>Full metals list</li>
              <li>Longer history + export</li>
              <li>Price alerts (email)</li>
            </ul>
            <button
              onClick={() => startCheckout("pro")}
              className="mt-6 w-full rounded-full bg-emerald-400/90 px-4 py-2 text-sm font-semibold text-zinc-900"
            >
              {loading === "pro" ? "Redirecting..." : "Start Pro (Stripe)"}
            </button>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-semibold">Student</h2>
            <p className="mt-2 text-3xl font-semibold">$6 / mo</p>
            <p className="mt-1 text-xs text-zinc-400">Requires .edu email</p>
            <ul className="mt-4 space-y-2 text-sm text-zinc-300">
              <li>Everything in Pro</li>
              <li>Academic use supported</li>
            </ul>
            <button
              onClick={() => startCheckout("student")}
              className="mt-6 w-full rounded-full border border-white/10 px-4 py-2 text-sm text-white"
            >
              {loading === "student" ? "Redirecting..." : "Verify .edu"}
            </button>
          </div>
        </div>

        <section className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-zinc-400">
          <h3 className="text-base font-semibold text-white">Notes</h3>
          <ul className="mt-3 space-y-2">
            <li>Free plan stays available with ad‑supported access.</li>
            <li>Student pricing is valid while your .edu email remains active.</li>
            <li>Affiliate or broker links may appear later as sponsored placements.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}

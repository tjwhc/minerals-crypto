"use client";

import { useState } from "react";

export default function AlertsPage() {
  const [code, setCode] = useState("XAU");
  const [condition, setCondition] = useState("above");
  const [threshold, setThreshold] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const createAlert = async () => {
    setMessage(null);
    const res = await fetch("/api/alerts/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, condition, threshold: Number(threshold), email }),
    });
    const json = await res.json();
    if (res.ok) setMessage("Alert created.");
    else setMessage(json?.error || "Failed to create alert");
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <header className="mb-8">
          <p className="text-sm uppercase tracking-[0.2em] text-zinc-400">Alerts</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Email price alerts</h1>
          <p className="mt-3 text-sm text-zinc-400">
            Set alerts for metals and crypto. Email delivery for now; Telegram/Discord later.
          </p>
        </header>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-zinc-400">Metal/Crypto</label>
              <select
                className="mt-2 w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              >
                <option value="XAU">Gold (XAU)</option>
                <option value="XAG">Silver (XAG)</option>
                <option value="XPT">Platinum (XPT)</option>
                <option value="XPD">Palladium (XPD)</option>
              </select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-zinc-400">Condition</label>
              <select
                className="mt-2 w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
              >
                <option value="above">Price above</option>
                <option value="below">Price below</option>
              </select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-zinc-400">Threshold</label>
              <input
                className="mt-2 w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white"
                placeholder="e.g., 2500"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-zinc-400">Email</label>
              <input
                className="mt-2 w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white"
                placeholder="you@school.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <button
            onClick={createAlert}
            className="mt-6 rounded-full bg-emerald-400/90 px-5 py-2 text-sm font-semibold text-zinc-900"
          >
            Create Alert (Pro)
          </button>
          {message && <p className="mt-3 text-sm text-zinc-300">{message}</p>}
        </div>
      </div>
    </div>
  );
}

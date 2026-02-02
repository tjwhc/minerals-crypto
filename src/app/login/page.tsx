"use client";

import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) {
      window.location.href = "/pricing";
    } else {
      const json = await res.json();
      setError(json?.error || "Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-md px-6 py-12">
        <h1 className="text-3xl font-semibold">Log in</h1>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <input
            className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white"
            type="password"
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="text-sm text-red-300">{error}</p>}
          <button className="w-full rounded-full bg-emerald-400/90 px-4 py-2 text-sm font-semibold text-zinc-900">
            Log in
          </button>
          <a href="/register" className="block text-center text-xs text-zinc-400 hover:text-white">
            Create account
          </a>
        </form>
      </div>
    </div>
  );
}

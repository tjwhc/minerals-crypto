"use client";

import { useEffect, useState } from "react";

type User = {
  email: string;
  verified: boolean;
  subscription_tier: string;
  subscription_status: string;
};

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        setUser(d.user);
        setLoading(false);
      });
  }, []);

  const manageBilling = async () => {
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const json = await res.json();
    if (json?.url) window.location.href = json.url;
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  };

  if (loading) {
    return <div className="min-h-screen bg-zinc-950 text-zinc-100" />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100">
        <div className="mx-auto max-w-md px-6 py-12">
          <h1 className="text-2xl font-semibold">Account</h1>
          <p className="mt-2 text-sm text-zinc-400">Please log in to view your account.</p>
          <a href="/login" className="mt-4 inline-block text-sm text-emerald-200">
            Log in
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-md px-6 py-12">
        <h1 className="text-2xl font-semibold">Account</h1>
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
          <p>Email: {user.email}</p>
          <p>Verified: {user.verified ? "Yes" : "No"}</p>
          <p>Plan: {user.subscription_tier}</p>
          <p>Status: {user.subscription_status}</p>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={manageBilling}
            className="rounded-full bg-emerald-400/90 px-4 py-2 text-sm font-semibold text-zinc-900"
          >
            Manage billing
          </button>
          <button
            onClick={logout}
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-white"
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}

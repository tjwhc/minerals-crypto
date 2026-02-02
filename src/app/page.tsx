"use client";

import { useEffect, useMemo, useState } from "react";

type MetalRow = {
  name: string;
  code: string;
  priceUsd: number | null;
  status: string;
};

type CryptoRow = {
  id: string;
  symbol: string;
  name: string;
  priceUsd: number;
  volume24h: number;
};

type ApiPayload = {
  updatedAt: string;
  metals: MetalRow[];
  crypto: CryptoRow[];
  sources: { metals: string; crypto: string };
};

const REFRESH_MS = 5 * 60 * 1000;

export default function Home() {
  const [data, setData] = useState<ApiPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/prices", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || "Failed to load prices");
      }
      setData(json);
    } catch (err: any) {
      setError(err?.message || "Failed to load prices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, REFRESH_MS);
    return () => clearInterval(timer);
  }, []);

  const lastUpdated = useMemo(() => {
    if (!data?.updatedAt) return "—";
    return new Date(data.updatedAt).toLocaleString();
  }, [data?.updatedAt]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-zinc-400">
              Live market dashboard
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-white">
              Metals & Crypto Prices (USD)
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              Updates every 5 minutes + on page load
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              className="rounded-full bg-white/10 px-5 py-2 text-sm font-medium text-white hover:bg-white/20"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </header>

        <section className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Metals (Top 30)</h2>
              <span className="text-xs text-zinc-400">Source: {data?.sources?.metals || "—"}</span>
            </div>
            <div className="mt-4 overflow-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-zinc-400">
                  <tr>
                    <th className="py-2">Metal</th>
                    <th className="py-2">Code</th>
                    <th className="py-2 text-right">USD</th>
                    <th className="py-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.metals?.map((m) => (
                    <tr key={m.code} className="border-t border-white/5">
                      <td className="py-2 text-white">{m.name}</td>
                      <td className="py-2 text-zinc-300">{m.code}</td>
                      <td className="py-2 text-right text-white">
                        {m.priceUsd ? m.priceUsd.toLocaleString(undefined, { maximumFractionDigits: 4 }) : "—"}
                      </td>
                      <td className="py-2 text-right">
                        {m.status === "ok" ? (
                          <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-xs text-emerald-200">OK</span>
                        ) : (
                          <span className="rounded-full bg-amber-500/20 px-2 py-1 text-xs text-amber-200">
                            Source Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!data && !error && (
                <p className="mt-4 text-sm text-zinc-400">Loading metals...</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Top 10 Crypto (24h Volume)</h2>
              <span className="text-xs text-zinc-400">Source: {data?.sources?.crypto || "—"}</span>
            </div>
            <div className="mt-4 overflow-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-zinc-400">
                  <tr>
                    <th className="py-2">Coin</th>
                    <th className="py-2">Symbol</th>
                    <th className="py-2 text-right">USD</th>
                    <th className="py-2 text-right">24h Volume</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.crypto?.map((c) => (
                    <tr key={c.id} className="border-t border-white/5">
                      <td className="py-2 text-white">{c.name}</td>
                      <td className="py-2 text-zinc-300">{c.symbol}</td>
                      <td className="py-2 text-right text-white">
                        {c.priceUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 text-right text-zinc-300">
                        {c.volume24h.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!data && !error && (
                <p className="mt-4 text-sm text-zinc-400">Loading crypto...</p>
              )}
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-zinc-400">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>Last updated: {lastUpdated}</div>
            <div className="text-xs">
              Missing metals will show “Source Pending” until upgraded to paid data providers.
            </div>
          </div>
        </section>

        {error && (
          <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import MetalHistoryChart from "@/components/MetalHistoryChart";
import Adsense from "@/components/Adsense";

type MetalRow = {
  name: string;
  code: string;
  priceUsd: number | null;
  status: string;
  sparkline1d: number[];
  sparkline7d: number[];
};

type CryptoRow = {
  id: string;
  symbol: string;
  name: string;
  priceUsd: number;
  volume24h: number;
  sparkline: number[];
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
  const [user, setUser] = useState<any>(null);
  const [selectedCryptoId, setSelectedCryptoId] = useState<string>("");
  const [usdAmount, setUsdAmount] = useState<string>("1");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMetal, setModalMetal] = useState<string | null>(null);
  const [modalSeries, setModalSeries] = useState<Array<{ time: number; value: number; volume: number }>>([]);
  const [modalRange, setModalRange] = useState<"1d" | "7d">("1d");
  const [trendRange, setTrendRange] = useState<"1d" | "7d">("1d");
  const [modalLoading, setModalLoading] = useState(false);

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
      if (!selectedCryptoId && json?.crypto?.length) {
        setSelectedCryptoId(json.crypto[0].id);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load prices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch("/api/auth/me").then(r=>r.json()).then(d=>setUser(d.user));
  }, []);

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, REFRESH_MS);
    return () => clearInterval(timer);
  }, []);

  const lastUpdated = useMemo(() => {
    if (!data?.updatedAt) return "—";
    return new Date(data.updatedAt).toLocaleString();
  }, [data?.updatedAt]);

  const selectedCrypto = useMemo(() => {
    if (!data?.crypto?.length) return null;
    return data.crypto.find((c) => c.id === selectedCryptoId) || data.crypto[0];
  }, [data?.crypto, selectedCryptoId]);

  const usdToCrypto = useMemo(() => {
    if (!selectedCrypto?.priceUsd) return null;
    return 1 / selectedCrypto.priceUsd;
  }, [selectedCrypto]);

  const usdAmountNumber = useMemo(() => {
    const value = Number(usdAmount);
    return Number.isFinite(value) ? value : 0;
  }, [usdAmount]);

  const convertedAmount = useMemo(() => {
    if (!selectedCrypto?.priceUsd) return null;
    return usdAmountNumber / selectedCrypto.priceUsd;
  }, [usdAmountNumber, selectedCrypto]);

  const goldPriceUsd = useMemo(() => {
    return data?.metals?.find((m) => m.code === "XAU")?.priceUsd ?? null;
  }, [data?.metals]);

  const goldToCrypto = useMemo(() => {
    if (!goldPriceUsd || !selectedCrypto?.priceUsd) return null;
    return goldPriceUsd / selectedCrypto.priceUsd;
  }, [goldPriceUsd, selectedCrypto]);

  const goldToCryptoHistory = useMemo(() => {
    if (!data?.metals?.length || !selectedCrypto?.sparkline?.length) return [];
    const goldSpark = data.metals.find((m) => m.code === "XAU")?.[trendRange === "1d" ? "sparkline1d" : "sparkline7d"] || [];
    const cryptoSpark = selectedCrypto.sparkline || [];
    const len = Math.min(goldSpark.length, cryptoSpark.length);
    if (len < 2) return [];
    return Array.from({ length: len }, (_, i) => goldSpark[i] / cryptoSpark[i]);
  }, [data?.metals, selectedCrypto, trendRange]);

  const silverPriceUsd = useMemo(() => {
    return data?.metals?.find((m) => m.code === "XAG")?.priceUsd ?? null;
  }, [data?.metals]);

  const silverToCrypto = useMemo(() => {
    if (!silverPriceUsd || !selectedCrypto?.priceUsd) return null;
    return silverPriceUsd / selectedCrypto.priceUsd;
  }, [silverPriceUsd, selectedCrypto]);

  const silverToCryptoHistory = useMemo(() => {
    if (!data?.metals?.length || !selectedCrypto?.sparkline?.length) return [];
    const silverSpark = data.metals.find((m) => m.code === "XAG")?.[trendRange === "1d" ? "sparkline1d" : "sparkline7d"] || [];
    const cryptoSpark = selectedCrypto.sparkline || [];
    const len = Math.min(silverSpark.length, cryptoSpark.length);
    if (len < 2) return [];
    return Array.from({ length: len }, (_, i) => silverSpark[i] / cryptoSpark[i]);
  }, [data?.metals, selectedCrypto, trendRange]);

  const Sparkline = ({ values }: { values: number[] }) => {
    const series = values || [];
    if (series.length < 2) {
      return <div className="h-6 w-20 rounded bg-white/5" />;
    }
    const min = Math.min(...series);
    const max = Math.max(...series);
    const range = max - min || 1;
    const points = series
      .map((v, i) => {
        const x = (i / (series.length - 1)) * 80;
        const y = 24 - ((v - min) / range) * 24;
        return `${x},${y}`;
      })
      .join(" ");

    return (
      <svg width="80" height="24" viewBox="0 0 80 24" className="text-emerald-300">
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          points={points}
        />
      </svg>
    );
  };

  const Chart = ({ values }: { values: number[] }) => {
    if (!values || values.length < 2) {
      return <div className="h-48 w-full rounded bg-white/5" />;
    }
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const width = 640;
    const height = 200;
    const points = values
      .map((v, i) => {
        const x = (i / (values.length - 1)) * width;
        const y = height - ((v - min) / range) * height;
        return `${x},${y}`;
      })
      .join(" ");

    return (
      <svg width="100%" height="220" viewBox={`0 0 ${width} ${height}`} className="text-emerald-300">
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          points={points}
        />
      </svg>
    );
  };

  const openHistory = async (metal: string, range: "1d" | "7d" = "1d") => {
    try {
      setModalOpen(true);
      setModalMetal(metal);
      setModalRange(range);
      setModalLoading(true);
      setModalSeries([]);
      const res = await fetch(`/api/metal-history?code=${metal}&range=${range}`);
      const json = await res.json();
      const series = Array.isArray(json?.series)
        ? json.series.map((p: { ts: number; price_usd: number; volume: number }) => ({
            time: Math.floor(p.ts / 1000),
            value: p.price_usd,
            volume: p.volume || 1,
          }))
        : [];
      setModalSeries(series);
    } catch {
      setModalSeries([]);
    } finally {
      setModalLoading(false);
    }
  };

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
            <a href="/pricing" className="text-xs text-zinc-400 hover:text-white">Pricing</a>
            <a href="/alerts" className="text-xs text-zinc-400 hover:text-white">Alerts</a>
            <a href="/account" className="text-xs text-zinc-400 hover:text-white">Account</a>
            <a href="/legal/disclaimer" className="text-xs text-zinc-400 hover:text-white">Disclaimer</a>
            <button
              onClick={loadData}
              className="rounded-full bg-white/10 px-5 py-2 text-sm font-medium text-white hover:bg-white/20"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </header>

        {(!user || user?.subscription_status !== "active") && (
          <Adsense slot={process.env.NEXT_PUBLIC_ADSENSE_TOP || ""} className="my-6" />
        )}

        <section className="mt-8 grid gap-6 md:grid-cols-[2fr_1fr]">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Metals (Stooq 13)</h2>
              <span className="text-xs text-zinc-400">Source: {data?.sources?.metals || "—"}</span>
            </div>
            <div className="mt-4 space-y-3 md:hidden">
              {data?.metals?.map((m) => (
                <div key={m.code} className="rounded-xl border border-white/10 bg-zinc-900/40 p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-white">
                      <button
                        type="button"
                        onClick={() => openHistory(m.code, "1d")}
                        className="text-emerald-200 hover:underline"
                      >
                        {m.name}
                      </button>
                    </div>
                    <span className="text-xs text-zinc-400">{m.code}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-lg font-semibold text-white">
                      {m.priceUsd && selectedCrypto?.priceUsd
                        ? `${(m.priceUsd / selectedCrypto.priceUsd).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })} ${selectedCrypto.symbol}`
                        : "—"}
                    </div>
                    <div className="flex items-center gap-2">
                      <Sparkline values={trendRange === "1d" ? m.sparkline1d : m.sparkline7d} />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-zinc-400">
                    <span>{m.status === "ok" ? "OK" : "Source Pending"}</span>
                    <span>{trendRange === "1d" ? "1d trend" : "7d trend"}</span>
                  </div>
                </div>
              ))}
              {!data && !error && (
                <p className="mt-4 text-sm text-zinc-400">Loading metals...</p>
              )}
            </div>

            <div className="mt-4 hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead className="text-left text-zinc-400">
                  <tr>
                    <th className="py-2">Metal</th>
                    <th className="py-2 hidden sm:table-cell">Code</th>
                    <th className="py-2 text-right">Value</th>
                    <th className="py-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-xs text-zinc-400">Trend</span>
                        <div className="flex items-center rounded-full border border-white/10 p-1 text-xs">
                          <button
                            onClick={() => setTrendRange("1d")}
                            className={`rounded-full px-2 py-0.5 ${
                              trendRange === "1d" ? "bg-emerald-500/20 text-emerald-200" : "text-zinc-400"
                            }`}
                          >
                            1D
                          </button>
                          <button
                            onClick={() => setTrendRange("7d")}
                            className={`rounded-full px-2 py-0.5 ${
                              trendRange === "7d" ? "bg-emerald-500/20 text-emerald-200" : "text-zinc-400"
                            }`}
                          >
                            7D
                          </button>
                        </div>
                      </div>
                    </th>
                    <th className="py-2 text-right hidden sm:table-cell">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.metals?.map((m) => (
                    <tr key={m.code} className="border-t border-white/5">
                      <td className="py-2 text-white">
                        <button
                          type="button"
                          onClick={() => openHistory(m.code, "1d")}
                          className="text-emerald-200 hover:underline"
                        >
                          {m.name}
                        </button>
                      </td>
                      <td className="py-2 text-zinc-300 hidden sm:table-cell">{m.code}</td>
                      <td className="py-2 text-right text-white">
                        {m.priceUsd && selectedCrypto?.priceUsd
                          ? `${(m.priceUsd / selectedCrypto.priceUsd).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })} ${selectedCrypto.symbol}`
                          : "—"}
                      </td>
                      <td className="py-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Sparkline values={trendRange === "1d" ? m.sparkline1d : m.sparkline7d} />
                        </div>
                      </td>
                      <td className="py-2 text-right hidden sm:table-cell">
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
              <h2 className="text-lg font-semibold">USD → Crypto</h2>
              <span className="text-xs text-zinc-400">Source: {data?.sources?.crypto || "—"}</span>
            </div>

            <div className="mt-4 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <label className="text-xs uppercase tracking-[0.2em] text-zinc-400">Select coin</label>
                <button
                  onClick={() => setSelectedCryptoId("bitcoin")}
                  className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-200 hover:bg-white/10"
                >
                  BTC Quick
                </button>
              </div>
              <select
                className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white"
                value={selectedCrypto?.id || ""}
                onChange={(e) => setSelectedCryptoId(e.target.value)}
              >
                {data?.crypto?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.symbol})
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={usdAmount}
                  onChange={(e) => setUsdAmount(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white"
                  placeholder="USD amount"
                />
                <span className="text-sm text-zinc-400">USD</span>
              </div>

              <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-4">
                <p className="text-sm text-zinc-400">{usdAmountNumber || 0} USD equals</p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {convertedAmount
                    ? `${convertedAmount.toLocaleString(undefined, { maximumFractionDigits: 8 })} ${
                        selectedCrypto?.symbol || ""
                      }`
                    : "—"}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-xs text-zinc-500">
                    Price: {selectedCrypto?.priceUsd?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || "—"} USD
                  </p>
                  <Sparkline values={selectedCrypto?.sparkline || []} />
                </div>
                <p className="mt-3 text-xs text-zinc-500">
                  1 USD = {usdToCrypto ? usdToCrypto.toLocaleString(undefined, { maximumFractionDigits: 8 }) : "—"} {selectedCrypto?.symbol || ""}
                </p>
              </div>
            </div>
          </div>
        </section>

        {(!user || user?.subscription_status !== "active") && (
          <Adsense slot={process.env.NEXT_PUBLIC_ADSENSE_MID || ""} className="my-6" />
        )}

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

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
          <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-zinc-950 p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {modalMetal === "XAU" ? "Gold" : "Silver"} Price History (USD)
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-200 hover:bg-white/10"
              >
                Close
              </button>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={() => modalMetal && openHistory(modalMetal, "1d")}
                className={`rounded-full border px-3 py-1 text-xs ${
                  modalRange === "1d" ? "border-emerald-400 text-emerald-200" : "border-white/10 text-zinc-200"
                }`}
              >
                1D
              </button>
              <button
                onClick={() => modalMetal && openHistory(modalMetal, "7d")}
                className={`rounded-full border px-3 py-1 text-xs ${
                  modalRange === "7d" ? "border-emerald-400 text-emerald-200" : "border-white/10 text-zinc-200"
                }`}
              >
                7D
              </button>
            </div>
            <div className="mt-4">
              {modalLoading ? (
                <div className="h-48 w-full rounded bg-white/5" />
              ) : modalSeries.length ? (
                <MetalHistoryChart data={modalSeries} />
              ) : (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-300">
                  No history yet — the server will accumulate snapshots.
                </div>
              )}
            </div>
            <p className="mt-3 text-xs text-zinc-500">Source: stooq.com (5‑min + daily snapshots)</p>
          </div>
        </div>
      )}
    </div>
  );
}

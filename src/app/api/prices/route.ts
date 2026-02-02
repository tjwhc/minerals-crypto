import { NextResponse } from "next/server";
import { METALS_LIST, METALS_CODES } from "@/lib/metals";

type CachedPayload = {
  updatedAt: string;
  metals: Array<{ name: string; code: string; priceUsd: number | null; status: string }>;
  crypto: Array<{ id: string; symbol: string; name: string; priceUsd: number; volume24h: number }>;
  sources: { metals: string; crypto: string };
};

const CACHE_TTL_MS = 5 * 60 * 1000;
let cache: { ts: number; payload: CachedPayload } | null = null;

export async function GET() {
  const now = Date.now();
  if (cache && now - cache.ts < CACHE_TTL_MS) {
    return NextResponse.json(cache.payload);
  }

  const metalsKey = process.env.METALS_API_KEY;
  const metalsBaseUrl = process.env.METALS_API_BASE || "https://metals-api.com/api";
  const cryptoBaseUrl = "https://api.coingecko.com/api/v3";

  const cryptoUrl = `${cryptoBaseUrl}/coins/markets?vs_currency=usd&order=volume_desc&per_page=10&page=1&sparkline=false`;

  const [metalsRes, cryptoRes] = await Promise.all([
    metalsKey
      ? fetch(`${metalsBaseUrl}/latest?access_key=${metalsKey}&base=USD&symbols=${METALS_CODES.join(",")}`, {
          next: { revalidate: 0 },
        })
      : null,
    fetch(cryptoUrl, { next: { revalidate: 0 } }),
  ]);

  const metalsJson = metalsRes ? await metalsRes.json() : null;
  const cryptoJson = await cryptoRes.json();

  const rates: Record<string, number> = metalsJson?.rates || {};

  const metals = METALS_LIST.map((item) => {
    const value = rates[item.code];
    if (!value) {
      return { name: item.name, code: item.code, priceUsd: null, status: "source_pending" };
    }
    // Metals-API: when base=USD, values are quoted as 1 USD = value metal units.
    // Price in USD per metal = 1 / value
    const priceUsd = value ? 1 / value : null;
    return { name: item.name, code: item.code, priceUsd, status: "ok" };
  });

  const crypto = Array.isArray(cryptoJson)
    ? cryptoJson.map((c: any) => ({
        id: c.id,
        symbol: String(c.symbol || "").toUpperCase(),
        name: c.name,
        priceUsd: c.current_price,
        volume24h: c.total_volume,
      }))
    : [];

  const payload: CachedPayload = {
    updatedAt: new Date().toISOString(),
    metals,
    crypto,
    sources: {
      metals: metalsKey ? "metals-api.com (free tier)" : "Not configured",
      crypto: "CoinGecko Demo API",
    },
  };

  cache = { ts: now, payload };

  return NextResponse.json(payload);
}

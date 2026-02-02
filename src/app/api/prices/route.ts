import { NextResponse } from "next/server";
import { METALS_LIST } from "@/lib/metals";
import db from "@/lib/db";
import { toDayString } from "@/lib/date";
import { sendEmail } from "@/lib/email";

type CachedPayload = {
  updatedAt: string;
  metals: Array<{
    name: string;
    code: string;
    priceUsd: number | null;
    status: string;
    sparkline1d: number[];
    sparkline7d: number[];
  }>;
  crypto: Array<{
    id: string;
    symbol: string;
    name: string;
    priceUsd: number;
    volume24h: number;
    sparkline: number[];
  }>;
  sources: { metals: string; crypto: string };
};

const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_POINTS = 20;
const FETCH_INTERVAL_MS = 5 * 60 * 1000;
let cache: { ts: number; payload: CachedPayload } | null = null;
let schedulerStarted = false;

const SYMBOL_MAP: Record<string, string> = {
  "GC.F": "XAU",
  "SI.F": "XAG",
  "PL.F": "XPT",
  "PA.F": "XPD",
  "HG.F": "XCU",
  "Q8.F": "ALU",
  "Q0.F": "NI",
  "O0.F": "ZNC",
  "S4.F": "TIN",
  "R0.F": "LEAD",
  "TR.F": "FE",
  "C-.F": "STEEL",
  "U8.F": "CO",
};

const fetchStooqPrices = async () => {
  const rates: Record<string, number> = {};
  const pageRes = await fetch("https://stooq.com/t/?i=554", { next: { revalidate: 0 } });
  const html = await pageRes.text();
  const rowRegex = /<tr id=r_\d+>[\s\S]*?<\/tr>/g;
  const rows = html.match(rowRegex) || [];

  rows.forEach((row) => {
    const symbolMatch = row.match(/<a href=q\/?s=([^>]+)>([^<]+)<\/a>/i);
    const lastMatch = row.match(/_c\d+>([0-9.,]+)<\/span>/i);
    if (!symbolMatch || !lastMatch) return;
    const symbol = symbolMatch[2].toUpperCase();
    const code = SYMBOL_MAP[symbol];
    if (!code) return;
    const last = Number(lastMatch[1].replace(/,/g, ""));
    if (Number.isFinite(last)) {
      rates[code] = last;
    }
  });

  return rates;
};

const storeSnapshot = async (rates: Record<string, number>) => {
  const ts = Date.now();
  const day = toDayString(ts);
  const client = await db.getClient();
  try {
    await client.query("BEGIN");
    for (const [code, price] of Object.entries(rates)) {
      await client.query("INSERT INTO metal_prices (code, price_usd, ts) VALUES ($1, $2, $3)", [
        code,
        price,
        ts,
      ]);
      await client.query(
        "INSERT INTO metal_prices_daily (code, price_usd, day) VALUES ($1, $2, $3) ON CONFLICT (code, day) DO NOTHING",
        [code, price, day]
      );
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

const ensureScheduler = () => {
  if (schedulerStarted) return;
  schedulerStarted = true;
  const run = async () => {
    try {
      const rates = await fetchStooqPrices();
      if (Object.keys(rates).length) {
        await storeSnapshot(rates);
      }
    } catch {
      // ignore
    }
  };
  run();
  setInterval(run, FETCH_INTERVAL_MS);
};

export async function GET() {
  const now = Date.now();
  ensureScheduler();
  if (cache && now - cache.ts < CACHE_TTL_MS) {
    return NextResponse.json(cache.payload);
  }

  const cryptoBaseUrl = "https://api.coingecko.com/api/v3";
  const cryptoUrl = `${cryptoBaseUrl}/coins/markets?vs_currency=usd&order=volume_desc&per_page=10&page=1&sparkline=true`;
  const cryptoRes = await fetch(cryptoUrl, { next: { revalidate: 0 } });
  const cryptoJson = await cryptoRes.json();

  let rates: Record<string, number> = {};
  try {
    rates = await fetchStooqPrices();
    if (Object.keys(rates).length) {
      await storeSnapshot(rates);
    }
  } catch {
    // ignore
  }

  const metals = await Promise.all(
    METALS_LIST.map(async (item) => {
      const direct = rates[item.code];
      const history1dRes = await db.query(
        "SELECT price_usd FROM metal_prices WHERE code = $1 AND ts >= $2 ORDER BY ts ASC",
        [item.code, now - 24 * 60 * 60 * 1000]
      );
      const history7dRes = await db.query(
        "SELECT price_usd FROM metal_prices_daily WHERE code = $1 ORDER BY day DESC LIMIT 7",
        [item.code]
      );
      const sparkline1d = history1dRes.rows.map((r) => r.price_usd).slice(-MAX_POINTS);
      const sparkline7d = history7dRes.rows.map((r) => r.price_usd).reverse();

      if (!direct) {
        return {
          name: item.name,
          code: item.code,
          priceUsd: null,
          status: "source_pending",
          sparkline1d,
          sparkline7d,
        };
      }
      return {
        name: item.name,
        code: item.code,
        priceUsd: direct,
        status: "ok",
        sparkline1d,
        sparkline7d,
      };
    })
  );

  // fire alerts
  try {
    const alertsRes = await db.query("SELECT * FROM alerts");
    for (const alert of alertsRes.rows as any[]) {
      const price = rates[alert.code];
      if (!price) continue;
      const triggered =
        (alert.condition === "above" && price > alert.threshold) ||
        (alert.condition === "below" && price < alert.threshold);
      if (triggered && (!alert.last_triggered || Date.now() - alert.last_triggered > 60 * 60 * 1000)) {
        await db.query("UPDATE alerts SET last_triggered = $1 WHERE id = $2", [Date.now(), alert.id]);
        await sendEmail({
          to: alert.email,
          subject: `Alert triggered: ${alert.code}`,
          html: `<p>${alert.code} is ${alert.condition} ${alert.threshold}. Current: ${price}</p>`,
        });
      }
    }
  } catch {
    // ignore
  }

  const crypto = Array.isArray(cryptoJson)
    ? cryptoJson.map((c: any) => ({
        id: c.id,
        symbol: String(c.symbol || "").toUpperCase(),
        name: c.name,
        priceUsd: c.current_price,
        volume24h: c.total_volume,
        sparkline: Array.isArray(c?.sparkline_in_7d?.price)
          ? c.sparkline_in_7d.price.slice(-MAX_POINTS)
          : [],
      }))
    : [];

  const payload: CachedPayload = {
    updatedAt: new Date().toISOString(),
    metals,
    crypto,
    sources: {
      metals: "stooq.com/t/?i=554 (scraped every 5 mins)",
      crypto: "CoinGecko Demo API",
    },
  };

  cache = { ts: now, payload };
  return NextResponse.json(payload);
}

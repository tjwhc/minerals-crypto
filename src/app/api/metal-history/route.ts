import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = (searchParams.get("code") || "").toUpperCase();
  const range = (searchParams.get("range") || "1d").toLowerCase();
  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  try {
    if (range === "7d") {
      const rowsRes = await db.query(
        "SELECT price_usd, day FROM metal_prices_daily WHERE code = $1 ORDER BY day DESC LIMIT 7",
        [code]
      );
      const series = rowsRes.rows
        .map((r) => ({
          price_usd: r.price_usd,
          ts: Date.parse(`${r.day}T00:00:00Z`),
          volume: 1,
        }))
        .reverse();
      return NextResponse.json({ code, series });
    }

    const since = Date.now() - 24 * 60 * 60 * 1000;
    const rowsRes = await db.query(
      "SELECT price_usd, ts FROM metal_prices WHERE code = $1 AND ts >= $2 ORDER BY ts ASC",
      [code, since]
    );
    const series = rowsRes.rows.map((r) => ({ price_usd: r.price_usd, ts: r.ts, volume: 1 }));
    return NextResponse.json({ code, series });
  } catch {
    return NextResponse.json({ error: "Failed to load history" }, { status: 500 });
  }
}

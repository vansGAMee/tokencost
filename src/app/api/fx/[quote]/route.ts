import { NextResponse } from "next/server";
import { normalizeFrankfurterRate } from "@/server/fx";

export const revalidate = 21600;
const supported = new Set(["EUR", "GBP", "JPY", "CAD", "AUD", "CNY"]);

export async function GET(_request: Request, { params }: { params: Promise<{ quote: string }> }) {
  const quote = (await params).quote.toUpperCase();
  if (!supported.has(quote)) return NextResponse.json({ error: "Currency is unavailable" }, { status: 404 });
  try {
    const response = await fetch(`https://api.frankfurter.dev/v2/rate/USD/${quote}`, { next: { revalidate: 21600 } });
    if (!response.ok) throw new Error(`FX source returned ${response.status}`);
    return NextResponse.json(normalizeFrankfurterRate(await response.json()), { headers: { "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400" } });
  } catch {
    return NextResponse.json({ error: "Current FX rate is temporarily unavailable" }, { status: 503 });
  }
}

import { NextResponse } from "next/server";
import { MODEL_RATES } from "@/data/model-rates";
import { withFreshness } from "@/server/pricing";

export const revalidate = 86400;

export function GET() {
  return NextResponse.json({ rates: withFreshness(MODEL_RATES), canonicalCurrency: "USD" }, { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } });
}

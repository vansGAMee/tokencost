import Decimal from "decimal.js";

type FrankfurterResponse = { date?: unknown; base?: unknown; quote?: unknown; rate?: unknown };

export function normalizeFrankfurterRate(data: FrankfurterResponse) {
  if (typeof data.date !== "string" || typeof data.base !== "string" || typeof data.quote !== "string" || typeof data.rate !== "number" || !Number.isFinite(data.rate) || data.rate <= 0) {
    throw new Error("Invalid FX rate");
  }
  return { base: data.base, quote: data.quote, rate: new Decimal(data.rate).toString(), source: "Frankfurter / ECB", fetchedAt: data.date };
}

import type { ModelRate } from "@/data/model-rates";

const STALE_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

export function withFreshness(rates: ModelRate[], now = new Date()): ModelRate[] {
  return rates.map((rate) => ({ ...rate, status: now.getTime() - new Date(rate.fetchedAt).getTime() > STALE_AFTER_MS ? "stale" : rate.status }));
}

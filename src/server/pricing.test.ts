import { describe, expect, it } from "vitest";
import { withFreshness } from "./pricing";
import { MODEL_RATES } from "@/data/model-rates";

describe("pricing freshness", () => {
  it("keeps last-known-good prices and marks old snapshots stale", () => {
    const rates = withFreshness(MODEL_RATES, new Date("2026-09-20T00:00:00.000Z"));
    expect(rates.every((rate) => rate.inputUsdPer1M !== "0")).toBe(true);
    expect(rates.every((rate) => rate.status === "stale")).toBe(true);
  });
});

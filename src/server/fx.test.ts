import { describe, expect, it } from "vitest";
import { normalizeFrankfurterRate } from "./fx";

describe("FX normalization", () => {
  it("normalizes a timestamped USD quote", () => {
    expect(normalizeFrankfurterRate({ date: "2026-09-08", base: "USD", quote: "EUR", rate: 0.86 })).toEqual({ base: "USD", quote: "EUR", rate: "0.86", source: "Frankfurter / ECB", fetchedAt: "2026-09-08" });
  });

  it("rejects synthetic or invalid rates", () => {
    expect(() => normalizeFrankfurterRate({ date: "2026-09-08", base: "USD", quote: "EUR", rate: 0 })).toThrow("Invalid FX rate");
  });
});

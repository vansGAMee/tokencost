import { describe, expect, it } from "vitest";
import { calculateInputCost, convertUsd, formatDate, formatDateTime, formatMoney, formatNumber } from "./money";

describe("money", () => {
  it("calculates input cost with decimal precision", () => {
    expect(calculateInputCost(18_492, "2.50")).toBe("0.04623");
  });

  it("does not mutate the canonical USD value during conversion", () => {
    const usd = "0.04623";
    expect(convertUsd(usd, "0.86")).toBe("0.0397578");
    expect(usd).toBe("0.04623");
  });

  it("formats tiny values without floating point noise", () => {
    expect(formatMoney("0.0000042", "USD")).toBe("$0.0000042");
  });

  it("formats SSR-visible values with an explicit locale and timezone", () => {
    expect(formatNumber(18_492)).toBe("18,492");
    expect(formatDate("2026-09-08T23:30:00-04:00")).toBe("09 Sept 2026");
    expect(formatDateTime("2026-09-08T19:00:00Z")).toBe("08 Sept 2026, 19:00 UTC");
  });
});

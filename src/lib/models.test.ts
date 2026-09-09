import { describe, expect, it } from "vitest";
import { detectModelFromCode, filterModels, sortModels } from "./models";
import { MODEL_RATES } from "@/data/model-rates";

describe("model helpers", () => {
  it("detects Anthropic imports when selection is automatic", () => {
    expect(detectModelFromCode("import Anthropic from '@anthropic-ai/sdk'"))
      .toBe("claude-sonnet-4-6");
  });

  it("searches model id, display name, and provider locally", () => {
    expect(filterModels(MODEL_RATES, "anthropic").every((rate) => rate.provider === "Anthropic")).toBe(true);
    expect(filterModels(MODEL_RATES, "sonnet").some((rate) => rate.modelId.includes("sonnet"))).toBe(true);
  });

  it("sorts prices numerically instead of lexicographically", () => {
    const result = sortModels(MODEL_RATES, "input-asc");
    expect(Number(result[0].inputUsdPer1M)).toBeLessThanOrEqual(Number(result.at(-1)?.inputUsdPer1M));
  });
});

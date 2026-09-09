import { describe, expect, it } from "vitest";
import { countTokensForModel } from "./token-count";
import { getModelRate } from "@/data/model-rates";

describe("model-aware token counting", () => {
  it("uses the modern OpenAI encoding exactly", async () => {
    const result = await countTokensForModel("Hello, world!", getModelRate("gpt-5.6-sol"));
    expect(result).toEqual({ tokens: 4, accuracy: "exact", method: "o200k_base" });
  });

  it("labels credential-free provider counts as estimates", async () => {
    const result = await countTokensForModel("const value = 42;", getModelRate("claude-sonnet-5"));
    expect(result.accuracy).toBe("estimated");
    expect(result.tokens).toBeGreaterThan(0);
  });

  it("returns zero without loading remote services for empty input", async () => {
    const result = await countTokensForModel("", getModelRate("gemini-3.5-flash-lite"));
    expect(result.tokens).toBe(0);
  });
});

import type { ModelRate } from "@/data/model-rates";

export type TokenCountResult = {
  tokens: number;
  accuracy: "exact" | "estimated";
  method: string;
};

export async function countTokensForModel(code: string, model: ModelRate): Promise<TokenCountResult> {
  if (!code) return { tokens: 0, accuracy: model.tokenizer === "o200k_base" ? "exact" : "estimated", method: model.tokenizer };

  if (model.tokenizer === "o200k_base") {
    const { countTokens } = await import("gpt-tokenizer/encoding/o200k_base");
    return { tokens: countTokens(code), accuracy: "exact", method: "o200k_base" };
  }

  if (model.tokenizer === "cl100k_base") {
    const { countTokens } = await import("gpt-tokenizer/encoding/cl100k_base");
    return { tokens: countTokens(code), accuracy: "exact", method: "cl100k_base" };
  }

  const divisor = model.tokenizer === "anthropic-estimate" ? 3.45 : model.tokenizer === "gemini-estimate" ? 4 : 3.8;
  const codeDensity = /[{}()[\];=<>]/.test(code) ? 1.08 : 1;
  return {
    tokens: Math.max(1, Math.ceil((Array.from(code).length / divisor) * codeDensity)),
    accuracy: "estimated",
    method: model.tokenizer,
  };
}

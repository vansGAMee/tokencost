export type TokenizerKind = "o200k_base" | "cl100k_base" | "anthropic-estimate" | "gemini-estimate" | "generic-estimate";

export type ModelRate = {
  provider: string;
  modelId: string;
  displayName: string;
  inputUsdPer1M: string;
  outputUsdPer1M: string;
  cachedInputUsdPer1M?: string;
  cacheWriteUsdPer1M?: string;
  contextWindow: number;
  sourceUrl: string;
  sourceType: "official" | "secondary";
  fetchedAt: string;
  tokenizer: TokenizerKind;
  status: "fresh" | "stale" | "disputed";
  notes?: string;
};

const fetchedAt = "2026-09-08T19:00:00.000Z";

export const MODEL_RATES: ModelRate[] = [
  { provider: "OpenAI", modelId: "gpt-6-astra", displayName: "GPT-6 Astra", inputUsdPer1M: "10", cachedInputUsdPer1M: "1", outputUsdPer1M: "50", contextWindow: 1_050_000, sourceUrl: "https://developers.openai.com/api/docs/models/compare", sourceType: "official", fetchedAt, tokenizer: "o200k_base", status: "fresh" },
  { provider: "OpenAI", modelId: "gpt-5.6-sol", displayName: "GPT-5.6 Sol", inputUsdPer1M: "4", cachedInputUsdPer1M: "0.4", outputUsdPer1M: "20", contextWindow: 1_050_000, sourceUrl: "https://developers.openai.com/api/docs/models/compare", sourceType: "official", fetchedAt, tokenizer: "o200k_base", status: "fresh" },
  { provider: "OpenAI", modelId: "gpt-5.6-terra", displayName: "GPT-5.6 Terra", inputUsdPer1M: "2", cachedInputUsdPer1M: "0.2", outputUsdPer1M: "12", contextWindow: 1_050_000, sourceUrl: "https://developers.openai.com/api/docs/models/compare", sourceType: "official", fetchedAt, tokenizer: "o200k_base", status: "fresh" },
  { provider: "OpenAI", modelId: "gpt-5.6-luna", displayName: "GPT-5.6 Luna", inputUsdPer1M: "0.2", cachedInputUsdPer1M: "0.02", outputUsdPer1M: "1.2", contextWindow: 1_050_000, sourceUrl: "https://developers.openai.com/api/docs/models/compare", sourceType: "official", fetchedAt, tokenizer: "o200k_base", status: "fresh" },
  { provider: "Anthropic", modelId: "claude-sonnet-5", displayName: "Claude Sonnet 5", inputUsdPer1M: "2", cachedInputUsdPer1M: "0.2", cacheWriteUsdPer1M: "2.5", outputUsdPer1M: "10", contextWindow: 1_000_000, sourceUrl: "https://platform.claude.com/docs/en/about-claude/pricing", sourceType: "official", fetchedAt, tokenizer: "anthropic-estimate", status: "fresh", notes: "Local count is an estimate; Claude 4.7+ uses Anthropic's newer tokenizer." },
  { provider: "Anthropic", modelId: "claude-sonnet-4-6", displayName: "Claude Sonnet 4.6", inputUsdPer1M: "3", cachedInputUsdPer1M: "0.3", cacheWriteUsdPer1M: "3.75", outputUsdPer1M: "15", contextWindow: 1_000_000, sourceUrl: "https://platform.claude.com/docs/en/about-claude/pricing", sourceType: "official", fetchedAt, tokenizer: "anthropic-estimate", status: "fresh" },
  { provider: "Anthropic", modelId: "claude-haiku-4-5", displayName: "Claude Haiku 4.5", inputUsdPer1M: "1", cachedInputUsdPer1M: "0.1", cacheWriteUsdPer1M: "1.25", outputUsdPer1M: "5", contextWindow: 200_000, sourceUrl: "https://platform.claude.com/docs/en/about-claude/pricing", sourceType: "official", fetchedAt, tokenizer: "anthropic-estimate", status: "fresh" },
  { provider: "Google", modelId: "gemini-3.5-flash-lite", displayName: "Gemini 3.5 Flash-Lite", inputUsdPer1M: "0.3", cachedInputUsdPer1M: "0.03", outputUsdPer1M: "2.5", contextWindow: 1_000_000, sourceUrl: "https://ai.google.dev/gemini-api/docs/pricing", sourceType: "official", fetchedAt, tokenizer: "gemini-estimate", status: "fresh" },
  { provider: "Google", modelId: "gemini-3.1-flash-lite", displayName: "Gemini 3.1 Flash-Lite", inputUsdPer1M: "0.25", cachedInputUsdPer1M: "0.025", outputUsdPer1M: "1.5", contextWindow: 1_000_000, sourceUrl: "https://ai.google.dev/gemini-api/docs/pricing", sourceType: "official", fetchedAt, tokenizer: "gemini-estimate", status: "fresh" },
  { provider: "DeepSeek", modelId: "deepseek-v4-flash", displayName: "DeepSeek V4 Flash", inputUsdPer1M: "0.44", cachedInputUsdPer1M: "0.014", outputUsdPer1M: "1.32", contextWindow: 1_000_000, sourceUrl: "https://api-docs.deepseek.com/quick_start/pricing/", sourceType: "official", fetchedAt, tokenizer: "generic-estimate", status: "fresh", notes: "Peak rate shown; off-peak pricing is lower." },
  { provider: "xAI", modelId: "grok-4.6", displayName: "Grok 4.6", inputUsdPer1M: "2", cachedInputUsdPer1M: "0.5", outputUsdPer1M: "6", contextWindow: 500_000, sourceUrl: "https://docs.x.ai/developers/pricing", sourceType: "official", fetchedAt, tokenizer: "generic-estimate", status: "fresh" },
  { provider: "Mistral", modelId: "mistral-small-2603", displayName: "Mistral Small 4", inputUsdPer1M: "0.15", outputUsdPer1M: "0.6", contextWindow: 256_000, sourceUrl: "https://docs.mistral.ai/getting-started/models/compare", sourceType: "official", fetchedAt, tokenizer: "generic-estimate", status: "fresh" },
];

export const DEFAULT_MODEL_ID = "gpt-5.6-sol";

export function getModelRate(modelId: string): ModelRate {
  return MODEL_RATES.find((rate) => rate.modelId === modelId) ?? MODEL_RATES.find((rate) => rate.modelId === DEFAULT_MODEL_ID)!;
}

import type { ModelRate } from "@/data/model-rates";

export type ModelSort = "recommended" | "input-asc" | "output-asc" | "context-desc";

export function detectModelFromCode(code: string): string | null {
  const normalized = code.toLowerCase();
  if (normalized.includes("@anthropic-ai") || normalized.includes("anthropic(")) return "claude-sonnet-4-6";
  if (normalized.includes("@google/generative-ai") || normalized.includes("google.generativeai") || normalized.includes("gemini")) return "gemini-3.5-flash-lite";
  if (normalized.includes("deepseek")) return "deepseek-v4-flash";
  if (normalized.includes("@mistralai") || normalized.includes("mistral")) return "mistral-small-2603";
  if (normalized.includes("xai") || normalized.includes("grok")) return "grok-4.6";
  if (normalized.includes("openai") || normalized.includes("tiktoken")) return "gpt-5.6-sol";
  return null;
}

export function filterModels(models: ModelRate[], query: string, provider = "All"): ModelRate[] {
  const needle = query.trim().toLowerCase();
  return models.filter((model) => {
    const providerMatches = provider === "All" || model.provider === provider;
    const queryMatches = !needle || `${model.displayName} ${model.modelId} ${model.provider}`.toLowerCase().includes(needle);
    return providerMatches && queryMatches;
  });
}

export function sortModels(models: ModelRate[], sort: ModelSort): ModelRate[] {
  return [...models].sort((a, b) => {
    if (sort === "input-asc") return Number(a.inputUsdPer1M) - Number(b.inputUsdPer1M);
    if (sort === "output-asc") return Number(a.outputUsdPer1M) - Number(b.outputUsdPer1M);
    if (sort === "context-desc") return b.contextWindow - a.contextWindow;
    return a.provider.localeCompare(b.provider) || a.displayName.localeCompare(b.displayName);
  });
}

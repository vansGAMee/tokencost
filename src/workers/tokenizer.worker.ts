import { countTokensForModel } from "@/lib/token-count";
import type { ModelRate } from "@/data/model-rates";

self.onmessage = async (event: MessageEvent<{ id: number; code: string; model: ModelRate }>) => {
  const { id, code, model } = event.data;
  const result = await countTokensForModel(code, model);
  self.postMessage({ id, result });
};

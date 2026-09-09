"use client";

import { MODEL_RATES } from "@/data/model-rates";

type Props = { modelId: string; isAuto: boolean; onChange: (modelId: string, automatic: boolean) => void; compact?: boolean };

export function ModelSelect({ modelId, isAuto, onChange, compact }: Props) {
  return (
    <label className={compact ? "model-select model-select--compact" : "model-select"}>
      <span className="sr-only">AI model</span>
      <select value={isAuto ? "auto" : modelId} onChange={(event) => event.target.value === "auto" ? onChange(modelId, true) : onChange(event.target.value, false)}>
        <option value="auto">Auto · {MODEL_RATES.find((model) => model.modelId === modelId)?.displayName}</option>
        {MODEL_RATES.map((model) => <option key={model.modelId} value={model.modelId}>{model.displayName}</option>)}
      </select>
    </label>
  );
}

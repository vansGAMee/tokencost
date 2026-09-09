"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Clipboard, Share2, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  DEFAULT_MODEL_ID,
  getModelRate,
  MODEL_RATES,
  type ModelRate,
} from "@/data/model-rates";
import {
  calculateInputCost,
  formatDate,
  formatMoney,
  formatNumber,
} from "@/lib/money";
import { detectModelFromCode } from "@/lib/models";
import { countTokensForModel, type TokenCountResult } from "@/lib/token-count";
import { ModelSelect } from "./model-select";
import { ShareDialog } from "./share-dialog";

const CodeEditor = dynamic(
  () => import("./code-editor").then((module) => module.CodeEditor),
  { ssr: false, loading: () => <div className="editor-loading" /> },
);

const SAMPLE_CODE = `import OpenAI from 'openai';
import { VectorStoreIndex } from 'rag-core';

// Production batch context evaluator
interface ContextChunk {
  id: string;
  score: number;
  metadata: Record<string, unknown>;
}

export async function estimateLoad(nodes: ContextChunk[]) {
  const rawStream = nodes.map(node => node.metadata.body);
  const response = await new OpenAI().responses.create({
    model: 'gpt-5.6-sol',
    input: JSON.stringify(rawStream),
  });
  return response;
}`;

export function Calculator() {
  const [code, setCode] = useState(SAMPLE_CODE);
  const [modelId, setModelId] = useState(DEFAULT_MODEL_ID);
  const [isAuto, setIsAuto] = useState(true);
  const [language, setLanguage] = useState("typescript");
  const [count, setCount] = useState<TokenCountResult>({
    tokens: 0,
    accuracy: "exact",
    method: "o200k_base",
  });
  const [sharing, setSharing] = useState(false);
  const requestId = useRef(0);
  const worker = useRef<Worker | null>(null);
  const model = getModelRate(modelId);
  const costUsd = calculateInputCost(count.tokens, model.inputUsdPer1M);
  const lines = code ? code.split("\n").length : 0;

  useEffect(() => {
    if (typeof Worker === "undefined") return;
    worker.current = new Worker(
      new URL("../../workers/tokenizer.worker.ts", import.meta.url),
    );
    return () => worker.current?.terminate();
  }, []);

  useEffect(() => {
    const currentId = ++requestId.current;
    const timer = window.setTimeout(async () => {
      const activeModel = getModelRate(modelId);
      if (worker.current) {
        worker.current.onmessage = (
          event: MessageEvent<{ id: number; result: TokenCountResult }>,
        ) => {
          if (event.data.id === requestId.current) setCount(event.data.result);
        };
        worker.current.postMessage({ id: currentId, code, model: activeModel });
      } else {
        const result = await countTokensForModel(code, activeModel);
        if (currentId === requestId.current) setCount(result);
      }
    }, 125);
    return () => window.clearTimeout(timer);
  }, [code, modelId]);

  const alternatives = MODEL_RATES.filter(
    (candidate) => candidate.modelId !== model.modelId,
  ).slice(0, 3);
  function chooseModel(nextId: string, automatic: boolean) {
    setModelId(nextId);
    setIsAuto(automatic);
  }
  function changeCode(nextCode: string) {
    setCode(nextCode);
    if (isAuto) {
      const detected = detectModelFromCode(nextCode);
      if (detected && detected !== modelId) setModelId(detected);
    }
  }

  async function paste() {
    try {
      setCode(await navigator.clipboard.readText());
    } catch {
      /* Clipboard permission remains user-controlled. */
    }
  }

  return (
    <main className="calculator-shell">
      <header className="calculator-header">
        <Link className="wordmark" href="/">
          tokencost
        </Link>
        <nav className="desktop-nav" aria-label="Primary">
          <Link href="/rates">Rates</Link>
          <Link href="/rates/changes">Changes</Link>
        </nav>
        <div className="header-actions">
          <ModelSelect
            compact
            modelId={modelId}
            isAuto={isAuto}
            onChange={chooseModel}
          />
          <button
            className="button button--dark"
            onClick={() => setSharing(true)}
          >
            <Share2 size={15} />
            Share
          </button>
        </div>
      </header>

      <section className="mobile-summary" aria-live="polite">
        <div className="mobile-model-row">
          <ModelSelect
            modelId={modelId}
            isAuto={isAuto}
            onChange={chooseModel}
          />
          <Link
            className="icon-button"
            href="/rates"
            aria-label="Open model rates"
          >
            ⌁
          </Link>
        </div>
        <span>Estimated input cost</span>
        <strong>{formatMoney(costUsd)}</strong>
        <small>
          {formatNumber(count.tokens)} tokens · {count.accuracy}
        </small>
        <div className="mobile-actions">
          <button className="button" onClick={paste}>
            <Clipboard size={16} />
            Paste
          </button>
          <button
            className="round-button"
            onClick={() => setCode("")}
            aria-label="Clear code"
          >
            +
          </button>
          <button className="button" onClick={() => setSharing(true)}>
            <Share2 size={16} />
            Share
          </button>
        </div>
      </section>

      <div className="workspace">
        <section className="editor-panel">
          <div className="editor-toolbar">
            <div>
              <select
                aria-label="Language"
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
              >
                <option value="typescript">TypeScript</option>
                <option value="javascript">JavaScript</option>
                <option value="cpp">C++</option>
                <option value="python">Python</option>
                <option value="rust">Rust</option>
                <option value="go">Go</option>
              </select>
              <span>utf-8</span>
            </div>
            <div>
              <button onClick={paste}>
                <Clipboard size={13} />
                Paste
              </button>
              <i />
              <button onClick={() => setCode("")}>
                <Trash2 size={13} />
                Clear
              </button>
            </div>
          </div>
          <div className="editor-canvas">
            <CodeEditor
              value={code}
              onChange={changeCode}
              language={language}
            />
          </div>
          <div className="editor-status">
            <span>Ln {lines}, Col 1</span>
            <span>
              {formatNumber(code.length)} chars · {lines} lines
            </span>
          </div>
        </section>

        <aside className="cost-panel" aria-live="polite">
          <div className="cost-heading">
            <span>Cost analysis</span>
            <span>{model.displayName}</span>
          </div>
          <div className="cost-value">{formatMoney(costUsd)}</div>
          <p>Calculated input cost</p>
          <div className="token-reading">
            <strong>{formatNumber(count.tokens)}</strong>
            <span>tokens · {count.accuracy}</span>
          </div>
          <div className="metric-grid">
            <div>
              <span>Characters</span>
              <strong>{formatNumber(code.length)}</strong>
            </div>
            <div>
              <span>Lines</span>
              <strong>{lines}</strong>
            </div>
            <div>
              <span>Rate / 1M</span>
              <strong>${model.inputUsdPer1M}</strong>
            </div>
          </div>
          <div className="alternative-heading">
            <span>Alternative models</span>
            <span>Same payload</span>
          </div>
          <div className="alternative-list">
            <div className="alternative-row active">
              <span>{model.displayName}</span>
              <strong>{formatMoney(costUsd)}</strong>
            </div>
            {alternatives.map((candidate) => (
              <Alternative
                key={candidate.modelId}
                model={candidate}
                tokens={count.tokens}
                onSelect={() => chooseModel(candidate.modelId, false)}
              />
            ))}
          </div>
          <div className="cost-footer">
            <Link href={model.sourceUrl} target="_blank">
              Official rate · {formatDate(model.fetchedAt)}
            </Link>
            <button onClick={() => setSharing(true)}>
              <Share2 size={13} />
              Copy link
            </button>
          </div>
        </aside>
      </div>

      <footer className="site-footer">
        <Link href="/rates">API rates</Link>
        <Link href="/rates/changes">Changes</Link>
        <span>© 2026</span>
      </footer>
      <nav className="mobile-dock" aria-label="Mobile navigation">
        <Link className="active" href="/" aria-label="Calculator">
          ⌂
        </Link>
        <Link href="/rates" aria-label="Rates">
          ↗
        </Link>
        <button onClick={() => setSharing(true)} aria-label="Share calculation">
          <Share2 size={17} />
        </button>
      </nav>
      <ShareDialog
        open={sharing}
        onClose={() => setSharing(false)}
        code={code}
        tokens={count.tokens}
        costUsd={costUsd}
        model={model}
        language={language}
      />
    </main>
  );
}

function Alternative({
  model,
  tokens,
  onSelect,
}: {
  model: ModelRate;
  tokens: number;
  onSelect: () => void;
}) {
  return (
    <button className="alternative-row" onClick={onSelect}>
      <span>{model.displayName}</span>
      <strong>
        {formatMoney(calculateInputCost(tokens, model.inputUsdPer1M))}
      </strong>
    </button>
  );
}

"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Clipboard, FolderUp, Heart, Share2, Trash2 } from "lucide-react";
import {
  type ChangeEvent,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";
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
import { prepareProjectFiles, type ProjectBundle } from "@/lib/project-files";
import { countTokensForModel, type TokenCountResult } from "@/lib/token-count";
import { AnimatedValue } from "./animated-value";
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
  const [project, setProject] = useState<ProjectBundle | null>(null);
  const [projectNotice, setProjectNotice] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const requestId = useRef(0);
  const worker = useRef<Worker | null>(null);
  const folderInput = useRef<HTMLInputElement | null>(null);
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
    setProject(null);
    setProjectNotice("");
    setCode(nextCode);
    if (isAuto) {
      const detected = detectModelFromCode(nextCode);
      if (detected && detected !== modelId) setModelId(detected);
    }
  }

  async function paste() {
    try {
      changeCode(await navigator.clipboard.readText());
    } catch {
      /* Clipboard permission remains user-controlled. */
    }
  }

  async function importProject(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = "";
    if (!files.length) return;
    setIsImporting(true);
    setProjectNotice("");
    try {
      const bundle = await prepareProjectFiles(files);
      if (!bundle.includedFiles) {
        setProject(null);
        setProjectNotice(
          bundle.limited
            ? "Project exceeds the 4 MB source limit"
            : "No source files found",
        );
        return;
      }
      setCode(bundle.code);
      setProject(bundle);
      setLanguage(bundle.language);
      if (isAuto) {
        const detected = detectModelFromCode(bundle.code);
        if (detected && detected !== modelId) setModelId(detected);
      }
    } finally {
      setIsImporting(false);
    }
  }

  const projectFileLabel = project
    ? `${project.includedFiles} file${project.includedFiles === 1 ? "" : "s"}`
    : "";
  const projectMeta = project
    ? `${projectFileLabel} · ${project.ignoredFiles} ignored`
    : `${formatNumber(code.length)} chars · ${lines} lines`;
  const costLabel = project
    ? "Calculated project input cost"
    : "Calculated input cost";

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
          <SupportLink />
          <button
            className="button button--dark"
            onClick={() => setSharing(true)}
          >
            <Share2 size={15} />
            Share
          </button>
        </div>
      </header>

      <input
        ref={folderInput}
        className="sr-only"
        type="file"
        multiple
        aria-label="Upload project folder"
        onChange={importProject}
        {...({ webkitdirectory: "" } as Record<string, string>)}
      />

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
        <span>{project ? "Estimated project cost" : "Estimated input cost"}</span>
        <AnimatedValue
          className="cost-value cost-value--mobile"
          value={formatMoney(costUsd)}
          ariaLabel={`Estimated ${project ? "project " : ""}input cost ${formatMoney(costUsd)}`}
        />
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
            onClick={() => folderInput.current?.click()}
            aria-label="Upload project folder"
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
              <span>{project ? projectFileLabel : "utf-8"}</span>
            </div>
            <div data-meta={projectMeta}>
              <button
                className="project-import-button"
                data-active={project ? "true" : "false"}
                onClick={() => folderInput.current?.click()}
                aria-label="Upload project folder"
                disabled={isImporting}
              >
                <FolderUp size={13} />
                {isImporting ? "Reading…" : "Project"}
              </button>
              <button onClick={paste}>
                <Clipboard size={13} />
                Paste
              </button>
              <i />
              <button onClick={() => changeCode("")}>
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
            <span>
              {projectNotice ||
                (project
                  ? `${project.rootName} · ${projectFileLabel}${project.limited ? " · size limit reached" : ""}`
                  : `Ln ${lines}, Col 1`)}
            </span>
            <span>
              {formatNumber(code.length)} chars · {lines} lines
            </span>
          </div>
        </section>

        <aside className="cost-panel" aria-live="polite">
          <div className="cost-heading">
            <span>{project ? "Project analysis" : "Cost analysis"}</span>
            <span>{model.displayName}</span>
          </div>
          <AnimatedValue
            className="cost-value"
            value={formatMoney(costUsd)}
            ariaLabel={`${costLabel} ${formatMoney(costUsd)}`}
          />
          <p>{costLabel}</p>
          <div className="token-reading">
            <strong>
              <AnimatedValue
                className="token-value"
                value={formatNumber(count.tokens)}
                ariaLabel={`${formatNumber(count.tokens)} tokens`}
              />
            </strong>
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
        <SupportLink compact />
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

function SupportLink({ compact = false }: { compact?: boolean }) {
  function trackLight(event: ReactPointerEvent<HTMLAnchorElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty(
      "--support-x",
      `${((event.clientX - bounds.left) / bounds.width) * 100}%`,
    );
    event.currentTarget.style.setProperty(
      "--support-y",
      `${((event.clientY - bounds.top) / bounds.height) * 100}%`,
    );
  }

  return (
    <a
      className={compact ? "support-dock-link" : "support-button"}
      href="https://pay.cloudtips.ru/p/61579e8c"
      target="_blank"
      rel="noreferrer noopener"
      aria-label="Support project"
      onPointerMove={compact ? undefined : trackLight}
    >
      <Heart size={compact ? 16 : 14} strokeWidth={1.8} />
      {!compact && <span>Support</span>}
    </a>
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

"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, Copy, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { getModelRate } from "@/data/model-rates";
import {
  calculateInputCost,
  formatDateTime,
  formatMoney,
  formatNumber,
} from "@/lib/money";
import { decodeSharePayload, type SharePayload } from "@/lib/share";

const CodeEditor = dynamic(
  () =>
    import("@/components/calculator/code-editor").then(
      (module) => module.CodeEditor,
    ),
  { ssr: false },
);

export function SharedCalculation({
  initialPayload = null,
}: {
  initialPayload?: SharePayload | null;
}) {
  const [payload, setPayload] = useState<SharePayload | null>(initialPayload);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialPayload) return;
    const timer = window.setTimeout(() => {
      try {
        setPayload(decodeSharePayload(location.hash.slice(1)));
      } catch {
        setError("This private link is incomplete or damaged.");
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [initialPayload]);

  if (error) {
    return (
      <main className="share-page share-page--error">
        <Link className="wordmark" href="/">
          tokencost
        </Link>
        <section>
          <h1>Link unavailable</h1>
          <p>{error}</p>
          <Link className="button" href="/">
            Open calculator
          </Link>
        </section>
      </main>
    );
  }
  if (!payload)
    return (
      <main className="share-page">
        <p>Opening private calculation…</p>
      </main>
    );

  const model = getModelRate(payload.modelId);
  const currentCost = calculateInputCost(payload.tokens, model.inputUsdPer1M);
  const extension =
    (
      {
        typescript: "ts",
        javascript: "js",
        cpp: "cpp",
        python: "py",
        rust: "rs",
        go: "go",
      } as Record<string, string>
    )[payload.language] ?? "txt";

  return (
    <main className="share-page">
      <header>
        <Link className="wordmark" href="/">
          tokencost
        </Link>
        <div>
          <Link className="button" href="/">
            <ArrowLeft size={15} />
            Calculator
          </Link>
          <button
            className="button button--dark"
            onClick={async () => {
              await navigator.clipboard.writeText(location.href);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1500);
            }}
          >
            <Copy size={15} />
            {copied ? "Copied" : "Copy link"}
          </button>
        </div>
      </header>
      <section className="shared-hero">
        <div>
          <p className="eyebrow">Shared code calculation</p>
          <h1>{model.displayName}</h1>
          <p>Created {formatDateTime(payload.createdAt)}</p>
        </div>
        <div className="shared-cost">
          <span>Input cost when shared</span>
          <strong>{formatMoney(payload.costUsd)}</strong>
          <small>{formatNumber(payload.tokens)} tokens</small>
        </div>
      </section>
      <section className="shared-grid">
        <div className="shared-code">
          <div>
            <strong>payload.{extension}</strong>
            <span>
              {initialPayload
                ? "Read only · private short link"
                : "Read only · legacy local link"}
            </span>
          </div>
          <CodeEditor
            value={payload.code}
            onChange={() => undefined}
            readOnly
            language={payload.language}
          />
        </div>
        <aside>
          <p className="eyebrow">Price context</p>
          <dl>
            <div>
              <dt>Then</dt>
              <dd>{formatMoney(payload.costUsd)}</dd>
            </div>
            <div>
              <dt>Current</dt>
              <dd>{formatMoney(currentCost)}</dd>
            </div>
            <div>
              <dt>Rate / 1M</dt>
              <dd>${model.inputUsdPer1M}</dd>
            </div>
            <div>
              <dt>Source</dt>
              <dd>Official</dd>
            </div>
          </dl>
          <a
            className="button"
            href={model.sourceUrl}
            target="_blank"
            rel="noreferrer"
          >
            View source <ExternalLink size={14} />
          </a>
        </aside>
      </section>
    </main>
  );
}

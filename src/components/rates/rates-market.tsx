"use client";

import Link from "next/link";
import { ArrowDown, Check, Copy, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { MODEL_RATES, type ModelRate } from "@/data/model-rates";
import { convertUsd, formatDateTime, formatMoney } from "@/lib/money";
import { filterModels, sortModels, type ModelSort } from "@/lib/models";

const providers = [
  "All",
  ...Array.from(new Set(MODEL_RATES.map((model) => model.provider))),
];
const currencies = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "CNY"];

export function RatesMarket({
  initial,
}: {
  initial: {
    query: string;
    provider: string;
    currency: string;
    modelId: string;
  };
}) {
  const [query, setQuery] = useState(initial.query);
  const [provider, setProvider] = useState(initial.provider);
  const [sort, setSort] = useState<ModelSort>("recommended");
  const [selected, setSelected] = useState<ModelRate | null>(
    () =>
      MODEL_RATES.find((model) => model.modelId === initial.modelId) ?? null,
  );
  const [currency, setCurrency] = useState(initial.currency);
  const [fxRate, setFxRate] = useState("1");
  const [fxError, setFxError] = useState("");
  const [copied, setCopied] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key === "Escape") {
        setSelected(null);
        searchRef.current?.blur();
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (provider !== "All") params.set("provider", provider);
    if (currency !== "USD") params.set("currency", currency);
    if (selected) params.set("model", selected.modelId);
    history.replaceState(
      null,
      "",
      `${location.pathname}${params.size ? `?${params}` : ""}`,
    );
  }, [query, provider, currency, selected]);

  useEffect(() => {
    if (currency === "USD") return;
    const controller = new AbortController();
    fetch(`/api/fx/${currency}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error((await response.json()).error);
        return response.json();
      })
      .then((data) => {
        setFxRate(data.rate);
        setFxError("");
      })
      .catch((error) => {
        if (error.name !== "AbortError") setFxError(error.message);
      });
    return () => controller.abort();
  }, [currency]);

  const visible = useMemo(
    () => sortModels(filterModels(MODEL_RATES, query, provider), sort),
    [query, provider, sort],
  );
  const money = (usd: string) => formatMoney(convertUsd(usd, fxRate), currency);
  function changeCurrency(next: string) {
    setCurrency(next);
    if (next === "USD") {
      setFxRate("1");
      setFxError("");
    }
  }

  async function copyModel(model: ModelRate) {
    await navigator.clipboard.writeText(JSON.stringify(model, null, 2));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <main className="rates-shell">
      <header className="rates-header">
        <Link className="wordmark" href="/">
          TokenCost <small>/rates</small>
        </Link>
        <nav>
          <Link className="active" href="/rates">
            Rates
          </Link>
          <Link href="/rates/changes">Changes</Link>
        </nav>
        <div>
          <span>
            {MODEL_RATES.length} models · {providers.length - 1} providers
          </span>
          <Link className="button" href="/">
            Calculator
          </Link>
        </div>
      </header>
      <section className="rates-intro">
        <div>
          <p className="eyebrow">Model rates · official sources</p>
          <h1>AI token pricing</h1>
          <p>
            Current pay-as-you-go prices, normalized per one million tokens.
          </p>
        </div>
        <dl>
          <div>
            <dt>Lowest input</dt>
            <dd>
              {money(
                Math.min(
                  ...MODEL_RATES.map((m) => Number(m.inputUsdPer1M)),
                ).toString(),
              )}
            </dd>
          </div>
          <div>
            <dt>Tracked</dt>
            <dd>{MODEL_RATES.length}</dd>
          </div>
          <div>
            <dt>Sources</dt>
            <dd>{providers.length - 1}</dd>
          </div>
        </dl>
      </section>
      <section className="rates-controls">
        <label className="rate-search">
          <Search size={16} />
          <input
            ref={searchRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter by model, id, or provider…"
          />
          <kbd>⌘K</kbd>
        </label>
        <div
          className="provider-tabs"
          role="group"
          aria-label="Provider filter"
        >
          {providers.map((item) => (
            <button
              key={item}
              className={provider === item ? "active" : ""}
              onClick={() => setProvider(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <select
          aria-label="Sort rates"
          value={sort}
          onChange={(event) => setSort(event.target.value as ModelSort)}
        >
          <option value="recommended">Recommended</option>
          <option value="input-asc">Lowest input</option>
          <option value="output-asc">Lowest output</option>
          <option value="context-desc">Largest context</option>
        </select>
        <select
          aria-label="Currency"
          value={currency}
          onChange={(event) => changeCurrency(event.target.value)}
        >
          {currencies.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </section>
      {fxError && (
        <p className="rates-error" role="status">
          {fxError}; displaying the last valid conversion.
        </p>
      )}
      <div className="rates-workspace">
        <section className="rates-table-wrap">
          <div
            className="rates-table"
            role="table"
            aria-label="Model token prices"
          >
            <div className="rate-row rate-row--head" role="row">
              <span>Model & provider</span>
              <span>Input / 1M</span>
              <span>Output / 1M</span>
              <span>Cached / 1M</span>
              <span>Context</span>
            </div>
            {visible.map((model) => (
              <button
                key={model.modelId}
                className={`rate-row ${selected?.modelId === model.modelId ? "selected" : ""}`}
                onClick={() => setSelected(model)}
                role="row"
              >
                <span>
                  <strong>{model.displayName}</strong>
                  <small>
                    {model.provider} · {model.modelId}
                  </small>
                </span>
                <span>{money(model.inputUsdPer1M)}</span>
                <span data-input={money(model.inputUsdPer1M)}>
                  {money(model.outputUsdPer1M)}
                </span>
                <span>
                  {model.cachedInputUsdPer1M
                    ? money(model.cachedInputUsdPer1M)
                    : "—"}
                </span>
                <span>{formatContext(model.contextWindow)}</span>
              </button>
            ))}
          </div>
          <footer>
            Showing {visible.length} of {MODEL_RATES.length} · Unit {currency}{" "}
            per 1M tokens
          </footer>
        </section>
        <aside
          className={`model-inspector ${selected ? "open" : ""}`}
          aria-label="Model inspector"
        >
          {selected ? (
            <>
              <header>
                <div>
                  <p className="eyebrow">{selected.provider}</p>
                  <h2>{selected.displayName}</h2>
                </div>
                <button
                  className="icon-button"
                  onClick={() => setSelected(null)}
                  aria-label="Close inspector"
                >
                  <X size={17} />
                </button>
              </header>
              <div className="inspector-prices">
                <div>
                  <span>Input</span>
                  <strong>{money(selected.inputUsdPer1M)}</strong>
                </div>
                <div>
                  <span>Output</span>
                  <strong>{money(selected.outputUsdPer1M)}</strong>
                </div>
              </div>
              <dl className="inspector-meta">
                <div>
                  <dt>Context</dt>
                  <dd>{formatContext(selected.contextWindow)}</dd>
                </div>
                <div>
                  <dt>Counting</dt>
                  <dd>
                    {selected.tokenizer.includes("estimate")
                      ? "Estimated locally"
                      : "Exact local encoding"}
                  </dd>
                </div>
                <div>
                  <dt>Freshness</dt>
                  <dd>{selected.status}</dd>
                </div>
              </dl>
              <section className="provenance">
                <div>
                  <span>Source provenance</span>
                  <span>Official</span>
                </div>
                <a href={selected.sourceUrl} target="_blank" rel="noreferrer">
                  <strong>{selected.provider} documentation</strong>
                  <small>
                    Checked {formatDateTime(selected.fetchedAt)}
                  </small>
                </a>
                {selected.notes && <p>{selected.notes}</p>}
              </section>
              <section className="history-empty">
                <span>Price history</span>
                <p>
                  No verified price change has been recorded yet. History starts
                  only when a normalized official rate changes.
                </p>
              </section>
              <button
                className="button button--primary inspector-copy"
                onClick={() => copyModel(selected)}
              >
                {copied ? <Check size={15} /> : <Copy size={15} />}
                {copied ? "Copied" : "Copy model data"}
              </button>
            </>
          ) : (
            <div className="inspector-empty">
              <ArrowDown size={20} />
              <p>
                Select a model to inspect its source, token method, and price
                history.
              </p>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}

function formatContext(value: number) {
  return value >= 1_000_000
    ? `${value / 1_000_000}M`
    : `${Math.round(value / 1000)}K`;
}

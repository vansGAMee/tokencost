"use client";

import { Check, Copy, ImageDown, Share2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ModelRate } from "@/data/model-rates";
import { formatMoney, formatNumber } from "@/lib/money";
import type { SharePayload } from "@/lib/share";
import { renderShareReceipt } from "@/lib/share-image";
import { CodeEditor } from "./code-editor";

type Props = {
  code: string;
  tokens: number;
  costUsd: string;
  model: ModelRate;
  language: string;
  open: boolean;
  onClose: () => void;
};

export function ShareDialog({
  code,
  tokens,
  costUsd,
  model,
  language,
  open,
  onClose,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [copied, setCopied] = useState(false);
  const [creating, setCreating] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);
  const [imageReady, setImageReady] = useState(false);
  const [shortUrl, setShortUrl] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function payload(): SharePayload {
    return {
      version: 1,
      code,
      language,
      modelId: model.modelId,
      tokens,
      costUsd,
      createdAt: new Date().toISOString(),
    };
  }

  async function ensureShortUrl() {
    if (shortUrl) return shortUrl;
    const response = await fetch("/api/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload()),
    });
    const result = (await response.json()) as { path?: string; error?: string };
    if (!response.ok || !result.path)
      throw new Error(result.error ?? "Could not create short link");
    const url = new URL(result.path, window.location.origin).toString();
    setShortUrl(url);
    return url;
  }

  async function copyLink() {
    setCreating(true);
    try {
      await navigator.clipboard.writeText(await ensureShortUrl());
      setCopied(true);
      setError("");
      window.setTimeout(() => setCopied(false), 1800);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Could not create link",
      );
    } finally {
      setCreating(false);
    }
  }

  async function nativeShare() {
    setCreating(true);
    try {
      const url = await ensureShortUrl();
      if (navigator.share) {
        await navigator.share({
          title: `${model.displayName} code cost`,
          text: `${formatNumber(tokens)} input tokens · ${formatMoney(costUsd)}`,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
      }
      setError("");
    } catch (reason) {
      if (reason instanceof Error && reason.name !== "AbortError")
        setError(reason.message);
    } finally {
      setCreating(false);
    }
  }

  async function sharePng() {
    setImageBusy(true);
    setImageReady(false);
    try {
      const blob = await renderShareReceipt({
        code,
        cost: formatMoney(costUsd),
        language,
        model: model.displayName,
        provider: model.provider,
        tokens: formatNumber(tokens),
      });

      const fileName = `tokencost-${model.modelId}.png`;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
      setImageReady(true);
      setError("");
      window.setTimeout(() => setImageReady(false), 1800);
    } catch (reason) {
      if (reason instanceof Error && reason.name !== "AbortError")
        setError(reason.message);
    } finally {
      setImageBusy(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="share-dialog"
      onClose={onClose}
      onCancel={onClose}
    >
      <div className="share-dialog__head">
        <div>
          <p className="eyebrow">Share result</p>
          <h2>Code cost, ready to send</h2>
        </div>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Close share dialog"
        >
          <X size={18} />
        </button>
      </div>
      <div className="share-preview">
        <div className="share-preview__brand">
          <strong>tokencost</strong>
          <span>CODE COST RECEIPT</span>
        </div>
        <div className="share-preview__model">
          <span>{model.provider}</span>
          <strong>{model.displayName}</strong>
        </div>
        <div className="share-preview__value">
          <strong>{formatMoney(costUsd)}</strong>
          <span>{formatNumber(tokens)} input tokens</span>
        </div>
        <div className="share-preview__code">
          <CodeEditor
            value={code || "// Paste code to create a shareable calculation"}
            onChange={() => undefined}
            language={language}
            readOnly
          />
        </div>
        <div className="share-preview__foot">
          <span>{language.toUpperCase()}</span>
          <span>tokencost · 2026</span>
        </div>
      </div>
      <p className="privacy-note">
        Short links use a random 8-character id and expire after 30 days. The
        private Blob is never exposed directly.
      </p>
      {shortUrl && (
        <div className="short-link-preview">
          <span>LINK READY</span>
          <code>{shortUrl}</code>
        </div>
      )}
      {error && (
        <p className="inline-error" role="alert">
          {error}
        </p>
      )}
      <div className="share-dialog__actions">
        <button
          className="button button--primary"
          onClick={copyLink}
          disabled={creating}
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {creating ? "Creating…" : copied ? "Copied" : "Copy short link"}
        </button>
        <button className="button" onClick={sharePng} disabled={imageBusy}>
          {imageReady ? <Check size={16} /> : <ImageDown size={16} />}
          {imageBusy ? "Rendering…" : imageReady ? "PNG saved" : "Download PNG"}
        </button>
        <button
          className="button share-system"
          onClick={nativeShare}
          disabled={creating}
          aria-label="Open system share"
        >
          <Share2 size={16} />
        </button>
      </div>
    </dialog>
  );
}

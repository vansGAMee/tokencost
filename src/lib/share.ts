import { gzipSync, gunzipSync, strFromU8, strToU8 } from "fflate";
import { z } from "zod";

export const SharePayloadSchema = z.object({
  version: z.literal(1),
  code: z.string().max(50_000),
  language: z.string().max(32),
  modelId: z.string().max(100),
  tokens: z.number().int().nonnegative(),
  costUsd: z.string(),
  createdAt: z.string().datetime(),
  expiresAt: z.string().datetime().optional(),
});

export type SharePayload = z.infer<typeof SharePayloadSchema>;

const SHARE_LIFETIME_MS = 30 * 24 * 60 * 60 * 1_000;
const SHARE_ID_PATTERN = /^[A-Za-z0-9_-]{8,12}$/;

export function isValidShareId(value: string): boolean {
  return SHARE_ID_PATTERN.test(value);
}

export function withShareExpiry(payload: SharePayload, now = new Date()): SharePayload {
  return SharePayloadSchema.parse({
    ...payload,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + SHARE_LIFETIME_MS).toISOString(),
  });
}

export function isShareExpired(payload: SharePayload, now = new Date()): boolean {
  return Boolean(payload.expiresAt && new Date(payload.expiresAt).getTime() <= now.getTime());
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  const base64 = typeof btoa === "function" ? btoa(binary) : Buffer.from(bytes).toString("base64");
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string): Uint8Array {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = typeof atob === "function" ? atob(base64) : Buffer.from(base64, "base64").toString("binary");
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export function encodeSharePayload(payload: SharePayload): string {
  const valid = SharePayloadSchema.parse(payload);
  return toBase64Url(gzipSync(strToU8(JSON.stringify(valid)), { level: 9 }));
}

export function decodeSharePayload(value: string): SharePayload {
  try {
    const json = strFromU8(gunzipSync(fromBase64Url(value)));
    return SharePayloadSchema.parse(JSON.parse(json));
  } catch {
    throw new Error("Invalid share link");
  }
}

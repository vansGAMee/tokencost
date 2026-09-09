import { del, get, put } from "@vercel/blob";
import { randomBytes } from "node:crypto";
import {
  isShareExpired,
  isValidShareId,
  SharePayloadSchema,
  type SharePayload,
  withShareExpiry,
} from "@/lib/share";

const SHARE_PREFIX = "shares";

function pathname(id: string): string {
  return `${SHARE_PREFIX}/${id}.json`;
}

export async function createStoredShare(
  payload: SharePayload,
): Promise<{ id: string; payload: SharePayload }> {
  const stored = withShareExpiry(payload);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const id = randomBytes(6).toString("base64url");
    try {
      await put(pathname(id), JSON.stringify(stored), {
        access: "private",
        addRandomSuffix: false,
        contentType: "application/json",
        cacheControlMaxAge: 30 * 24 * 60 * 60,
      });
      return { id, payload: stored };
    } catch (error) {
      if (attempt === 2) throw error;
    }
  }

  throw new Error("Could not allocate share id");
}

export async function readStoredShare(
  id: string,
): Promise<SharePayload | null> {
  if (!isValidShareId(id)) return null;

  const result = await get(pathname(id), { access: "private" });
  if (!result || result.statusCode !== 200 || !result.stream) return null;

  try {
    const payload = SharePayloadSchema.parse(
      JSON.parse(await new Response(result.stream).text()),
    );
    if (isShareExpired(payload)) {
      await del(result.blob.url);
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

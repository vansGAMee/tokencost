import { NextResponse } from "next/server";
import { SharePayloadSchema } from "@/lib/share";
import { createStoredShare } from "@/server/share-store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const length = Number(request.headers.get("content-length") ?? "0");
  if (length > 60_000)
    return NextResponse.json(
      { error: "Code is too large to share." },
      { status: 413 },
    );

  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json(
      { error: "Cross-origin sharing is not allowed." },
      { status: 403 },
    );
  }

  try {
    const payload = SharePayloadSchema.parse(await request.json());
    const share = await createStoredShare(payload);
    return NextResponse.json(
      {
        id: share.id,
        path: `/s/${share.id}`,
        expiresAt: share.payload.expiresAt,
      },
      { status: 201, headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Could not create this share." },
      { status: 400 },
    );
  }
}

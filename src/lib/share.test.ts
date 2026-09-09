import { describe, expect, it } from "vitest";
import {
  decodeSharePayload,
  encodeSharePayload,
  isShareExpired,
  isValidShareId,
  withShareExpiry,
} from "./share";

describe("stateless share payload", () => {
  it("round-trips unicode code without sending it to a server", () => {
    const payload = {
      version: 1 as const,
      code: "const привет = 'мир';",
      language: "typescript",
      modelId: "gpt-5.6-sol",
      tokens: 9,
      costUsd: "0.000036",
      createdAt: "2026-09-08T12:00:00.000Z",
    };

    expect(decodeSharePayload(encodeSharePayload(payload))).toEqual(payload);
  });

  it("rejects malformed payloads", () => {
    expect(() => decodeSharePayload("not-valid")).toThrow("Invalid share link");
  });

  it("accepts only compact opaque share ids", () => {
    expect(isValidShareId("Ab3_kL90")).toBe(true);
    expect(isValidShareId("../../secret")).toBe(false);
    expect(isValidShareId("tiny")).toBe(false);
  });

  it("adds and enforces a server-controlled 30 day expiry", () => {
    const payload = {
      version: 1 as const,
      code: "int main() {}",
      language: "cpp",
      modelId: "gpt-5.6-sol",
      tokens: 5,
      costUsd: "0.00002",
      createdAt: "2020-01-01T00:00:00.000Z",
    };
    const stored = withShareExpiry(payload, new Date("2026-09-09T00:00:00.000Z"));

    expect(stored.createdAt).toBe("2026-09-09T00:00:00.000Z");
    expect(stored.expiresAt).toBe("2026-10-09T00:00:00.000Z");
    expect(isShareExpired(stored, new Date("2026-10-08T23:59:59.000Z"))).toBe(false);
    expect(isShareExpired(stored, new Date("2026-10-09T00:00:00.000Z"))).toBe(true);
  });
});

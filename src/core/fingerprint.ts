import { createHash } from "node:crypto";

/** Stable JSON stringify with sorted object keys (for equality, not display). */
export function canonicalize(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(value: unknown): unknown {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(sortKeys);
  const obj = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(obj).sort()) {
    out[key] = sortKeys(obj[key]);
  }
  return out;
}

/**
 * Opaque group id from toolName + original input (canonicalized).
 * Different secrets → different ids (do NOT redact before hashing).
 * Never emit raw input alongside this id in reports.
 */
export function groupIdForToolCall(toolName: string, input: unknown): string {
  const payload = canonicalize({ toolName, input: input ?? {} });
  return createHash("sha256").update(payload).digest("hex").slice(0, 16);
}

/** @deprecated alias — use groupIdForToolCall */
export const fingerprintToolInput = groupIdForToolCall;

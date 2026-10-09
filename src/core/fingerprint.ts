import { createHash } from "node:crypto";

const SENSITIVE_KEY =
  /^(password|passwd|secret|token|api[_-]?key|authorization|cookie|private[_-]?key|access[_-]?key)$/i;

function redact(value: unknown, depth = 0): unknown {
  if (depth > 4) return "[truncated]";
  if (value === null || value === undefined) return value;
  if (typeof value === "string") {
    if (value.length > 120) return `${value.slice(0, 40)}…(${value.length} chars)`;
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.slice(0, 8).map((v) => redact(v, depth + 1));
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = SENSITIVE_KEY.test(k) ? "[redacted]" : redact(v, depth + 1);
    }
    return out;
  }
  return String(value);
}

/** Deterministic fingerprint for grouping equivalent tool calls without leaking secrets. */
export function fingerprintToolInput(toolName: string, input: unknown): string {
  const payload = JSON.stringify({ toolName, input: redact(input ?? {}) });
  return createHash("sha256").update(payload).digest("hex").slice(0, 16);
}

/** Hard caps to avoid pathological logs exhausting memory. */
export const PARSE_LIMITS = {
  /** Max UTF-8 bytes per JSONL line (skip oversized lines). */
  maxLineBytes: 256 * 1024,
  /** Max lines read from a session file. */
  maxLines: 200_000,
  /** Max completed+pending tool events retained. */
  maxEvents: 50_000,
} as const;

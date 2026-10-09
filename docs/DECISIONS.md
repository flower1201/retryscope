# Decisions (ADR-style)

## ADR-001 — Independent repo from PixelProof

**Decision:** Separate local directory/git repo `retryscope/`. No monorepo. Do not modify PixelProof.

**Status:** Accepted

## ADR-002 — Claude Code JSONL first

**Decision:** P0 parses Claude Code-style session JSONL only. Format may change; parser is tolerant and warns.

**Status:** Accepted

## ADR-003 — Link tool_use by ID, not position

**Decision:** Match `tool_result.tool_use_id` to `tool_use.id`. Unmatched results warn; unmatched uses become `unknown`.

**Status:** Accepted

## ADR-004 — Never invent failure

**Decision:** Absent `tool_result` or ambiguous evidence → `unknown`, not `failure`.

**Status:** Accepted

## ADR-005 — Local-only authorization

**Decision:** No GitHub remote create/push, no npm publish until user authorizes.

**Status:** Accepted

## ADR-006 — Fingerprint redaction

**Decision:** `inputFingerprint` hashes toolName + redacted input (truncate long strings; redact secret-like keys).

**Status:** Accepted

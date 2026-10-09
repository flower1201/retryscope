# Decisions (ADR-style)

## ADR-001 — Independent repo from PixelProof

**Decision:** Separate local directory/git repo `retryscope/`. No monorepo. Do not modify PixelProof.

**Status:** Accepted

## ADR-002 — Claude Code JSONL first

**Decision:** P0 parses Claude Code-style session JSONL only. Format may change; parser is tolerant and warns.

**Status:** Accepted

## ADR-003 — Link tool_use by ID, not position

**Decision:** Match `tool_result.tool_use_id` to `tool_use.id`. Unmatched results warn; unmatched uses become `unknown`. Duplicate `tool_use.id` counted once; conflicting inputs warn and keep first.

**Status:** Accepted

## ADR-004 — Failure evidence

**Decision:** Keep `success | failure | unknown`.

| Evidence | Status |
|----------|--------|
| `is_error === true` | failure |
| `is_error === false` | success (tool reported no error ≠ task solved) |
| result present, no `is_error` | success |
| no matching tool_result | unknown |
| stderr-only / repeat-only | never auto-failure |

**Status:** Accepted

## ADR-005 — Fingerprint / group id privacy

**Decision:** Internal equality uses canonicalized **original** input (stable key sort) hashed to opaque `inputGroupId`. Do **not** redact-before-hash (that would merge different secrets). Never write raw input/prompts/commands into default CLI/report output.

**Status:** Accepted

## ADR-006 — Repeated failed tool calls

**Decision:** Rule `REPEATED_FAILED_TOOL_CALL`: same toolName + inputGroupId, within 15 minutes, ≥3 calls, ≥2 confirmed failures. Phrase as *potential* pattern. No timestamps → exclude from this rule (no invented window). Overlapping windows deduped via covered event ids.

**Status:** Accepted

## ADR-007 — Local-only authorization

**Decision:** No GitHub remote create/push, no npm publish until user authorizes. HTML Report Engine HOLD until Detector accepted.

**Status:** Accepted

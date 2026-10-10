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

**Decision:** No GitHub remote create/push, no npm publish until user authorizes.

**Status:** Accepted

## ADR-008 — Report Engine after Detector

**Decision:** Offline Report Engine ships after Detector GO. Writes `index.html`, `findings.json`, `summary.md` under `--out`. Does not replace CLI JSON summary on stdout.

**Status:** Accepted

## ADR-009 — ReportDocument schemaVersion 1.0

**Decision:** Single projected `ReportDocument` (`schemaVersion: "1.0"`) drives JSON/MD/HTML. Finding ids are stable `RF-00N` in report order. Public projection omits `inputGroupId`, raw inputs, prompts, and command text.

**Status:** Accepted

## ADR-010 — Offline HTML: embedded JSON + textContent

**Decision:** Self-contained `index.html` embeds `const DATA = …` (JSON with `<` → `\u003c`). UI fills DOM via `textContent` / `createElement` only — no `innerHTML` of untrusted strings. Timeline/evidence stay local; no CDN, no fetch.

**Status:** Accepted

## ADR-011 — Honest empty / potential wording

**Decision:** Zero findings → explicit “no patterns under current rule,” never “all good / working perfectly.” Findings phrased as *potential* repeated failures. Synthetic demo may include a short demo note in the document.

**Status:** Accepted

## ADR-012 — Write only known report files

**Decision:** `--out` creates the directory if needed and overwrites only `index.html`, `findings.json`, `summary.md`. Unrelated files in `--out` are left untouched.

**Status:** Accepted

## ADR-013 — Report Engine conditional GO → OSS Hardening

**Decision:** Report Engine accepted with conditions (file:// E2E, invariants, privacy). OSS Hardening GO. GitHub remote / npm publish remain HOLD. No new product features this phase.

**Status:** Accepted

## ADR-014 — ReportDocument invariants

**Decision:** Enforce `findingsCount === findings.length`, `warningsCount === warnings.length`, status counts sum to `totalToolCalls`, per-finding status sum equals `callCount`, stable unique `RF-00N` ids.

**Status:** Accepted

## ADR-015 — Public warning / tool-name projection

**Decision:** Public reports use fixed warning messages by code. Non-standard tool names display as `Custom tool`.

**Status:** Accepted

## ADR-016 — Parse resource limits

**Decision:** Cap line bytes (256 KiB), lines (200k), and events (50k). All-corrupt / empty input → `NO_USABLE_EVENTS` / `EMPTY_INPUT` and CLI exit code 2 (incomplete), not a silent “no findings” success.

**Status:** Accepted

## ADR-017 — file:// is the HTML acceptance target

**Decision:** Primary offline acceptance is Playwright `page.goto(pathToFileURL(...))` without an HTTP server. Localhost preview is not sufficient alone.

**Status:** Accepted

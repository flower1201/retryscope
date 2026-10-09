# RetryScope — Project Spec (P0)

**Tagline:** Find out where your AI coding agent got stuck.

**中文定位：** 一条命令，找出 AI 编程 Agent 在哪里陷入了重复失败和无效重试。

## Goals

- Local-first CLI analysis of AI coding agent session logs
- Evidence-linked findings for repeated *failed* tool calls
- Offline HTML + JSON + Markdown reports (HTML in later milestone)
- No LLM API, no cloud upload, no database for MVP

## P0 scope

| Module | Status |
|--------|--------|
| CLI (`analyze <session.jsonl> --out`) | **Done** — stdout summary + offline report files |
| Claude Code JSONL parser | **Done** |
| Event normalizer / ToolEvent model | **Done** |
| Retry detector (`REPEATED_FAILED_TOOL_CALL`) | **Done** |
| HTML / MD / findings.json reports | **Done** (Report Engine) |
| Synthetic demo fixture | **Done** (`examples/synthetic-session.jsonl`) |

## Out of scope (P0)

Realtime monitoring, DB, MCP server, cloud, LLM calls, token cost, auto-fix, agent plugins, multi-platform logs, cross-session analysis. OSS hardening / publish deferred.

## Claude Code JSONL compatibility (documented)

Format is **internal and version-sensitive** (per Claude Code docs). We support a best-effort subset:

- Top-level lines with optional `type`, `timestamp`, `message`
- `message.content` array blocks:
  - `tool_use`: `{ id, name, input }`
  - `tool_result`: `{ tool_use_id, content?, is_error? }`
- Link results to uses by **`tool_use_id` ↔ `id`** (never by array position alone)
- Missing result → status `unknown` (never invent failure)
- `is_error: true` → `failure`; otherwise present result → `success`

Unknown / corrupt lines → warnings + skip; never fabricate findings.

## Privacy

- Only read the path the user passes (no home-directory scan)
- Fingerprints hash canonicalized original input to opaque `inputGroupId` (internal only)
- Public reports omit `inputGroupId`, prompts, commands, and secret-like fields
- Demo data is synthetic only

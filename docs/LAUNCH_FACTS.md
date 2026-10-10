# RetryScope — Public Beta fact pack

For manual invite / community posts only. **Do not auto-post, buy stars, or reply with bots.**

## One-liners

- **EN:** Find out where your AI coding agent got stuck — offline Claude Code session analysis for potential repeated tool failures.
- **ZH:** 一条命令，找出 AI 编程 Agent 在哪里陷入了重复失败（本地离线，不上传日志）。

## Positioning (must keep)

RetryScope detects **potential** repeated tool failures and shows the evidence.

It does **not** claim to: find every agent mistake, measure token waste, or auto-fix code.

## What it does (real)

- Parse Claude Code session JSONL locally
- Link `tool_use.id` ↔ `tool_result.tool_use_id`
- Detect `REPEATED_FAILED_TOOL_CALL` patterns
- Write offline `index.html` + `findings.json` + `summary.md`
- Privacy projection (no prompts/commands/`inputGroupId` in reports)

## Not a token dashboard

Unlike ccusage-style cost dashboards, RetryScope focuses on **retry/failure evidence**, not spend charts.

## Links

| Item | URL |
|------|-----|
| Repo | https://github.com/flower1201/retryscope |
| Pre-release | https://github.com/flower1201/retryscope/releases/tag/v0.1.0-rc.1 |
| Issues | https://github.com/flower1201/retryscope/issues |
| Demo screenshot | `docs/assets/rc1-report-demo.png` |

## Shortest try path (synthetic)

```bash
git clone https://github.com/flower1201/retryscope.git
cd retryscope
npm install
npm run demo
# open examples/out-demo/index.html
```

Or tarball:

```bash
# download retryscope-0.1.0-rc.1.tgz from the Pre-release page
npm install ./retryscope-0.1.0-rc.1.tgz
```

## Supported log shape (summary)

Best-effort Claude Code JSONL: `tool_use` / `tool_result` blocks linked by id. Format may change across Claude Code versions.

## Feedback asks (facts only)

1. Did install succeed?
2. Did your Claude Code log parse?
3. Was any Finding meaningful?
4. False positive / miss / incompatible shape?
5. Would you use it again?

**Do not ask users to upload private JSONL.** Prefer redacted minimal synthetic reproductions.

## Limits to state in posts

- Potential patterns only
- Tool success ≠ task solved
- No LLM/cloud; no auto-fix
- npm Registry not published yet

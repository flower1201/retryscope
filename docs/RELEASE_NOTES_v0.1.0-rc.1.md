# RetryScope v0.1.0-rc.1 (draft — not released)

Local release-candidate notes. Do **not** create a GitHub Release until authorized.

## Highlights

- Offline CLI analysis of Claude Code session JSONL
- Detector: `REPEATED_FAILED_TOOL_CALL` (potential patterns only)
- Offline reports: `index.html`, `findings.json`, `summary.md`
- Privacy whitelist projection (no prompts/commands/`inputGroupId` in reports)
- `file://` HTML report (no network)

## Install (after public repo / pack)

```bash
npm install
npm run build
npx retryscope analyze ./examples/synthetic-session.jsonl --out ./examples/out-demo
```

Open `examples/out-demo/index.html`.

## Limitations

- Best-effort Claude Code JSONL compatibility (format may change)
- Tool success ≠ user task solved
- Findings are potential patterns, not proof of wasted loops
- Custom/MCP tool names shown as `Custom tool`

## Not in this RC

- GitHub remote / npm publish
- Multi-agent platforms, realtime monitoring, LLM APIs, auto-fix

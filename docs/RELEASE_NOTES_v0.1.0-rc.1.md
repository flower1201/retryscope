# RetryScope v0.1.0-rc.1

GitHub **Pre-release** for `flower1201/retryscope`. This is a release candidate on GitHub only.

**npm Registry: not published.** Install from source or the attached `.tgz` asset — do not expect `npm install -g retryscope` yet.

## Highlights

- Offline CLI analysis of Claude Code session JSONL
- Detector: `REPEATED_FAILED_TOOL_CALL` (potential patterns only)
- Offline reports: `index.html`, `findings.json`, `summary.md`
- Privacy whitelist projection (no prompts/commands/`inputGroupId` in reports)
- `file://` HTML report (no network)

## Install from source

```bash
git clone https://github.com/flower1201/retryscope.git
cd retryscope
npm install
npm run build
node ./dist/cli/index.js analyze ./examples/synthetic-session.jsonl --out ./examples/out-demo
```

Open `examples/out-demo/index.html`.

## Install from Pre-release tarball

Download `retryscope-0.1.0-rc.1.tgz` from this GitHub Release, then:

```bash
npm install ./retryscope-0.1.0-rc.1.tgz
```

## Limitations

- Best-effort Claude Code JSONL compatibility (format may change)
- Tool success ≠ user task solved
- Findings are potential patterns, not proof of wasted loops
- Custom/MCP tool names shown as `Custom tool`

## Out of scope for this RC

- npm Registry publish
- Multi-agent platforms, realtime monitoring, LLM APIs, auto-fix

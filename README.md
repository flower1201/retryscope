# RetryScope

**Find out where your AI coding agent got stuck.**

Local-first CLI that analyzes AI coding agent session logs for evidence-linked repeated failures. No LLM API. No cloud upload.

> Status: **local Report Engine** — not published. Demo fixture is **synthetic**.

## Quick start (local)

```bash
npm install
npm run build
npx retryscope --help
npx retryscope analyze ./examples/synthetic-session.jsonl --out ./examples/out-demo
```

Open `examples/out-demo/index.html` in a browser (`file://`). Also written: `findings.json`, `summary.md`.

Without `--out`, only a privacy-safe JSON summary is printed to stdout.

## Privacy

- Only reads the JSONL path you pass (no automatic home-directory scan)
- Default analysis does not print full prompts or secret-like fields
- Reports omit internal `inputGroupId` and raw tool inputs
- Never upload private agent sessions for demos

## License

MIT

# RetryScope

**Find out where your AI coding agent got stuck.**

Local-first CLI that analyzes AI coding agent session logs for evidence-linked repeated failures. No LLM API. No cloud upload.

> Status: **local foundation / parser** — not published. Demo fixture is **synthetic**.

## Quick start (local)

```bash
npm install
npm run build
npx retryscope --help
npx retryscope analyze ./examples/synthetic-session.jsonl
```

## Privacy

- Only reads the JSONL path you pass (no automatic home-directory scan)
- Default analysis does not print full prompts or secret-like fields
- Never upload private agent sessions for demos

## License

MIT

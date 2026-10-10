# RetryScope

**Find out where your AI coding agent got stuck.**

Local-first CLI that analyzes Claude Code session JSONL for evidence-linked repeated tool failures. No LLM API. No cloud upload. Offline HTML + JSON + Markdown reports.

> Status: **local OSS hardening / not published**. Demo data is **synthetic**.

## Demo (synthetic)

```bash
npm install
npm run demo
```

Then open `examples/out-demo/index.html` in a browser (`file://` works). You should see finding **RF-001** (Bash) with a clickable execution timeline.

```bash
npx retryscope analyze ./examples/synthetic-session.jsonl --out ./examples/out-demo
```

## Quick start

```bash
npm install
npm run build
npx retryscope --help
npx retryscope analyze /path/to/session.jsonl --out ./retryscope-report
```

Writes:

```text
retryscope-report/
├── index.html
├── findings.json
└── summary.md
```

## Supported log shape (Claude Code JSONL)

Best-effort subset (format may change across Claude Code versions):

- JSONL lines with optional `type`, `timestamp`, `message`
- `message.content[]` blocks:
  - `tool_use`: `{ id, name, input }`
  - `tool_result`: `{ tool_use_id, content?, is_error? }`
- Results link by **`tool_use_id` ↔ `id`** (never by array position alone)
- Missing result → `unknown` (never invented failure)

## Privacy

- Only reads the JSONL path you pass (no home-directory scan)
- Reports omit prompts, commands, raw tool inputs/outputs, and internal `inputGroupId`
- Custom / MCP tool names render as **Custom tool**
- Warning messages use fixed codes — not raw log lines
- Never upload private agent sessions for demos or issues

## Finding limitations

- Findings are **potential** repeated-failure patterns, not proof of wasted loops
- Tool `success` means the tool reported no error — not that the user task was solved
- Root causes are not inferred

## Feedback

When the repository is public, use GitHub Issues with **synthetic** reproductions only. See `SECURITY.md`.

## License

MIT

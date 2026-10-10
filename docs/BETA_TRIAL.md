# RetryScope — owner trial pack (manual)

Hand this to people you invite. Keep private logs private.

## Links

- Repo: https://github.com/flower1201/retryscope
- Pre-release: https://github.com/flower1201/retryscope/releases/tag/v0.1.0-rc.1
- Feedback: https://github.com/flower1201/retryscope/issues
- Screenshot: https://github.com/flower1201/retryscope/blob/main/docs/assets/rc1-report-demo.png

## Fastest path (synthetic demo)

```bash
git clone https://github.com/flower1201/retryscope.git
cd retryscope
npm install
npm run demo
```

Open `examples/out-demo/index.html` (`file://`). Expect finding **RF-001** (Bash) with a clickable timeline.

## Own Claude Code session (optional)

```bash
node ./dist/cli/index.js analyze /path/to/your-session.jsonl --out ./retryscope-report
```

Only pass an explicit path. Do not share the JSONL in Issues — use a redacted synthetic snippet if something breaks.

## What to watch

- Install / `npm run demo` works
- Report opens offline
- Findings feel useful or noisy
- Parser warnings on real logs

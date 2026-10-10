# Contributing to RetryScope

Thanks for your interest. RetryScope is a local-first CLI; keep changes small and testable.

## Development

```bash
npm install
npm run typecheck
npm run build
npm test
npm run test:e2e   # requires: npx playwright install chromium
```

## Platform notes

- On Windows, the unreadable-file CLI permission test is skipped (`chmod` semantics differ from POSIX). Covered on Linux CI when the repo is public.

## Guidelines

- Do not upload private agent session logs in issues, PRs, or fixtures.
- Prefer synthetic JSONL fixtures under `examples/` or `tests/`.
- New detector rules need explicit ADR + privacy projection review.
- Keep reports offline (no CDN, no network fetches from HTML).
- Do not add LLM/cloud dependencies for MVP scope.

## Pull requests

- Include tests for behavior changes.
- Run `npm run typecheck && npm run build && npm test` before opening a PR.
- Describe privacy impact if parsing or reporting surfaces change.

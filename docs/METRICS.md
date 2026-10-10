# Metrics (local / release readiness)

Track before public launch. Do not invent user numbers.

| Metric | How measured | Current |
|--------|----------------|---------|
| Unit tests | `npm test` | see CI / local run |
| file:// E2E | `npm run test:e2e` | see local / CI chromium job |
| Pack install | clean-dir `npm pack` + install | see hardening report |
| GitHub stars | GitHub | track after Public Beta (do not invent) |
| Real session feedback | issue / survey | none yet |

## Maintenance notes

- GitHub Actions may warn that `actions/checkout@v4` / `actions/setup-node@v4` still target Node 20 while runners force Node 24. Non-blocking for RC.1; plan a follow-up Actions bump later (not a P0).

Update this table when cutting an RC or public release.

# Metrics (local / release readiness)

Track before public launch. Do not invent user numbers.

| Metric | How measured | Current |
|--------|----------------|---------|
| Unit tests | `npm test` | see CI / local run |
| file:// E2E | `npm run test:e2e` | see local / CI chromium job |
| Pack install | clean-dir `npm pack` + install | see hardening report |
| GitHub stars | GitHub | N/A (not published) |
| Real session feedback | issue / survey | none yet |

Update this table when cutting an RC or public release.

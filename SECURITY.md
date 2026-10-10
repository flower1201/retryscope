# Security Policy

## Supported versions

Security fixes target the latest published release (when available) and the `main` branch.

## Reporting a vulnerability

Please open a private security advisory on the GitHub repository when the project is public, or contact the maintainers through the repository’s security contact once published.

Do **not** attach real Claude Code / agent session logs that may contain secrets, prompts, or private paths.

## Scope notes

- RetryScope is offline-by-design: it should not upload session data.
- Report HTML must remain safe under `file://` (no trust of log text in HTML sinks).
- Findings omit raw tool inputs, prompts, and internal fingerprint ids by default.

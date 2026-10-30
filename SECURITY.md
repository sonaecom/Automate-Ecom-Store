# Security Policy

## Reporting a vulnerability

Please **do not** open a public issue. Use GitHub's private reporting:
**Security → Report a vulnerability** on <https://github.com/sonaecom/Automate-Ecom-Store/security/advisories/new>.

We aim to acknowledge reports within 3 business days.

## In scope

- Leaks of keys, profile ids, IPs, or store data through code, logs, or reports.
- Bypasses of the read-only guard, money guard, policy gate, caps, or idempotency journal.
- Anything that would make the tool call marketplace APIs or internal endpoints directly.

## Design rules

- Secrets live only on the shop computer (`~/.automate-ecom-store/`, mode 600) or in environment variables.
- Round logs store a hash of the store id, never the id.
- CI runs gitleaks plus the repo's own secret, hygiene, and private-name scans on every push and pull request.

## Supported versions

Only the latest release on `main` receives fixes.

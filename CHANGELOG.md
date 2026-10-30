# Changelog

All notable changes to this repository. The detailed skill history is in [skills/automate-ecom-store/CHANGELOG.md](skills/automate-ecom-store/CHANGELOG.md).

## [1.0.0] - 2026-10-30

First public release of the repository (skill version 1.42.0).

### Added
- Single agent skill for Shopee, TikTok Shop and Lazada seller centers.
- AdsPower and MKTLogin browser runners behind one runner selector; shared Playwright actions on one tab at human pace.
- Orchestrator day plan for up to 10 stores, job queue per profile, idempotency journal.
- Modules: affiliate invite & follow-up, listing edit & create, stock/price, promotions, ads read & change, customer chat, orders, reviews, daily report, homepage decoration, video/live.
- Policy gate, read-only and money guards, hourly/daily ceilings, captcha stop.
- Optional Next.js dashboard with synthetic sample data; optional Google Sheets reports.
- Project docs (`docs/`), examples, `.env.example`, contributing / security / conduct guides, issue and PR templates.
- CI: unit tests, gitleaks, secret scan, repo-hygiene scan, private-name scan, skill lint, dashboard build.

Update without touching local config:

```bash
node skills/automate-ecom-store/scripts/update.mjs
```

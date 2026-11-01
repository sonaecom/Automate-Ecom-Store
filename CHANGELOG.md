# Changelog

All notable changes to this repository. The detailed skill history is in [skills/automate-ecom-store/CHANGELOG.md](skills/automate-ecom-store/CHANGELOG.md).

## [1.0.2] - 2026-11-01

### Added
- Runner preflight `node skills/automate-ecom-store/scripts/runner-check.mjs --runner adspower|mktlogin`: exit 0 when the local API answers, 3 when it is down, 2 when config is missing or the key is refused. No hosts or keys are printed.

### Changed
- `real-test.mjs` returns `RUNNER_UNAVAILABLE` (exit 3) instead of a generic error when the browser runner cannot be reached, so test loops stop the store cleanly.
- Skill version 1.43.0.

## [1.0.1] - 2026-10-31

### Fixed
- Product edit pages that seller centres open in a new tab are moved into the working tab, so each profile keeps one tab.
- Selectors can ask for exact text matches; Shopee and TikTok Shop selector labels updated after real read tests.
- Page helpers gain `wait`, `count` and `allText` (body text plus form values) so a SKU inside an input is still found.

### Changed
- Real tests stop before the final Send or Save for chat, review, promotion and invite steps unless `--send` is passed.
- `AES_PROTECTED` (comma list of SKUs or product names) blocks listing edits on protected products.

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

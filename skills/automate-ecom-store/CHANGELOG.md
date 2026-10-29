# Changelog

Semver. The current version is `VERSION` and the `version` field in `SKILL.md`.

## 1.3.0

- Growth path for a new or low-sales store: scorecard with five fixes, a 30/60/90 plan, funnel playbook, hero SKUs, platform-only review tools, a small ads test with a stop-loss, sequential cover/title/price tests, break-even ROAS, and a pre-launch check.
- One post-delivery thank-you per order in the platform chat. No star target, no reward for a rating, no second message. A buyer problem goes to a person.

## 1.2.0

- Per-store config in `stores.example.yaml`: platform, market, profile placeholder, staff, caps, and schedule. `apply-stores.mjs` applies the private copy at the start of a run and will not raise a safety cap.
- Dry run for every module: same steps and screenshots, no Save, Submit, or Send.
- `update.mjs` fast-forwards the git repo and leaves `~/.automate-ecom-store` untouched.
- CI runs gitleaks, skill frontmatter lint, markdown link check, and the dashboard build.
- Shared message and title templates in EN, VI, ID, MS, and TH. KOL invites stay at or under 200 characters.
- AI cost rows record the run and the store, and the dashboard shows them.
- Troubleshooting covers a logged-out AdsPower profile, a proxy or country change, a moved menu, and repeated captchas.
- Official API adapters for Shopee, TikTok Shop, and Lazada. No keys. The browser remains the path for work the API cannot do.

## 1.1.0

- One skill for Shopee, Lazada, and TikTok Shop, with account safety, listings, homepage, ads, wallet, settlement, cancellation and return rates, FX, and the optional web dashboard.

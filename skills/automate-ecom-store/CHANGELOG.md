# Changelog

Semver. The current version is `VERSION` and the `version` field in `SKILL.md`.

## 1.15.0

- Affiliate invites on Shopee, TikTok Shop, and Lazada score each creator before anyone is selected. Weights and thresholds are configurable. Inactive, off-category, suspicious views/followers, a 90-day repeat invite, low engagement, zero GMV, and a sample that produced no sales stay off the list. The owner approves the ranked shortlist, then the skill invites the top N. Later results record acceptance, content, orders, GMV, and ROI, and can propose new weights. The live weights change only after a yes.

## 1.14.0

- After the AdsPower key, onboarding asks two optional yes/no questions: reports on Google Sheets, and an existing real-time inventory file on Google Sheets. Neither is required. If both answers are no, Gmail, Drive, and Sheets are not connected. Sheet pushes and the inventory read-only token run only for the case they accepted.

## 1.13.0

- The 2026-10-29 policy pack is the 153-rule file already in `policies/`. Markers stay as recorded. The weekly check now repeats the open gaps: voucher pages, invite limits, and Lazada PH, MY, and ID, for a browser re-check.
- The public README has the one-command install, the onboarding steps, a docs index, and the file tree.

## 1.12.0

- Selling operations are mapped in `modules/selling/README.md`. Added order handling, creator chat replies, public review replies, video and livestream publishing, competitor monitoring, and a per-market price step. Listing, homepage, inventory, restock, post-delivery, retention, and the growth and growth-stage modules stay the paths they already were.

## 1.11.0

- Platform fee cap lists every component as a percent of GMV: affiliate, free shipping, platform voucher, seller voucher, coins, mega sale, flash sale, platform commission, payment fee, and other service fees. A join or leave simulation shows the next total. Joining is blocked with an alert when that total would near or pass the cap. The owner approves any opt-in or opt-out.
- The attached 153-rule policy pack matches the files already loaded in 1.10.0. Affiliate invite checks and return alerts are unchanged. Voucher rules, official invite limits, and Lazada coverage remain gaps.

## 1.10.0

- Policy pack replaced with 153 rules. Ids 105–153 add affiliate, returns, and chat rules. Markers `UNVERIFIED`, `snippet only`, `not read`, and `applicability to PH/MY/ID unconfirmed` stay as recorded.
- Affiliate invites check those rules first. A Shopee MY targeted KOL offer needs a store-wide campaign. TikTok product and shop thresholds skip ineligible products. Return alerts use the TikTok 2-day review and the Shopee PH 1-day evidence reply. Voucher rules, official invite limits, and Lazada coverage remain gaps.

## 1.9.0

- Platform fee cap. The owner sets a maximum fee percent of GMV per store, platform, and market, and optionally per SKU or category. Settlement exports supply commission, payment fee, service programs, and affiliate commission. Ads are included only when the owner turns that on. The skill computes the percent per order, SKU, and store day or month, alerts near 90 percent of the cap and over the cap, names the program and SKU, and proposes an opt-out, a price change, or stopping a promo. The owner approves. Nothing is changed. Two exports that disagree are both shown.

## 1.8.0

- Inventory live mode reads the owner's Google Sheet with a read-only token from onboarding. It polls every 5 to 15 minutes, notices a modified time or a row hash, and pushes only variations that differ from the last pushed stock. Buffer, pending orders, max percent change, time windows or push-asap, human pace, session caps, read-back, the audit log, and the policy gate still apply. Near-realtime stops at that safe pace.

## 1.7.0

- Shopee, TikTok Shop, and Lazada policy notes for PH, MY, and ID, read 2026-10-29, are in the market files. `policies/rules.yaml` has 104 rules. Every source URL, date, and `UNVERIFIED`, `snippet only`, or `not read` marker is kept.
- The policy gate loads those rules before a module types. A review request cannot ask for a positive or 5-star review or offer a reward. Chat cannot carry a contact, a URL, or an off-platform deal. A scrape or a request flood is blocked. A fake discount must respect the printed lead time. Late-shipment and cancellation thresholds from the same file feed shop-health alerts.
- Lazada PH, MY, and ID coverage is incomplete. The weekly updater flags those pages for a browser re-check and does not treat a timed-out fetch as the local rule.

## 1.6.1

- Manual inventory mode sets one selling variation, or a small batch, to the quantity the owner typed. The skill previews it, pushes only after confirmation, reads the saved stock back, and writes an audit row. It never goes below reserved plus pending. A large jump stays a preview until the owner confirms it. Auto mode is unchanged.

## 1.6.0

- Inventory sync has a manual alert mode and an auto mode. Auto pushes only inside the owner's clock, in batches, under the session cap, and never below reserved plus pending. A large jump is skipped and alerted. BigSeller or a Google Sheet can be the source per store and SKU.

## 1.5.0

- Growth-stage modules for a store that is already selling: margin guard, controlled ads steps, restock forecast, shop-health warnings, fee-adjusted expansion, repeat-buyer reminders, team SLAs, and Mall or brand checklists.
- Budget, price, and top-up changes stay proposals. PH, MY, and ID policy files stay in place for a later official research drop-in.

## 1.4.0

- Platform policy layer in `policies/`, loaded with account safety. Eighteen market summaries for Shopee, TikTok Shop, and Lazada across PH, VN, MY, ID, TH, and SG. Each rule has a source, a retrieved date, and a verify flag.
- The gate blocks a star-rating ask, an off-platform contact, and other blocked phrases. The weekly checker diffs official pages and only flags. It does not change seller settings.

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

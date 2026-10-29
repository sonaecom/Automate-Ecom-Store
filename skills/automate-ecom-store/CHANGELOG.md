# Changelog

Semver. The current version is `VERSION` and the `version` field in `SKILL.md`.

## 1.37.0

- Daily reports on Shopee, TikTok Shop, and Lazada compare two in-store sources. A blank figure is not zero, and a mismatch is not averaged.

## 1.36.0

- Shop decoration plans through shop-plan.mjs. A size marked verify is not uploaded. A slot is saved only after the owner approves it.

## 1.35.0

- New product listings on Shopee, TikTok Shop, and Lazada plan through listing-create.mjs. A row without a variation or an image is not created. The hourly listing ceiling still applies.

## 1.34.0

- Vouchers and promotions on Shopee, TikTok Shop, and Lazada stay proposals until the owner approves that row. A placeholder or a budget field does not get saved.

## 1.33.0

- Stock and price sync on Shopee, TikTok Shop, and Lazada plans through `stock-price.mjs`. A price cut stays a proposal. The variation name is required. The hourly listing ceiling still applies.

## 1.32.0

- Customer chat on Shopee, TikTok Shop, and Lazada plans through `customer-chat.mjs` before Send. A refund or an off-platform contact is blocked. The reply ceiling is 10 a day and is not a quota.

## 1.31.0

- The orchestrator plans up to 10 stores for a machine that stays on. Batches are 40–50 minutes, breaks are 10–20 minutes, and four night hours stay closed. Starts are staggered. A captcha pauses only that store. A hung profile is restarted. A finished action key is not run again. The script does not open AdsPower itself.

## 1.30.0

- Ads setting changes plan through the core runner. The hourly ceiling is 10. A top-up uses the saved card only after owner approval or standing authorization, never adds a card, and then sends the bill. An example such as 10% of GMV is not a target.

## 1.29.0

- Listing edits stay on the core runner. The hourly ceiling is 40. The number of rows in the change file is the work. An empty owner target is not padded up to 40.

## 1.28.0

- Affiliate and KOL invites plan through `affiliate-plan.mjs` on the core runner. The store target is whatever the owner typed. Empty means the approved list only. The ceiling is 2,000 invites a day and 100 an hour, with a ramp for a new store. The ceiling is not a quota.

## 1.27.0

- Finished videos can be queued for Shopee, TikTok Shop, and Lazada. Intake is a local folder, or a Drive folder only when Google is already connected. Each file is checked against that placement's format, length, size, and aspect ceiling, then the compliance scan. The daily cap is a ceiling. Posting times are spread, and the same hash is not posted twice for one store and platform. Livestream is not developed. The module does not generate a video. Status and performance come from two in-store sources. A rejection or a two-source mismatch alerts the owner. The dashboard has a Video page.

## 1.26.0

- A product video or livestream is not published until `video-scan.mjs` returns `PASS`. The scan checks the title, caption, hashtags, on-screen text, and transcript against `policies/rules.yaml` for that platform and market, then the file details and the cover or keyframes. `BLOCK` and `REVIEW` both stop the post and alert the owner. Checks stay on this machine. The script does not upload the video.

## 1.25.0

- Shopee listing edits plan through `listing-edit.mjs` before any save. The module is a write. `read_only` does not start it. Price changes and deletions stay proposals. The `listing_edits` cap is a ceiling, not a quota. The journal closes only after the saved page matches the plan.

## 1.24.0

- Click pace is a profile: `safe`, `normal`, or `fast`, with `normal` as the default. Clicks land on the target with no mouse-move animation. Gaps are uneven and stay at or above a human floor (300ms on `normal` and `fast`) so a session does more work without a fixed rhythm on Shopee, TikTok Shop, or Lazada. Typing varies per character. Page-load settles and the 120–300 second batch rest stay. A captcha multiplier only lengthens waits. `show_click_dot` turns on a 14px red marker for about 180ms. The older `--min` and `--max` second range still runs.

## 1.23.0

- Core runner checks a module manifest, the read-only guard, the policy result, and the action_key journal before a module starts. Policy text stays the single file `policies/rules.yaml`. A filename that ends with a dot fails the repo hygiene check. No tracked file ends with a dot.

## 1.22.0

- Ads top-ups and wallet withdrawals reconcile only against the seller centre: the screen, the official export, or the in-store transaction history. Gmail card charges and Drive statement files are not sources. Sheets, Drive, and Gmail stay available for reports and inventory. A card or bank last-4 is kept only when the store page shows it.

## 1.21.0

- The primary host is a Linux VPS with OpenClaw, Hermes Agent, and headed AdsPower on one machine. A virtual display is not headless mode. systemd restarts a dead process and does not skip the session gap. The wake script stays idle until the gap and the captcha review allow one store. OpenClaw and Hermes Agent share this skill and must not drive the same profile at once. The update path still fast-forwards git and leaves local config in place.

## 1.20.0

- The approved KOL chat flow is the affiliate doc. Shop config holds templates, FAQ, and follow-ups, and follow-ups stay off until the owner sets them. Chat is logged in `kol_chat_log.csv`. One open thread per creator is deduped in the task queue at P0 through P4. A draft is checked by the policy gate and a forbidden-content match before Send.

## 1.19.0

- KOL chat after an invite stays on the platform. PH and MY default to English. A creator who asks for a sample and has no invite gets one custom target invite from the standard template and one fixed sentence. Other sizes are declined in favour of the allowlisted size. Automated sample approval is set to manual or no sample. Every chat action is written to that shop's invite log. Content and deadline follow-up is still for the owner to define.

## 1.18.0

- Owner requests and scheduled jobs enter one queue per store profile. The same action, target, and params inside the window merge. A different param on the same SKU or setting is flagged. The policy gate runs before the item is runnable. Owner pins come first, then P0 urgent, P1 revenue, P2 growth, and P3 reports. Long work splits into chunks inside the 30–40 minute session so an urgent item is not stuck. The daily plan shows what fits today and what moves to tomorrow. The end of the day reports done and pending. The dashboard shows the queue.

## 1.17.0

- Affiliate invites on Shopee, TikTok Shop, and Lazada take fixed contact details from that shop's config, not from an old invitation. The session opens only that shop's AdsPower profile. One tab stays open, and an xdg-open or Open app prompt is Cancel. One invitation holds about 10 creators on one commission, about 30 days, with manual sample approval and a SKU or size allowlist. Each shop has its own invite log, checked before the run.

## 1.16.0

- After the AdsPower key and the store list, onboarding asks a short Vietnamese multiple-choice interview. Every question can be skipped. Answers save the store count, platforms, markets, optional goals, team size, and a stage on each store: new, underperforming, or stable. The skill writes a week, month, or quarter roadmap with modules, milestones, and KPIs. Dashboards show it. At the end of a period the skill suggests the next order from results and replaces the roadmap only after a yes. The interview can be run again at any time.

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

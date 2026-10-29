# TikTok Shop promotions

Policy preflight: read `{baseDir}/policies/LAYER.md` and run `policy-gate.mjs` for this platform and market before any action in this file.

Dry run follows `{baseDir}/modules/ops/dry-run.md`: walk the steps, take the screenshots, write the report, and do not click Save, Submit, or Send.

> Template to refine. The menu hints below are not a proven click-path. On the first supervised run, if a label does not match, stop, screenshot, and ask. Do not keep opening other menus.

Bản mẫu, cần người phụ trách chỉnh lại. Lần đầu có người xem: nhãn không khớp thì dừng, chụp màn hình, và hỏi.

## When to use

The person wants one TikTok Shop promotion created or edited. Not for ads top-up.

## Prerequisites

1. Read `{baseDir}/account-safety.md` and finish session start before any seller click. `{baseDir}` is the skill folder.
2. Read `{baseDir}/session-runner.md`. Pace, caps, the captcha log, dedupe, and message length go through those scripts.
3. Use the saved store whose `platform` is `tiktokshop`. `headless` in `~/.automate-ecom-store/config.yaml` must be false. Do not print the profile id.
4. The gate result is `READY`, captcha review is not `REVIEW`, and one visible tab is on seller home.

## Steps

1. Finish account-safety session start. Create or edit one promotion in this session, not a batch. Hint: TikTok Shop Promotions.
2. Read the private promotion fields from `~/.automate-ecom-store/config.yaml` under `tasks`, or from the chat instruction for this run. Do not print the API key. Required placeholders to replace before the run: `<PROMO_NAME>`, `<START_TIME>`, `<END_TIME>`, `<DISCOUNT>`, and the item labels. If any token remains, stop.
3. Open the promotion form in the same tab. Do not open ads, wallet, or top-up.
4. Fill top to bottom: name, start, end, discount, then eligible items. Start must be in the future. If it has passed, stop and ask. Do not invent a new offer.
5. If the form asks for a budget, coin purchase, or payment, stop and ask. Do not continue into that control.
6. Select eligible items only from the person's list. If a row is ambiguous, stop. Do not select the whole catalog.
7. QC before save: screenshot `screenshots/qc1-promo.png`. Read name, window, discount, and item count from the screen.
8. Save once. QC on the saved promotion: screenshot `screenshots/qc2-promo.png`. Every visible field must match QC #1. On a mismatch, stop. Do not create a second promotion.
9. Follow account-safety session end. Idle on seller home.

**Done when:** one saved promotion matches both checks, or you stopped before save.

## QC

- One promotion only.
- Name, window, discount, and item count match on the form and on the saved page.
- No budget or payment control was accepted.

## Stop conditions

- The form requires a payment or a budget you were not told to set.
- Start time is in the past.
- QC disagrees, or a second promotion would be required to "fix" the first.

## Report

Saved name, window, discount, eligible item count, duration, captcha count, both QC results, and screenshot paths. Omit profile id, API address, port, and key.

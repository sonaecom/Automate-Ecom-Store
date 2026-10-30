# Shopee vouchers and promotions

Policy preflight: read `{baseDir}/policies/LAYER.md` and run `policy-gate.mjs` for this platform and market before any action in this file.

Dry run follows `{baseDir}/modules/ops/dry-run.md`: walk the steps, take the screenshots, write the report, and do not click Save, Submit, or Send.

Classification: **write**. Manifest `selling.promotion`. A row is `APPLY` only after `--approved yes`. A placeholder is `REJECT`. A budget or coin field is `HOLD_MONEY`. Do not invent a discount. If a menu label does not match, stop and ask.

```bash
node {baseDir}/scripts/promo-plan.mjs --promos ~/.automate-ecom-store/data/promos.csv --platform shopee --out-dir ~/.automate-ecom-store/data/promos/ --store <STORE_LABEL> --day <YYYY-MM-DD> --mode full --policy ALLOW --journal ~/.automate-ecom-store/data/journal/<STORE_LABEL>.jsonl --approved yes --target <PROMO_COUNT>
```

Khung an toàn cho Shopee. Lần chạy có người xem: nhãn menu không khớp thì dừng và hỏi.

## When to use

The person wants one Shopee voucher or shop promotion created or edited. Not for ads budget or coin top-up.

## Prerequisites

1. Read `{baseDir}/account-safety.md` and finish session start before any seller click. `{baseDir}` is the skill folder.
2. Read `{baseDir}/session-runner.md`. Pace, caps, the captcha log, dedupe, and message length go through those scripts.
3. Use the saved store whose `platform` is `shopee`. `headless` in `~/.automate-ecom-store/config.yaml` must be false. Do not print the profile id.
4. The gate result is `READY`, captcha review is not `REVIEW`, and one visible tab is on seller home.

## Steps

1. Finish account-safety session start. Create or edit one promotion in this session, not a batch. Hint: Shopee Marketing Centre, vouchers or discount promotions.
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

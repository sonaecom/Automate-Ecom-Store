---
name: shopee-vouchers-promotions
description: Create or edit one Shopee voucher or promotion in a visible profile, with two QC checks.
user-invocable: true
metadata:
  openclaw:
    requires:
      bins:
        - node
      env:
        - ADSPOWER_API_KEY
    primaryEnv: ADSPOWER_API_KEY
---
# Shopee vouchers and promotions

> Skeleton. `shopee-affiliate-invite` is the proven Shopee path. This file is the safe order of work. On a supervised run, if an on-screen label does not match the hint below, stop and ask. Do not wander through other menus.

Khung an toàn cho Shopee. Lần chạy có người xem: nhãn menu không khớp thì dừng và hỏi.

## When to use

The person wants one Shopee voucher or shop promotion created or edited. Not for ads budget or coin top-up.

## Prerequisites

1. Read `<pack-root>/core/account-safety/SKILL.md` and finish session start before any seller click. The pack root is the directory that contains that file.
2. Read `<pack-root>/core/session-runner/SKILL.md`. Pace, caps, the captcha log, dedupe, and message length go through those scripts.
3. Private `core/session-runner/config.yaml` must have `store.platform` set to `shopee` and `headless: false`.
4. The gate result is `READY`, captcha review is not `REVIEW`, and one visible tab is on seller home.

## Steps

1. Finish account-safety session start. Create or edit one promotion in this session, not a batch. Hint: Shopee Marketing Centre, vouchers or discount promotions.
2. Read the private promotion block from this skill's `config.yaml` if you add one, or from the chat instruction for this run. Required placeholders to replace before the run: `<PROMO_NAME>`, `<START_TIME>`, `<END_TIME>`, `<DISCOUNT>`, and the item labels. If any token remains, stop.
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

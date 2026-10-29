---
name: shopee-ads-gmv-max
description: Adjust Shopee GMV Max ads without letting the saved ROAS target fall below the private floor.
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
# Shopee GMV Max ads

> Skeleton. `shopee-affiliate-invite` is the proven Shopee path. This file is the safe order of work. On a supervised run, if an on-screen label does not match the hint below, stop and ask. Do not wander through other menus.

Khung an toàn cho Shopee. Lần chạy có người xem: nhãn menu không khớp thì dừng và hỏi.

## When to use

The person wants a Shopee GMV Max or ads setting changed. Budget top-up is out of scope.

## Prerequisites

1. Read `<pack-root>/core/account-safety/SKILL.md` and finish session start before any seller click. The pack root is the directory that contains that file.
2. Read `<pack-root>/core/session-runner/SKILL.md`. Pace, caps, the captcha log, dedupe, and message length go through those scripts.
3. Private `core/session-runner/config.yaml` must have `store.platform` set to `shopee` and `headless: false`.
4. The gate result is `READY`, captcha review is not `REVIEW`, and one visible tab is on seller home.

## Steps

1. Finish account-safety session start. Hint: Shopee Marketing Centre, Shopee Ads or GMV Max. Stay inside ads settings. Do not open top-up, wallet, or add funds.
2. Read `roas_floor` from private session config. If it is still `<ROAS_FLOOR>` or not a number, stop.
3. Read the ROAS target that is actually on the page. Write both numbers in your notes. The value you save must be greater than or equal to the floor. If a control would put ROAS below the floor, do not save it. Do not lower the target to chase spend.
4. Change at most the remaining `ads_changes` cap (default 3 session and 3 daily). `--add 1` before each save. On `CAP`, stop.
5. A budget increase, even a small one, needs a yes in this chat for that exact amount. If there is no yes, leave the budget as it is.
6. QC before save: screenshot `screenshots/qc1-ads.png`. Read the ROAS value and the budget value from the screen. Confirm ROAS is still at or above the floor.
7. Save once. QC on the saved GMV Max settings: screenshot `screenshots/qc2-ads.png`. The saved ROAS and budget must match QC #1. If ROAS is below the floor, stop and tell the person immediately. Do not "fix" it with another unsupervised save.
8. Wait with the normal pacer between changes. Check duration before the next change.
9. Follow account-safety session end. Idle on seller home.

**Done when:** each saved change matches both checks and ROAS is at or above the floor, or you stopped without saving.

## QC

- Saved ROAS is a number read from the page and is greater than or equal to `roas_floor`.
- Saved budget equals the budget you read before save, unless a yes in chat named a higher budget.
- Ads cap increased by the number of saves, and by no more than 3 this session.

## Stop conditions

- ROAS would fall below `roas_floor`, or either number cannot be read.
- The screen is a top-up or payment page.
- The ads cap or the session clock is exhausted.

## Report

Each saved change: ROAS before, ROAS after, floor, budget before, budget after, whether a budget yes was given, cap used, duration, captcha count, and screenshot paths. Omit profile id, API address, port, and key.

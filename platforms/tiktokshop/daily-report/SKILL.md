---
name: tiktokshop-daily-report
description: Template to report TikTok Shop orders, GMV, and ad spend percent from official exports.
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
# TikTok Shop daily report

> Template to refine. The menu hints below are not a proven click-path. On the first supervised run, if a label does not match, stop, screenshot, and ask. Do not keep opening other menus.

Bản mẫu, cần người phụ trách chỉnh lại. Lần đầu có người xem: nhãn không khớp thì dừng, chụp màn hình, và hỏi.

## When to use

The person wants TikTok Shop orders, GMV, and ad spend percent. This skill does not change the store.

## Prerequisites

1. Read `<pack-root>/core/account-safety/SKILL.md` and finish session start before any seller click. The pack root is the directory that contains that file.
2. Read `<pack-root>/core/session-runner/SKILL.md`. Pace, caps, the captcha log, dedupe, and message length go through those scripts.
3. Private `core/session-runner/config.yaml` must have `store.platform` set to `tiktokshop` and `headless: false`.
4. The gate result is `READY`, captcha review is not `REVIEW`, and one visible tab is on seller home.

## Steps

1. Finish account-safety session start. This skill does not edit listings, ads, prices, or messages. Do not click a save or confirm control.
2. Read the date range from the person's request. If they did not name one, use the seller-home "today" on the page clock. Do not guess a range.
3. In the same tab, download the official orders or business export. Hint: TikTok Shop analytics or orders export. Then download the official ads export. Hint: TikTok Shop ads export. Do not compile numbers by clicking through order pages.
4. From those files, copy orders count, GMV, and ad spend exactly as printed. If a figure is absent, say it is absent. Do not substitute a dashboard guess.
5. Ad spend percent is ad spend divided by GMV, only when both figures came from those exports and GMV is not zero. If GMV is zero, report spend and say the percent is not defined.
6. Cross-check each figure against the on-screen summary for the same date range. Screenshot `screenshots/qc1-report-export.png` and `screenshots/qc2-report-summary.png`.
7. If a figure differs between the export and the summary, report both. Do not pick one. Do not average them.
8. QC is this pair of reads. There is no submit step.
9. Follow account-safety session end. Idle on seller home.

**Done when:** the report lists each figure with its source, and any mismatch is shown as two numbers.

## QC

- Orders, GMV, and ad spend are copied from official exports.
- Each figure was cross-checked against the on-screen summary for the same dates.
- Mismatches are reported as two numbers.

## Stop conditions

- The official export is unavailable. Do not rebuild it by clicking orders.
- A figure would have to be estimated.
- Account-safety says stop.

## Report

Date range, orders, GMV, ad spend, ad spend percent or "not defined", the source of each number, any cross-check mismatch as two numbers, duration, and screenshot paths. Omit profile id, API address, port, and key.

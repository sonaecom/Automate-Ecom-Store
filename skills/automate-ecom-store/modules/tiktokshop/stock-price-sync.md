# TikTok Shop stock and price sync

Policy preflight: read `{baseDir}/policies/LAYER.md` and run `policy-gate.mjs` for this platform and market before any action in this file.

Dry run follows `{baseDir}/modules/ops/dry-run.md`: walk the steps, take the screenshots, write the report, and do not click Save, Submit, or Send.

Classification: **write**. Same plan as Shopee stock and price sync, with `--platform tiktokshop`. Manifest `inventory.stock-price`. If a menu label does not match, stop and ask.

```bash
node {baseDir}/scripts/stock-price.mjs --changes ~/.automate-ecom-store/data/stock-price.csv --platform tiktokshop --out-dir ~/.automate-ecom-store/data/inventory/ --store <STORE_LABEL> --day <YYYY-MM-DD> --mode full --policy ALLOW --journal ~/.automate-ecom-store/data/journal/<STORE_LABEL>.jsonl
```

Bản mẫu, cần người phụ trách chỉnh lại. Lần đầu có người xem: nhãn không khớp thì dừng, chụp màn hình, và hỏi.

## When to use

The person wants TikTok Shop stock or price matched to a private sheet, using official exports only. Stock quantity pushes follow `{baseDir}/modules/inventory/sync.md` (the owner sets an exact variation quantity, confirms it, then it is pushed, auto only inside the owner's clock, or a live Google Sheet that polls every 5 to 15 minutes and pushes only changed variations at human pace). Price changes stay in the steps below.

## Prerequisites

1. Read `{baseDir}/account-safety.md` and finish session start before any seller click. `{baseDir}` is the skill folder.
2. Read `{baseDir}/session-runner.md`. Pace, caps, the captcha log, dedupe, and message length go through those scripts.
3. Use the saved store whose `platform` is `tiktokshop`. `headless` in `~/.automate-ecom-store/config.yaml` must be false. Do not print the profile id.
4. The gate result is `READY`, captcha review is not `REVIEW`, and one visible tab is on seller home.

## Steps

1. Finish account-safety session start. This task reads official numbers first. Hint for the export or bulk stock tool: TikTok Shop product export or bulk stock and price edit.
2. In the same tab, download the official product or stock export. Do not page through the catalog and do not call a private endpoint.
3. Compare that export to the private stock sheet under `data/` on this computer. Build a change list of rows whose stock or price actually differs. Copy figures exactly. Do not estimate.
4. Cross-check the export row count against the count shown by the export tool. If they differ, stop and report both counts.
5. Stock rows: push only a `PUSH` line from `{baseDir}/modules/inventory/sync.md`. Do not type a `SKIP`, `PREVIEW`, or `DEFER` quantity. Price rows: apply with the official bulk tool when it exists. If it does not, edit one item at a time under the `listing_edits` cap, with `delay-range.mjs --kind page-load` after each item. Match variations by the variation's own name, never the title.
6. Any price decrease needs the account-safety approval before it is typed. A stock push still needs `stock_write` allowed and the inventory script's `PUSH` mark. Deletions need a yes.
7. QC before save: screenshot `screenshots/qc1-stock.png` showing how many stock rows and how many price rows will change.
8. `--add` the number of listings you are about to change, using the `listing_edits` limits. On `CAP` or `TIME_UP`, do not save.
9. Save once. QC again by reading the bulk result or by downloading the export a second time. Screenshot `screenshots/qc2-stock.png`. The new official figures must match what you saved. If they differ, report both and stop.
10. Follow account-safety session end. Idle on seller home.

**Done when:** the second official read matches the saved values, or you stopped with both figures reported.

## QC

- Export row count matches the export tool before any edit.
- After save, a second official read matches the values you saved.
- Price cuts that needed a yes have that yes in the chat.

## Stop conditions

- The two official counts disagree before or after save.
- Bulk edit is missing and the remaining listing cap is not enough. Ask instead of paging the catalog.
- A price cut or a deletion without a yes.

## Report

Counts of stock rows and price rows changed, the official before/after figures, any pair of numbers that disagreed, duration, captcha count, and screenshot paths. No estimated figures. Omit profile id, API address, port, and key.

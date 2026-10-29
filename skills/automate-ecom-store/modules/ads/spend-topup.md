# Ads spend and top-up tracking

Read-only across every saved store. Owners use this for actual ad spend and actual card top-ups. Never top up. Never withdraw. Never type or save a card number. Last 4 digits only.

Policy gate action is `read`. Do not use `budget`.

## When to use

A daily read of ad spend, attributed GMV, ROAS, ads balance, and top-up history, then a match to card charges from Gmail or a statement file in Drive.

## Prerequisites

1. Account safety and the session runner. One seller tab per store. Human pace.
2. `{baseDir}/modules/ads/metric-map.md` for where the number lives.
3. `{baseDir}/modules/ads/sheets-tab.md` before writing the dashboard.
4. Two sources for every spend total: the ads screen and an official export, or two exports. One source is `SINGLE_SOURCE` and is not final.

## Steps

1. For each saved store, open only that store's profile. Read yesterday, or the date the person named, from the report in the mapping doc. Copy `spend`, `gmv_attributed`, and `roas` exactly. Record the column header, the report timezone, and `read_time`.
2. Download or copy the official export for the same date. Do not replay a private request.
3. Run two-source QC:

```bash
node {baseDir}/scripts/ads-reconcile.mjs --spend-a <SCREEN_OR_EXPORT_A> --spend-b <EXPORT_B> --topups <TOPUPS> --charges <CHARGES> --balances <BALANCES> --roas-floor <ROAS_FLOOR> --out-dir <OUT_DIR>
```

`<OUT_DIR>` is under `~/.automate-ecom-store/data/ads/`. If `roas_floor` is still a placeholder, omit `--roas-floor`. On `QC_FAIL`, stop and report both numbers. Do not average them.

4. On the balance page, read the remaining balance and the top-up history. Do not open a payment dialog. If a top-up button is the only control, stop and ask.
5. Card charges come from Gmail notifications or a statement file already in Drive. The script keeps the last 4 digits and drops a longer number. Do not copy a full card number into the chat, the sheet, or a file. Match a top-up to a charge by amount, currency, a date within 2 days, and a merchant that names the platform. Flag `UNMATCHED_TOPUP`, `UNMATCHED_CHARGE`, and `DUPLICATE`.
6. Read the script summary: remaining balance, top-up total versus spend, days of balance left, spend as a percent of attributed GMV, and ROAS against the floor. Days left are remaining balance divided by average daily spend on the dates you read. If spend is 0, days left are undefined. If days left are under 3, use `{baseDir}/modules/ops/alerts.md`. The alert proposes a top-up. It does not perform one.
7. Push `normalized-spend.csv` to the `AdsFacts` tab. Formulas on `Ads & Top-up` read that tab. See `sheets-tab.md`.

```bash
node {baseDir}/scripts/push-sheets.mjs --push --csv <OUT_DIR>/normalized-spend.csv --tab AdsFacts
```

If the Google token is missing, keep the local CSV and say the sheet was not updated.

## Platform notes

Follow `metric-map.md`. Shopee is Shopee Ads and GMV Max. TikTok Shop is Ads and GMV Max, where ROI may be the ROAS column. Lazada is Sponsored Solutions. The header you saw is the source name.

## QC

Two sources agree per store, platform, market, and date, or you report both. Every balance has a read time. No full card number in the output. No top-up click.

## Stop

- A control would add funds or pay.
- The two sources disagree.
- A file still contains more than 4 consecutive card digits after the script runs.
- The policy gate is not a read.

## Report

Per store: date, spend, currency, attributed GMV, ROAS, floor, spend percent of GMV, balance, days left, top-up match counts, source names, read time, timezone. Screenshot the report page and the balance page. Do not screenshot a full card number. If one is visible, cover it and record the last 4 digits only.

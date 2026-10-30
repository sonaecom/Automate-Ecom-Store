# Stockout prevention

Policy preflight: read `{baseDir}/policies/LAYER.md` and run `policy-gate.mjs` for this platform and market before any action in this file.

Dry run follows `{baseDir}/modules/ops/dry-run.md`: walk the steps, take the screenshots, write the report, and do not click Save, Submit, or Send.

Read-only forecast. Suggest a reorder quantity. Do not edit stock in the seller form from this module.

Policy gate action is `read`. A later stock write is `stock_write` and needs `ALLOW`.

## Framework

Daily sales are units sold divided by the number of days in the export. Days of cover are on-hand plus inbound, divided by daily sales. Reorder quantity is lead time in days times daily sales, minus on-hand and inbound, and never below zero. Alert when cover is shorter than the lead time, or shorter than `stock.cover_days_alert` when lead time is blank.

## Workflow

1. Copy units sold, the day count, on-hand, and inbound from the official stock and order exports. Two sources or label `SINGLE_SOURCE`.
2. Rows: `sku, units_sold, days, on_hand, inbound, lead_days`.
3. Run:

```bash
node {baseDir}/scripts/scale.mjs --stock <STOCK_CSV> --config ~/.automate-ecom-store/scale.yaml
```

4. Send `ALERT` rows to the owner with the suggested quantity. Do not place a purchase order. Do not type the quantity into Seller Center unless a later module is approved for that SKU.

## Config

`stock.cover_days_alert` in `{baseDir}/modules/scale/config.example.yaml`. A placeholder is ignored. `--cover-days` overrides it.

## Docs

Shipping SLA in the market policy file is `verify: yes` until the on-screen number is copied. Do not use a guessed ship-by day as the lead time.

## QC

Daily sales matches units divided by days. The reorder quantity matches the script. Zero sales prints reorder 0 and does not alert.

## Stop

You would invent lead time. You would write stock without `stock_write` allowed.

## Report

Per SKU: daily sales, days of cover, reorder quantity, and `ALERT`, `OK`, or `MISSING`.

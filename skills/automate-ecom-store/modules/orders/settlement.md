# Settlement per order

Policy preflight: read `{baseDir}/policies/LAYER.md` and run `policy-gate.mjs` for this platform and market before any action in this file.

Dry run follows `{baseDir}/modules/ops/dry-run.md`: walk the steps, take the screenshots, write the report, and do not click Save, Submit, or Send.

Read-only. Compare the platform payout for each order with the sale price minus the platform fee, shipping, vouchers, and refunds. Flag an order whose payout is lower than that sum. Do not refund and do not open a payment page.

Policy gate action is `read`.

## When to use

The owner wants to know which orders were underpaid after fees and refunds. A cap on total platform fee as a percent of GMV is `{baseDir}/modules/fees/fee-cap.md`.

## Prerequisites

Account safety, one seller tab, human pace. Two sources: the order-income export and the wallet or statement line for the same order. One source is `SINGLE_SOURCE` and is not final.

## Steps

1. Export the order income report from the finance area. Copy sale price, platform fee, shipping fee, voucher amount, refund, and payout exactly. Record the column headers, timezone, and `read_time`.
2. Export or read the statement lines for those orders. That is the second source.
3. Run:

```bash
node {baseDir}/scripts/settlement-reconcile.mjs --orders-a <INCOME> --orders-b <STATEMENT> --out-dir ~/.automate-ecom-store/data/settlement/
```

Expected payout is `sale_price - platform_fee - shipping_fee - voucher - refund`. Do not add a fee the export does not show. On `QC_FAIL`, report both payouts and stop. On `UNDERPAID`, list the order label, the gap, the currency, and both sources. Alert the owner. Do not file a dispute from this module. That is `disputes.md`, and submission needs a person.

4. Push `normalized-settlement.csv` to the `SettlementFacts` tab only when `sheets_reports` is yes. If it is no, keep the local CSV and do not connect Google.

```bash
node {baseDir}/scripts/push-sheets.mjs --push --csv ~/.automate-ecom-store/data/settlement/normalized-settlement.csv --tab SettlementFacts
```

The owner tab `Settlements` uses:

```text
=QUERY(SettlementFacts!A1:Q, "select * where A is not null", 1)
```

Filter `match_status` to `UNDERPAID`.

## Platform notes

Shopee: My Income or the order settlement export. TikTok Shop: Finance statements. Lazada: Account Statement, order level. The header you see wins. If shipping is paid by the buyer and is not a deduction, leave `shipping_fee` at 0 and say so. Do not invent a commission rate.

## QC

Both sources agree, or both numbers are in the report. Every underpaid row has a gap and a read time.

## Stop

A click would refund, pay, or open a dispute form. The two payouts disagree. A fee column is missing and you would guess it.

## Report

Count of orders, count underpaid, each gap, currency, sources, read time. No buyer name and no address.

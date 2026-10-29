# Platform fee cap

Policy preflight: read `{baseDir}/policies/LAYER.md` and run `policy-gate.mjs` for this platform and market before any action in this file.

Dry run follows `{baseDir}/modules/ops/dry-run.md`: walk the steps, take the screenshots, write the report, and do not click Save, Submit, or Send.

Read-only. The owner sets a maximum platform fee as a percent of GMV. The skill reads the fees that are already on the settlement export, compares them with the cap, and proposes a next step. It does not opt out of a program, change a price, or stop a promotion.

Policy gate action is `read`. A proposal is not a `price` or `publish` action.

## When to use

The owner wants the total platform fee, as a percent of GMV, kept under a cap for a store, a platform, and a market. A SKU or a category cap is optional and wins over the store cap when it is set.

## Framework

The cap file is a private CSV copied from `{baseDir}/templates/sample-fee-caps.csv`. Each row is `level` `store`, `sku`, or `category`, plus store, platform, market, and `cap_percent`. The sample store cap is 28. Placeholders are not numbers.

Fees copied from the export, and only those columns:

- `commission`
- `payment_fee` for the transaction or payment fee
- `free_shipping`, `coins`, and `voucher` for service programs
- `affiliate` for affiliate commission
- `ads_fee` only when `include_ads` is `yes` or the command has `--include-ads`

A blank cell is missing. It is not zero. Fee percent is the sum of the included fees divided by GMV. GMV of zero is `MISSING`.

`NEAR` is at or above `warn_fraction` of the cap and still under the cap. The sample fraction is 0.9, so a 28 percent cap warns at 25.2 percent. `OVER` is at or above the cap. `UNSET` means that row has no cap. Do not copy a cap from another store.

## Workflow

1. Policy gate for this platform and market, action `read`.
2. Download the income or settlement export. Copy GMV and each fee column exactly. Record the headers and `read_time`.
3. Download a second statement for the same orders. One source is `SINGLE_SOURCE` and is not final.
4. Run:

```bash
node {baseDir}/scripts/fee-cap.mjs --orders-a <INCOME_CSV> --orders-b <STATEMENT_CSV> --caps ~/.automate-ecom-store/fee-caps.csv --config ~/.automate-ecom-store/fee-cap.yaml --out-dir ~/.automate-ecom-store/data/fee-cap/
```

5. On `BOTH`, the two sources disagree. Report both figures. Do not average them. That order is `QC_FAIL` and stays out of the store, SKU, category, daily, and monthly totals.
6. Read order lines, then `sku`, `category`, `store_day`, and `store_month`. Alert the owner on `NEAR` and `OVER`. Name the largest fee program on that row.
7. A proposal is `OPT_OUT` for free-shipping or affiliate, `STOP_PROMO` for coins or voucher, or `ADJUST_PRICE` when no single program brings the total back under the cap. `approval` is `required` and `applied` is `no`. Stop and wait for the owner. Do not click the program, the price, or the promotion.
8. Push `fee-rollups.csv` to the `FeeFacts` tab when they want it on the sheet. The dashboard page reads that tab, or `dashboard/web/sample/fee-rollups.csv` for the example.

```bash
node {baseDir}/scripts/push-sheets.mjs --push --csv ~/.automate-ecom-store/data/fee-cap/fee-rollups.csv --tab FeeFacts
```

## Config

`{baseDir}/modules/fees/config.example.yaml`. `warn_fraction` and `include_ads` only. The caps stay in the private CSV.

## Docs

Settlement payout gaps stay in `{baseDir}/modules/orders/settlement.md`. This file is the fee percent of GMV. Ads spend as its own budget stays in the ads modules. Turning `include_ads` on adds `ads_fee` to this percent. It does not change the ads budget.

## QC

Every fee in the report is on both exports, or both numbers are shown and the row is `QC_FAIL`. No proposal was clicked. The dashboard breakdown matches `fee-rollups.csv`.

## Stop

A click would opt out, change a price, or end a promotion. The two exports disagree and you would average them. A blank fee would be treated as zero. A cap from another market would be reused.

## Report

Cap, warn fraction, whether ads are included, `qc`, each `NEAR` and `OVER` with fee percent and GMV, the program that is largest, each proposal, and the read time. No buyer name and no bank number.

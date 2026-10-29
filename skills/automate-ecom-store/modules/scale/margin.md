# Margin guard at scale

Policy preflight: read `{baseDir}/policies/LAYER.md` and run `policy-gate.mjs` for this platform and market before any action in this file.

Dry run follows `{baseDir}/modules/ops/dry-run.md`: walk the steps, take the screenshots, write the report, and do not click Save, Submit, or Send.

Read-only. Alert when sales rise and profit margin falls. Do not change a price or an ad budget here.

Policy gate action is `read`.

## Framework

Profit is revenue minus platform fee, ads, shipping, and return cost for that SKU in the period. Margin percent is profit divided by revenue. Compare it with the previous period. An alert is sales up and margin down. A missing cost is not a zero.

## Workflow

1. Copy the figures from the official order, fee, ads, and return exports. A second export or the on-screen total is the check. If they differ, report both and do not pick one.
2. One row per SKU: `sku, revenue, platform_fee, ads, shipping, returns_cost, prior_revenue, prior_margin_pct, currency`. `prior_margin_pct` is a fraction, such as `0.4` for 40 percent.
3. Run:

```bash
node {baseDir}/scripts/scale.mjs --margin <MARGIN_CSV> --config ~/.automate-ecom-store/scale.yaml
```

4. `ALERT` goes to the owner with both periods. Do not "fix" it by editing a price in this module. A price idea is a proposal for `{baseDir}/modules/growth/ab-test.md`.

## Config

`margin.alert_when_sales_up_and_margin_down` in `{baseDir}/modules/scale/config.example.yaml`. The script always alerts on that pattern. It does not invent a target margin.

## Docs

Fees and return rules for this market are in `policies/<platform>/<MARKET>.md` under `pricing_promotion` and `returns_refunds`. Re-read a rule marked `verify: yes` before you quote a fee rate.

## QC

Profit matches revenue minus the four costs. The alert line matches the script.

## Stop

You would fill a blank fee with a guess. You would change a price or a budget from this alert.

## Report

Per SKU: revenue, profit, margin percent, currency, and `ALERT`, `OK`, or `MISSING_COST`. Sources and read time.

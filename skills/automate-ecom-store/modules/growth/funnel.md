# Funnel analysis

Dry run follows `{baseDir}/modules/ops/dry-run.md`: walk the steps, take the screenshots, write the report, and do not click Save, Submit, or Send.

Read impressions, clicks, add-to-cart, and orders. Name one bottleneck and the playbook for that step. Do not change bids or listings here.

Policy gate action is `read`.

## When to use

The owner wants to know where shoppers drop off.

## Steps

1. Copy impressions, clicks, add-to-cart, and orders from the official ads or business export for one period. A second export or the on-screen summary is the check. If they differ, report both and do not pick one.
2. Optional benchmarks are the owner's own targets in `bench_ctr`, `bench_atc`, `bench_cvr`, and `bench_impressions`. If those cells are empty, do not invent an industry rate.
3. Run:

```bash
node {baseDir}/scripts/growth.mjs --funnel <FUNNEL_CSV>
```

`below_benchmark` means a provided target was missed. `steepest_step` means no target was set and the smallest rate was the steepest drop.
4. Use only the playbook the script printed:

- `category_and_keywords`: category, title keywords, and whether ads are off. Do not raise the budget in this step.
- `cover_and_title`: the next test is the cover image, then the title. Not the price.
- `price_variation_shipping`: price versus the public competitor band, variation names, and the shipping fee shown to the buyer. A price change is a proposal.
- `stock_and_checkout`: stock, a voucher proposal with the owner's percent, or a checkout block. Do not invent a discount.

## QC

The four counts match the export. The bottleneck name matches the script.

## Stop

A figure would be estimated. You would raise a budget to "fix" impressions.

## Report

The four counts, the three rates, the bottleneck, the basis, and the playbook. Sources and read time.

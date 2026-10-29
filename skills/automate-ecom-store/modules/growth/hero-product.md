# Hero product selection

Policy preflight: read `{baseDir}/policies/LAYER.md` and run `policy-gate.mjs` for this platform and market before any action in this file.

Dry run follows `{baseDir}/modules/ops/dry-run.md`: walk the steps, take the screenshots, write the report, and do not click Save, Submit, or Send.

Pick one to three products to push. Leave the rest of the catalog alone until these are sound.

Policy gate action is `read`.

## When to use

A new or low-sales store needs a short list of products for content, reviews, and the first ads test.

## Steps

1. From the official catalog export, one row per SKU: margin percent, stock, orders in the period, `photo_ready`, and `compliant`. Margin comes from `{baseDir}/modules/growth/break-even.md`. If margin is missing, that SKU is not eligible.
2. `compliant` is `yes` only when the policy gate for that market is `ALLOW` and the listing method's claims list is empty or matches the spec. `POLICY_PENDING` means `compliant` is `no`.
3. `photo_ready` is `yes` only when the listing images passed the listing QC, including a real pack photo. A painted-on size is `no`.
4. Run:

```bash
node {baseDir}/scripts/growth.mjs --hero <HERO_CSV>
```

The script keeps SKUs with stock, a positive margin, photos, and compliance, then prints at most three. Do not add a fourth.
5. Those SKUs are the only ones in the 30-day plan and the ads test.

## QC

Margin matches the break-even script. Stock matches the export. The printed SKUs match the script.

## Stop

You would mark a SKU compliant while the policy file is pending. You would choose a SKU with no margin.

## Report

The one to three SKUs, margin, stock, and why the others were left out.

# Break-even tracker

Policy preflight: read `{baseDir}/policies/LAYER.md` and run `policy-gate.mjs` for this platform and market before any action in this file.

Dry run follows `{baseDir}/modules/ops/dry-run.md`: walk the steps, take the screenshots, write the report, and do not click Save, Submit, or Send.

Read-only math. A product that cannot cover its costs is not advertised.

Policy gate action is `read`.

## When to use

The owner wants the highest ad cost and the ROAS that still breaks even for a SKU.

## Steps

1. For each hero candidate, copy price, unit cost, platform fee, net shipping, and any other cost the owner already wrote down. Currency stays the native currency. Do not convert here. FX is a separate module.
2. If any cost is missing, say so. Do not fill it with a category average.
3. Run:

```bash
node {baseDir}/scripts/growth.mjs --break-even <BREAK_EVEN_CSV>
```

Contribution is price minus unit cost, platform fee, net shipping, and other cost. Max ads per order is that contribution. Break-even ROAS is price divided by that contribution. `LOSS` means the contribution is zero or negative. Do not advertise that SKU.
4. The ads kickstart target must be at least this break-even ROAS and at least `roas_floor` when the floor is a number.

## QC

Each input matches the owner's sheet or the fee shown on the official fee page. The printed ROAS matches the script. Two fee figures that disagree are both shown.

## Stop

You would guess a fee. You would start ads on a `LOSS` SKU.

## Report

Per SKU: price, contribution, max ads, break-even ROAS, currency, and `OK` or `LOSS`.

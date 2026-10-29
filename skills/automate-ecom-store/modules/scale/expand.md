# Channel and market expansion

Policy preflight: read `{baseDir}/policies/LAYER.md` and run `policy-gate.mjs` for this platform and market before any action in this file.

Dry run follows `{baseDir}/modules/ops/dry-run.md`: walk the steps, take the screenshots, write the report, and do not click Save, Submit, or Send.

Propose a fee-adjusted price for a best seller on another platform or market. Do not create the listing in this module.

Policy gate action is `read` on the source market. The destination market must be run separately. `publish` there waits for `ALLOW`.

## Framework

Source contribution is price minus unit cost, price times the source fee rate, net shipping, and other cost. The proposed destination price keeps that contribution after the destination fee rate. Fee rates are fractions, such as `0.1` for 10 percent. `compliant` is `yes` only after the destination policy gate is `ALLOW` and the product is not flagged. Otherwise the result is `HOLD`. A contribution at or below zero is `LOSS` and is not cloned.

## Workflow

1. Pick SKUs that `{baseDir}/modules/scale/margin.md` did not mark `MISSING_COST`.
2. Run the policy gate for the destination platform and market with the title and image text. Record `compliant` from that result.
3. Rows: `sku, dest_platform, dest_market, price, unit_cost, source_fee_rate, dest_fee_rate, shipping_net, other_cost, currency, compliant`.
4. Run:

```bash
node {baseDir}/scripts/scale.mjs --expand <EXPAND_CSV>
```

5. The printed price is a proposal. Listing it is `{baseDir}/modules/growth/prelaunch.md` and then the platform listing module, after the owner says yes to that price.

## Config

`expand.require_policy_allow` in `{baseDir}/modules/scale/config.example.yaml`. Leave it true.

## Docs

Destination fees come from the destination market policy file or the official fee page. If the fee is `verify: yes` and you have not opened the page, do not fill `dest_fee_rate`. PH, MY, and ID replacements will land on the paths in `{baseDir}/policies/incoming/README.md`.

## QC

The proposed price matches the script. `HOLD` was not published. Two fee pages that disagree are both shown.

## Stop

You would clone into a market whose gate is not `ALLOW`. You would publish from this module.

## Report

Per SKU: destination, proposed price or `HOLD` or `LOSS`, currency, and the policy result.

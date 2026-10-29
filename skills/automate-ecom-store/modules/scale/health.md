# Shop health at volume

Policy preflight: read `{baseDir}/policies/LAYER.md` and run `policy-gate.mjs` for this platform and market before any action in this file.

Dry run follows `{baseDir}/modules/ops/dry-run.md`: walk the steps, take the screenshots, write the report, and do not click Save, Submit, or Send.

Read late shipment, cancellation, chat response, and penalty points. Warn before the platform threshold. Do not change the account to dodge a point.

Policy gate action is `read`.

## Framework

`direction: lower` means a higher number is worse (late shipment rate, cancellation rate, penalty points). `direction: higher` means a lower number is worse (chat response rate). `BREACH` is on the wrong side of the threshold. `EARLY` is inside the warning band from `health.warn_fraction` (default 0.9) but not yet a breach. `UNSET` means the owner has not typed that market's threshold. Do not copy a threshold from another country.

## Workflow

1. Read each metric once from Account Health or the official performance export. Do not poll.
2. Rows: `metric, value, threshold, direction`. Leave `threshold` blank until you have copied the on-screen or policy number.
3. Run:

```bash
node {baseDir}/scripts/scale.mjs --health <HEALTH_CSV> --config ~/.automate-ecom-store/scale.yaml
```

4. Alert the owner on `EARLY` and `BREACH`. Cancellation rate here is the same definition as `{baseDir}/modules/orders/cancel-return.md` when the row is cancellation rate. Do not cancel orders to improve it.

## Config

`health.warn_fraction` in `{baseDir}/modules/scale/config.example.yaml`. `--warn-fraction` overrides it.

## Docs

`penalty_points` and `shipping_sla` in the market policy file. A `verify: yes` threshold is not final until the page is open.

## QC

The value matches the export. The script result matches the chat. Two health pages that disagree are both shown.

## Stop

You would invent a penalty threshold. You would open a second account because points rose.

## Report

Per metric: value, threshold or unset, and `OK`, `EARLY`, `BREACH`, or `UNSET`. Read time.

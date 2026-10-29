# Controlled ads scaling

Policy preflight: read `{baseDir}/policies/LAYER.md` and run `policy-gate.mjs` for this platform and market before any action in this file.

Dry run follows `{baseDir}/modules/ops/dry-run.md`: walk the steps, take the screenshots, write the report, and do not click Save, Submit, or Send.

Propose a step up only for a SKU that is holding its ROAS target. Propose a pause for a group that is below it. Do not type the new budget. Do not top up.

Policy gate for the proposal is `read`. Saving a budget later is `budget` and still needs the owner's yes for that amount.

## Framework

ROAS is attributed GMV divided by spend from the official ads export. The target is the number in the row, and it must be at least `roas_floor` when that floor is a real number. A step is `ads.step_percent` from the private scale file. A placeholder step prints `next_budget: unset` and still does not apply a number.

## Workflow

1. Read spend, attributed GMV, and current daily budget once. Do not refresh the ads page in a loop.
2. Rows: `sku, roas, target_roas, current_budget`.
3. Run:

```bash
node {baseDir}/scripts/scale.mjs --ads <ADS_CSV> --config ~/.automate-ecom-store/scale.yaml
```

`--step-percent` overrides the file for this run.
4. Show `PROPOSE_STEP` or `PROPOSE_PAUSE` to the owner. Log it with `audit-log.mjs` as action `budget` and result `proposed`. Apply the change only in `{baseDir}/modules/growth/ads-kickstart.md` after a yes for that exact amount, inside the `ads_changes` cap.
5. `UNSET` means a target or a ROAS is missing. Do not scale that SKU.

## Config

`ads.step_percent` and `ads.roas_floor` in `{baseDir}/modules/scale/config.example.yaml`.

## Docs

Ads rules are `ads` in the market policy file. A prohibited product is not scaled.

## QC

ROAS matches the export. The proposed budget matches the script. No top-up screen was opened.

## Stop

You would raise a budget without a yes. You would scale a SKU below its target. The floor is still a placeholder and you would invent one.

## Report

Per SKU: ROAS, target, current budget, proposal, and whether the owner has answered.

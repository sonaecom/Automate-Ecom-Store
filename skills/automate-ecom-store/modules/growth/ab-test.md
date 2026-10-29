# Sequential A/B tests

Dry run follows `{baseDir}/modules/ops/dry-run.md`: walk the steps, take the screenshots, write the report, and do not click Save, Submit, or Send.

Change one thing at a time: cover image, then title, then price. Measure before the next change. Price is a proposal until the owner says yes.

Policy gate for a cover or title save is `publish`. A price save is `price`. Both need `ALLOW` and, for price, the owner's yes.

## When to use

The funnel playbook says the cover, the title, or the price is the bottleneck, and the owner wants a measured change.

## Steps

1. Order is fixed: cover, then title, then price. Do not start price while a cover test is still open. Do not run two variables in one week unless the owner set a different window in the private note.
2. Record the before counts from the official export: impressions and orders for the hero SKU. The window length is the owner's number of days. If they did not set it, ask. Do not pick seven because it is familiar.
3. Change only that variable, inside the listing module for that platform. QC before save and on the saved listing.
4. After the window, record the after counts. The minimum orders on each side is `min_orders` from the owner's note. If they did not set a minimum, the result stays inconclusive.

```bash
node {baseDir}/scripts/growth.mjs --ab <AB_CSV>
```

`WIN` or `LOSS` requires both sides to meet `min_orders`. Otherwise the script prints `INCONCLUSIVE`. Keep the winner. Revert a loss only with the listing module, not by stacking another change on the same day.
5. Write the row to `~/.automate-ecom-store/data/ab-tests.csv`. Do not put a real product name in git.

## QC

Before and after counts match the export. The listing shows only the one variable changed. The script result matches the chat.

## Stop

A second variable would change in the same window. The price has no yes. `min_orders` is missing and you would still call a winner.

## Report

Variable, window, both rates, minimum, result, and whether the listing was left on the before or the after version.

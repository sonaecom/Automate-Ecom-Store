# Safe ads kickstart

Dry run follows `{baseDir}/modules/ops/dry-run.md`: walk the steps, take the screenshots, write the report, and do not click Save, Submit, or Send.

A small test on the hero products. Stop when the test budget is spent below the ROAS target. A higher budget is a proposal until the owner says yes for that amount.

Policy gate for reading ads is `read`. Saving a budget is `budget` and still needs the owner's yes. Never top up.

## When to use

The owner wants the first ads on a new or low-sales store.

## Steps

1. Hero SKUs come from `{baseDir}/modules/growth/hero-product.md`. Break-even ROAS comes from `{baseDir}/modules/growth/break-even.md`. If either is missing, stop.
2. The test budget is the number in the owner's private note. If the note has no number, ask. Do not invent one. The ROAS target is `roas_floor` when that is a number, and it must be at least the break-even ROAS. If the floor is still a placeholder, stop.
3. One campaign, one hero, one creative. Count it with `ads_changes` before any save. On `CAP`, stop.
4. Read spend and ROAS from the official ads export each session, not by refreshing the ads page in a loop. When spend reaches the test budget and ROAS is below the target, pause is a proposal: show both numbers and ask. Do not raise the budget to "give it more time".
5. Scale only when ROAS is at or above the target and the owner has approved the exact new daily amount in this chat. A yes for a different amount does not carry over. Do not type a card or open top-up.
6. QC before save and on the saved campaign: budget, product, and ROAS target. Screenshots `screenshots/qc1-ads-test.png` and `screenshots/qc2-ads-test.png`.

## QC

The saved budget equals the approved test amount. ROAS on the report matches the export. A second source that disagrees is shown as two numbers.

## Stop

No hero, no break-even, or no owner budget. A control would top up. ROAS would be set below the floor.

## Report

Test budget, target ROAS, break-even ROAS, spend so far, ROAS so far, and whether the next step is hold, pause, or a scale proposal.

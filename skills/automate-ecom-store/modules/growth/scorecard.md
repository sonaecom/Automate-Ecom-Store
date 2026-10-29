# Store diagnosis scorecard

Dry run follows `{baseDir}/modules/ops/dry-run.md`: walk the steps, take the screenshots, write the report, and do not click Save, Submit, or Send.

Read-only. Compare this store with competitors, then name the top 5 fixes by impact. Do not change the store in this module.

Policy gate action is `read`. Competitor pages open in a non-store browser, never in the seller profile.

## When to use

The owner has a new shop or a shop with low sales and wants to know what to fix first.

## Steps

1. From the official seller export, copy the store's own figures for the period the owner named. If they did not name a period, ask. Do not guess one.
2. In a non-store browser, open up to five competitor listings the owner named, or the top listings for `<MAIN_KEYWORD>` on that platform. Copy only public figures: price, review count, rating, ship promise if shown, and a 1–5 cover and title score you assign from the listing method. Label them `<COMPETITOR_1>` and so on. No shop name from a real page goes into git.
3. Build a CSV with columns `metric, ours, competitor, direction, impact, effort, fix`. `direction` is `higher` or `lower`. `impact` and `effort` are 1–5. A metric where this store is already better is kept so the script can ignore it.
4. Rank the fixes:

```bash
node {baseDir}/scripts/growth.mjs --scorecard <SCORECARD_CSV>
```

The script keeps rows where this store is behind, sorts by impact, then by lower effort, and prints five. Do not add a sixth in the summary.
5. Each fix names the module that would do the work. A price fix is only a proposal. An ads fix does not raise the budget.

## QC

Our figures match the export. Competitor figures match the public page you opened. The five lines match the script. A single source is labelled `SINGLE_SOURCE`.

## Stop

You would open the competitor in the seller profile. You would invent a competitor number. You would publish a fix from this module.

## Report

Period, five fixes in order, the gap and impact for each, sources, read time. Say which fixes wait for the owner.

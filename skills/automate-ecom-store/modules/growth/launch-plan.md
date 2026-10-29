# 30/60/90-day launch plan

Dry run follows `{baseDir}/modules/ops/dry-run.md`: walk the steps, take the screenshots, write the report, and do not click Save, Submit, or Send.

A plan for a new or low-sales store. It does not publish, change a price, or raise a budget. Those stay in their own modules after the owner says yes.

Policy gate action is `read`.

## When to use

The owner wants a 30, 60, and 90 day sequence after the scorecard.

## Steps

1. Run `{baseDir}/modules/growth/scorecard.md` first. The plan uses those five fixes. If the scorecard has fewer than five, use the ones it printed.
2. Days 1–30: listing QC on 1–3 hero products from `{baseDir}/modules/growth/hero-product.md`, shop trust items from `{baseDir}/modules/growth/reviews-trust.md`, and one small ads test from `{baseDir}/modules/growth/ads-kickstart.md` only after break-even is known.
3. Days 31–60: one funnel bottleneck from `{baseDir}/modules/growth/funnel.md`, then one sequential test from `{baseDir}/modules/growth/ab-test.md`. Do not start a second test in this window.
4. Days 61–90: scale the ads test only when ROAS is at or above `roas_floor` and the owner approved that exact budget. Otherwise keep the test budget and fix the losing step.
5. Write the plan as three blocks with the fix, the module, and whether it needs a yes. Do not date a task to a weekday the owner did not ask for.

## QC

Every block traces to a scorecard line, the hero list, or the funnel bottleneck. No block raises a cap or spends money by itself.

## Stop

There is no scorecard yet. A block would publish without a yes.

## Report

The three blocks, the hero SKUs, the first test, and the budget rule. `dry_run: true` when that mode is on.

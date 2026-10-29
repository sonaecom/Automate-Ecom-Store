# New platform or market pre-launch check

Dry run follows `{baseDir}/modules/ops/dry-run.md`: walk the steps, take the screenshots, write the report, and do not click Save, Submit, or Send.

A go, hold, or stop before a store opens on another platform or in another market. This module does not create the shop.

Policy gate action is `read` for the check. Creating listings later is a different session.

## When to use

The owner wants to know if `<PLATFORM>` in `<MARKET>` is ready for these products.

## Steps

1. Demand: copy the search or keyword figure from the official seller tool, and a second public search on a non-store browser. One source is `SINGLE_SOURCE`. Do not invent search volume.
2. Competitors: up to five public listings. Record the price band and review counts as `<COMPETITOR_1>` and so on. No real shop names in git.
3. Price: place the break-even price from `{baseDir}/modules/growth/break-even.md` inside or outside that band. A price below cost is `STOP` for ads even if the band is lower.
4. Permits and restricted goods: run the policy gate for that platform and market. `POLICY_PENDING` or `STALE` means permits are unknown. Result is `HOLD`. Do not guess a licence.
5. Fees: copy the commission and shipping fees from the official fee page for that market. If the page is missing, fees are unknown and the result is `HOLD`.
6. `GO` only when demand has a source, the price clears break-even, the policy gate is `ALLOW`, and fees were copied. Otherwise `HOLD` or `STOP`. `STOP` is for a prohibited item, a loss-making price the owner would still advertise, or a policy file that says the product is not allowed.

## QC

Each figure has a source and a read time. The result matches the rules above. A disagreement between two fee pages is shown as two numbers.

## Stop

You would open a seller account in this session. You would treat a pending policy file as permission.

## Report

Demand, price band, break-even price, permit status, fees, and `GO`, `HOLD`, or `STOP`, with the reason.

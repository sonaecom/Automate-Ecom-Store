# Per-market pricing

Policy preflight: read `{baseDir}/policies/LAYER.md` and run `policy-gate.mjs` for this platform and market before any action in this file.

Dry run follows `{baseDir}/modules/ops/dry-run.md`: walk the steps, take the screenshots, write the report, and do not click Save, Submit, or Send.

Each market gets its own price. The price keeps the same contribution after that market's fee rate. Do not reuse another market's price. Do not type the price until the owner says yes for that market.

Policy gate action is `read` for the proposal. Typing the price is `price` and needs `ALLOW` plus the owner's yes.

## When to use

A listing is being cloned, or an existing market price is being checked. The clone steps and the fee math are `{baseDir}/modules/scale/expand.md`.

## Steps

1. One row per SKU and destination market. Fee rates come from the official fee page or the market policy file. If the fee is still unverified, leave `dest_fee_rate` blank. Do not guess.
2. Run `scale.mjs --expand` as that module describes. `LOSS` and `HOLD` are not published.
3. Show the owner the proposed price, the fee rate, and the currency. Two fee pages that disagree are both shown. Do not average them.
4. After a yes, the platform listing or listing-update module types that price only, with QC before save and QC after save.
5. A later market is a new row. It does not inherit this price.

## QC

The typed price matches the approved proposal for that market. No other market's price was copied.

## Stop

The fee rate is blank and you would fill it. The result is `LOSS` or `HOLD` and you would publish. The owner has not said yes.

## Report

SKU, destination platform, destination market, proposed price, fee rate, currency, and whether it was typed.

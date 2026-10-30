# Order handling

Policy preflight: read `{baseDir}/policies/LAYER.md` and run `policy-gate.mjs` for this platform and market before any action in this file.

Dry run follows `{baseDir}/modules/ops/dry-run.md`: walk the steps, take the screenshots, write the report, and do not click Save, Submit, or Send.

Classification: **write**. Manifest `orders.handling`. `SHIP` only when the row has a variation and a pickup time. Otherwise `HOLD` or `REJECT`. Do not cancel an order to change a rate.

```bash
node {baseDir}/scripts/order-plan.mjs --orders ~/.automate-ecom-store/data/to-ship.csv --store <STORE_LABEL> --day <YYYY-MM-DD> --mode full --policy ALLOW --journal ~/.automate-ecom-store/data/journal/<STORE_LABEL>.jsonl
```

Pack and hand orders to the courier from the official to-ship list. Do not mark an order shipped before the courier pickup time is on the page.

Policy gate action is `read` for the list. Marking shipped is `submit` and needs `ALLOW`. Dry run stops before that click.

## When to use

The owner wants today's shippable orders handled in the seller centre. Rates and payouts stay in `{baseDir}/modules/orders/cancel-return.md` and `{baseDir}/modules/orders/settlement.md`.

## Steps

1. Open the to-ship list once. Copy order label, variation SKU, quantity, ship-by date, and status. The variation is the smallest SKU, not the parent title.
2. Match each row to `{baseDir}/modules/orders/status-map.md`. An order with no pickup time is not shipped.
3. Pack only rows whose ship-by date is due. Human pace, one tab. If the label on screen does not match this list, stop and ask.
4. Arrange pickup with the courier tool on that page. After the page shows a pickup time, read it back. Only then may you mark the order shipped, and only if the gate allows `submit` and dry run is off.
5. Screenshot `screenshots/qc1-orders.png` before the ship click and `screenshots/qc2-orders.png` after the page shows the pickup time.
6. A buyer message on the order goes to the platform chat module. Do not answer it from this file.

## QC

The shipped count matches the rows whose pickup time you read. Unshipped rows were not counted as shipped.

## Stop

You would mark shipped with an empty pickup time. You would cancel orders to improve a rate. The list and the export disagree and you would pick one.

## Report

Due count, shipped count, left unshipped, pickup times, read time. No buyer address in git.

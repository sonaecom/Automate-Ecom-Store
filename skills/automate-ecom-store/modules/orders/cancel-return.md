# Cancellation and return-to-sender rates

Policy preflight: read `{baseDir}/policies/LAYER.md` and run `policy-gate.mjs` for this platform and market before any action in this file.

Dry run follows `{baseDir}/modules/ops/dry-run.md`: walk the steps, take the screenshots, write the report, and do not click Save, Submit, or Send.

Read-only. Drill from variation up to market. Encode the owner's definitions exactly. Do not cancel an order from this module.

Policy gate action is `read`.

## Definitions

Cancellation rate = cancelled orders / total orders **created** in the period.

Include pre-shipment cancels. Break them down by reason and by who cancelled: buyer, seller, or system. An order that was shipped and then cancelled in transit is still a cancellation.

Return / RTS rate = orders that were **actually shipped out** and then failed delivery, were returned, or were cancelled in transit back to the warehouse, divided by total shipped-out orders in the period.

Shipped out means the parcel was handed to the courier. The export must have a courier pickup time or a first transit time. Orders not yet shipped out of the warehouse are never in the return rate, not in the numerator and not in the denominator.

`ready_to_ship` and `to_ship` are not shipped out.

## When to use

The owner wants cancellation rate and return rate for a period, from SKU up to market, and an alert when a rate is above the private threshold.

## Steps

1. Read `{baseDir}/modules/orders/status-map.md`.
2. Take the official order export, or a BigSeller All Orders export the person already uses. One row per order line (variation). Columns: order id, created date, store, platform, market, category, product, sku, staff, status, cancelled_by, cancel_reason, courier_pickup_time, outcome, currency. Use `<ORDER_ID>` style labels in any sample. Do not invent a pickup time.
3. Second source: the seller-centre order list or a second export of the same period. Two-source QC is order by order.

```bash
node {baseDir}/scripts/cancel-return.mjs --orders-a <EXPORT_A> --orders-b <EXPORT_B> --from <YYYY-MM-DD> --to <YYYY-MM-DD> --cancel-threshold <N> --rts-threshold <N> --out-dir ~/.automate-ecom-store/data/cancel-return/
```

Omit a threshold that is still a placeholder. The script then prints `threshold: unset` and does not invent one.

4. Read `order-qc.csv`. Every mismatch has a reason. A row that says returned but has no pickup time is `excluded_not_shipped` and is not in the return rate.
5. Read `rates.csv` from `sku` up through `market`, plus `staff` and `period`. Top offending SKUs are the highest return rate, then the highest cancellation rate, with at least one shipped order or one created order so a zero denominator is `undefined`.
6. If a store rate is above a set threshold, alert the owner. Do not cancel orders to "fix" the rate.
7. Push `rates.csv` to `CancelFacts`. The owner tab is `Cancel & Return`.

```bash
node {baseDir}/scripts/push-sheets.mjs --push --csv ~/.automate-ecom-store/data/cancel-return/rates.csv --tab CancelFacts
```

```text
=QUERY(CancelFacts!A1:L, "select * where A is not null", 1)
```

Filter `level` to `sku` and sort by `rts_rate` for the top offenders. A trend is `level=period`. Drill-down is the same sheet filtered from `sku` to `variation` (the sku column is the variation), then `product`, `category`, `store`, `platform`, `market`.

## Platform notes

Use `status-map.md`. Shopee, TikTok Shop, and Lazada all use the pickup-time rule. The status words differ. The export header you saw is the source name.

## QC

`order-qc.csv` has one reason per mismatch. Rates in the chat match the script. An unshipped order is absent from both sides of the return rate.

## Stop

You would cancel, refund, or mark a parcel shipped by hand. The two exports disagree and you would average them. A pickup time would have to be guessed.

## Report

Period, cancellation rate with buyer / seller / system counts, return rate, top SKUs, alerts, source names, read time. State the denominators. Do not say the return rate used all created orders.

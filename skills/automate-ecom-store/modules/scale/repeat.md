# Repeat customers

Policy preflight: read `{baseDir}/policies/LAYER.md` and run `policy-gate.mjs` for this platform and market before any action in this file.

Dry run follows `{baseDir}/modules/ops/dry-run.md`: walk the steps, take the screenshots, write the report, and do not click Save, Submit, or Send.

Segment buyers who already purchased. A refill note goes through the platform chat only. A follower voucher is a proposal.

Policy gate for reading the list is `read`. Sending a chat is `submit`. Publishing a voucher is `publish` and needs the owner's yes.

## Framework

A repeat buyer has at least `repeat.min_orders` orders (default 2). Use a placeholder key such as `<BUYER_1>`, not a name, phone, or address. A reminder is due when the days since the last order are at least `cycle_days`. Followers are a separate yes or no from the platform's own follower tool. Do not message anyone outside the shop chat. Do not ask for a star rating. The refill text is `replenishment` in `{baseDir}/templates/messages/library.json`.

## Workflow

1. From the official order export, count orders per buyer key and the last order date. Do not export addresses.
2. Rows: `buyer_key, orders, last_order_date, cycle_days, follower`.
3. Run:

```bash
node {baseDir}/scripts/scale.mjs --repeat <REPEAT_CSV> --as-of <YYYY-MM-DD> --config ~/.automate-ecom-store/scale.yaml
```

4. `REMIND` uses the replenishment template in the buyer's language, then the same caps and pace as `{baseDir}/modules/customers/post-delivery.md`. One note, then stop. A problem reply goes to a person.
5. A follower voucher is `{baseDir}/modules/customers/retention.md`. Propose it. Do not publish it here.
6. Run the policy gate `--text` on the refill message before send. `VIOLATION` means do not send.

## Config

`repeat.min_orders` in `{baseDir}/modules/scale/config.example.yaml`.

## Docs

`chat_off_platform` and `data_privacy` in the market policy file. Off-platform contact is a block.

## QC

The segment matches the script. The sent text matches the template aside from `<PRODUCT>`. No buyer personal data is in the report.

## Stop

The text would leave the platform or ask for stars. Dry run is on. The chat cap is spent.

## Report

How many buyers are `repeat`, how many are `REMIND`, and whether a voucher was only proposed.

# Inventory sync

Policy preflight: read `{baseDir}/policies/LAYER.md` and run `policy-gate.mjs` for this platform and market before any action in this file.

Dry run follows `{baseDir}/modules/ops/dry-run.md`: walk the steps, take the screenshots, write the report, and do not click Save, Submit, or Send.

Shopee, TikTok Shop, and Lazada stock pushes start here. The platform file only names the export and the bulk tool. Price changes are not part of this file. A price cut still needs the owner's yes in the platform stock-and-price module.

Policy gate action is `read` for the preview. A push is `stock_write` and needs `ALLOW`. Run the gate before the preview and again before any save.

## Framework

Two modes, set in `{baseDir}/modules/inventory/config.example.yaml` and copied to `~/.automate-ecom-store/inventory.yaml`:

- `manual`: the owner edits stock. The skill shows the diff and alerts. It never types a quantity.
- `auto`: the skill may push only inside the owner's local times, in batches, under the session cap, through the visible AdsPower window or the official bulk upload. Headless stays off.

The stock source is chosen per store and per SKU. `bigseller` means a BigSeller export the person already downloaded. `sheet` means a Google Sheet tab named in the private config. The mapping table links `source_sku` to `seller_sku`. Do not store a BigSeller password. Log out of BigSeller when the export is saved.

Proposed stock is source quantity minus `buffer`. It is never set below `reserved` plus `pending`. If that floor is higher than source minus buffer, the preview uses the floor and marks `floored`. A change at or above `skip_change_percent`, or a move up from zero, is `SKIP` and an alert. It is not pushed.

## Workflow

1. Policy gate for this platform and market, action `read`, with no listing text that fails the gate.
2. Account safety and the session runner. One visible tab. Captcha review is not `REVIEW`.
3. Download the official stock export in the seller profile. Columns needed: sku, on-hand, reserved, pending. Do not page the catalog.
4. Download the selected source. BigSeller: the inventory export, then log out. Sheet: the tab and columns named in the private config (`sku_column`, `qty_column`, `sheet_id`, `tab`). Do not print the sheet id if it is a real one. Sample files use `<SHEET_ID>`.
5. Preview. `--now` is the store's local time. Omit `--apply` for the dry-run diff.

```bash
node {baseDir}/scripts/inventory-sync.mjs --platform-stock <PLATFORM_CSV> --source <SOURCE_CSV> --map <MAP_CSV> --now <HH:MM> --config ~/.automate-ecom-store/inventory.yaml --out-dir ~/.automate-ecom-store/data/inventory/
```

6. Read `inventory-audit.csv`. `ALERT_ONLY` is manual mode. `PREVIEW` is auto mode outside the window or without `--apply`. `SKIP` with `large_change` or `from_zero` is an owner alert. `UNCHANGED` and `unmapped` are not pushed.
7. Push only rows marked `PUSH`. That requires mode `auto`, `--apply`, and `window: open`. Times in the sample are `08:00`, `14:00`, and `20:00`, plus or minus `tolerance_minutes`. The store timezone is `<TIMEZONE>` until the owner sets it.
8. Push in `batch` order. Wait with `delay-range.mjs` between batches (20–60 seconds). `--add` each listing on `listing_edits` before the batch. On `CAP` or `TIME_UP`, stop. The script's `session_max` and the listing cap both apply. The smaller remaining number wins. Use the official bulk tool when it is on screen. Otherwise one listing at a time. Match the variation's own name, not the title.
9. Before the click, run `dry-run.mjs --action submit` and the policy gate with action `stock_write`. Either block means do not save.
10. Log every decision:

```bash
node {baseDir}/scripts/audit-log.mjs --role <ROLE> --action stock_write --platform <PLATFORM> --result proposed
```

A viewer is `DENIED` and must not push. After a real save, log `--result ok` only when the second official export matches the pushed quantities.
11. Screenshot `screenshots/qc1-stock.png` of the preview and `screenshots/qc2-stock.png` after save. Idle on seller home.

## Config

`{baseDir}/modules/inventory/config.example.yaml`. Placeholders are not numbers. The private file holds the real buffer, percent, and clock.

## Docs

`stock_write` is a mutating policy action. Shipping SLA stays `verify: yes` until the on-screen number is copied. This module does not change that SLA.

## QC

The audit file matches the script lines. No `PUSH` row is below reserved plus pending. No `SKIP` large change was typed. The second export matches the pushed quantities or you stopped with both figures.

## Stop

Manual mode and a quantity would be typed. The window is closed. A change was skipped and you would push it anyway. BigSeller's password would be written down. Dry run or the policy gate blocks the save.

## Report

Mode, window, counts of `PUSH`, `PREVIEW`, `SKIP`, and `ALERT_ONLY`, each skipped reason, and whether a save happened. No sheet id, no profile id, no password.

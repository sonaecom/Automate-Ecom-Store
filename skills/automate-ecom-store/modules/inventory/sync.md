# Inventory sync

Policy preflight: read `{baseDir}/policies/LAYER.md` and run `policy-gate.mjs` for this platform and market before any action in this file.

Dry run follows `{baseDir}/modules/ops/dry-run.md`: walk the steps, take the screenshots, write the report, and do not click Save, Submit, or Send.

Shopee, TikTok Shop, and Lazada stock pushes start here. The platform file only names the export and the bulk tool. Price changes are not part of this file. A price cut still needs the owner's yes in the platform stock-and-price module.

Policy gate action is `read` for the preview. A push is `stock_write` and needs `ALLOW`. Run the gate before the preview and again before any save.

## Framework

Two modes, set in `{baseDir}/modules/inventory/config.example.yaml` and copied to `~/.automate-ecom-store/inventory.yaml`:

- `manual`: the owner sets stock for one selling variation, the smallest SKU, on one store. The input is a command, the example dashboard's sheet columns, or a Google Sheet cell such as `<SKU_A> = 50`. The skill previews that exact quantity, waits for confirmation, then types it in the visible AdsPower window. One variation, or a small batch under `session_max` and `listing_edits`.
- `auto`: the skill may push warehouse stock only inside the owner's local times, in batches, under the session cap, through the visible AdsPower window or the official bulk upload. Headless stays off.
- `live`: the skill reads the owner's Google Sheet with a read-only token, polls every 5 to 15 minutes, and pushes only variations whose proposed quantity differs from the last pushed stock. "Realtime" here means near-realtime. Safe pacing, the session cap, and captcha avoidance set the delay. The script does not flood the seller site.

Manual stock is the number the owner typed. Do not subtract `buffer`. Never set it below `reserved` plus `pending`. If the typed number is under that floor, the preview uses the floor, marks `floored`, and that floor is the only number that may be saved. A change at or above `skip_change_percent`, or a move up from zero, stays `PREVIEW` until the owner passes `--confirm`. Confirmation is the approval. Clock windows do not apply while the owner is present for a manual set.

Auto stock is the source quantity minus `buffer`, with the same floor. A change at or above `skip_change_percent`, or a move up from zero, is `SKIP` and an alert. It is not pushed. Auto marks `PUSH` only with `--apply` and an open window.

Live stock uses that same buffer, floor, and max-change check. It also skips a variation whose proposed quantity equals `last-pushed.csv`. A poll sooner than `poll_minutes` returns `WAIT` and does not call Google. The same sheet hash as the last committed snapshot returns `sheet: unchanged` and does not type a quantity. `push_asap: yes` does not wait for the clock. It still waits with `delay-range.mjs --kind page-load` between listings and stops at `session_max` and `listing_edits`. `--commit` writes the snapshot and the last-pushed file only after every `PUSH` row reads back `MATCH`. A closed window or a failed read-back leaves the snapshot in place so the next poll can try again.

The auto source is chosen per store and per SKU. `bigseller` means a BigSeller export the person already downloaded. `sheet` means a Google Sheet tab named in the private config. The mapping table links `source_sku` to `seller_sku`. Do not store a BigSeller password. Log out of BigSeller when the export is saved.

A manual Google Sheet is a list of exact sets, not a warehouse balance. The agent exports the tab named `manual_tab`. The script does not call Google and does not print a real sheet id. Sample files use `<SHEET_ID>`.

## Workflow

1. Policy gate for this platform and market, action `read`, with no listing text that fails the gate.
2. Account safety and the session runner. One visible tab. Captcha review is not `REVIEW`.
3. Download the official stock export in the seller profile. Columns needed: sku, on-hand, reserved, pending. The sku is the variation, not the parent title. Do not page the catalog.
4. Manual: take the owner's command or the exported manual tab. Auto: download the selected source. BigSeller: the inventory export, then log out. Sheet: the tab and columns named in the private config (`sku_column`, `qty_column`, `sheet_id`, `tab`). Do not print the sheet id if it is a real one.
5. Preview. Omit `--confirm` on a manual set, and omit `--apply` on auto, so the first pass is a dry-run diff. Quote placeholders so the shell does not treat `<` as a redirect.

```bash
node {baseDir}/scripts/inventory-sync.mjs --platform-stock <PLATFORM_CSV> --set "<SKU_A>=50" --store "<STORE_A>" --platform shopee --config ~/.automate-ecom-store/inventory.yaml --out-dir ~/.automate-ecom-store/data/inventory/
```

Repeat `--set` for a few variations on the same store and platform. A batch, including a sheet export, uses `--sets`:

```bash
node {baseDir}/scripts/inventory-sync.mjs --platform-stock <PLATFORM_CSV> --sets <SETS_CSV> --config ~/.automate-ecom-store/inventory.yaml --out-dir ~/.automate-ecom-store/data/inventory/
```

Auto, with `--now` as the store's local time:

```bash
node {baseDir}/scripts/inventory-sync.mjs --platform-stock <PLATFORM_CSV> --source <SOURCE_CSV> --map <MAP_CSV> --now <HH:MM> --mode auto --config ~/.automate-ecom-store/inventory.yaml --out-dir ~/.automate-ecom-store/data/inventory/
```

Live sheet, one poll. Omit `--source` to read the tab named `live_tab` with the read-only token. Pass `--minutes-since` from the previous poll. Pass `--push-asap` only when the private config says to push without waiting for the clock.

```bash
node {baseDir}/scripts/inventory-sync.mjs --platform-stock <PLATFORM_CSV> --source <SHEET_CSV> --map <MAP_CSV> --last-pushed ~/.automate-ecom-store/data/inventory/last-pushed.csv --now <HH:MM> --mode live --apply --config ~/.automate-ecom-store/inventory.yaml --out-dir ~/.automate-ecom-store/data/inventory/ --state ~/.automate-ecom-store/data/inventory/sheet-state.json
```

6. Read `inventory-audit.csv`. Manual without `--confirm` is `PREVIEW`. Manual with `--confirm` is `PUSH` until `session_max`, then `DEFER`. Auto `PREVIEW` means the window is closed or `--apply` was omitted. Auto `SKIP` with `large_change` or `from_zero` is an owner alert and must not be typed. The same reasons on a manual row stay `PREVIEW` until `--confirm`. `UNCHANGED`, `unmapped`, and `not_on_export` are not pushed.
7. Push only rows marked `PUSH`. Manual needs the owner's `--confirm`, `dry-run.mjs --action submit` allowed, and policy `stock_write` `ALLOW`. Auto needs mode `auto`, `--apply`, and `window: open`. Live needs mode `live`, `--apply`, and either `window: open` or `window: asap`. Sample auto times are `08:00`, `14:00`, and `20:00`, plus or minus `tolerance_minutes`. The store timezone is `<TIMEZONE>` until the owner sets it. After a live save and a `MATCH` read-back, run the same command with `--commit`. Do not commit a `PREVIEW`, a `DEFER`, or a `MISMATCH`.
8. Push in `batch` order. Wait with `delay-range.mjs --profile normal --kind page-load` between listings. `--add` each listing on `listing_edits` before the edit. On `CAP` or `TIME_UP`, stop. The script's `session_max` and the listing cap both apply. The smaller remaining number wins. Use the official bulk tool when it is on screen. Otherwise one variation at a time. Match the variation's own name, not the title. Do not type a `PREVIEW`, `SKIP`, or `DEFER` quantity.
9. Before the click, run `dry-run.mjs --action submit` and the policy gate with action `stock_write`. Either block means do not save. Leave the audit decision as the preview if the gate blocks.
10. Log every decision:

```bash
node {baseDir}/scripts/audit-log.mjs --role <ROLE> --action stock_write --platform <PLATFORM> --result proposed
```

A viewer is `DENIED` and must not push. After the save, download a second official export and read it back:

```bash
node {baseDir}/scripts/inventory-sync.mjs --platform-stock <PLATFORM_CSV> --sets <SETS_CSV> --readback <SECOND_EXPORT_CSV> --confirm --config ~/.automate-ecom-store/inventory.yaml
```

Log `--result ok` only when every pushed row prints `MATCH`. `MISMATCH` or `MISSING` means stop and report both figures. Do not log `ok`.
11. Screenshot `screenshots/qc1-stock.png` of the preview and `screenshots/qc2-stock.png` after save. Idle on seller home.

## Config

`{baseDir}/modules/inventory/config.example.yaml`. Placeholders are not numbers. The private file holds the real buffer, percent, clock, manual sheet columns, and live sheet settings (`poll_minutes`, `push_asap`, `live_tab`). `poll_minutes` is clamped to 5–15. The read-only token is saved only when onboarding question 2 is yes: they already have a real-time inventory tracking file on Google Sheets. It is not written in this file. If `inventory_sheet` is no, do not call Google and do not save that token. Manual and auto still run.

## Docs

`stock_write` is a mutating policy action. Shipping SLA stays `verify: yes` until the on-screen number is copied. This module does not change that SLA.

## QC

The audit file matches the script lines. No `PUSH` row is below reserved plus pending. No unconfirmed manual row was typed. No auto or live `SKIP` large change was typed. A live poll did not run sooner than 5 minutes. The second export is `MATCH` for each pushed variation, or you stopped with both figures.

## Stop

A `PREVIEW`, `SKIP`, or `DEFER` quantity would be typed. A manual number the owner did not confirm would be typed. The typed number is below reserved plus pending. The auto or live window is closed and push-asap is off. An auto or live change was skipped and you would push it anyway. The sheet would be polled faster than every 5 minutes. BigSeller's password or the Google token would be written down. Dry run or the policy gate blocks the save. The read-back is not `MATCH`.

## Report

Mode, whether the owner confirmed, window, `asap`, or `n/a`, poll minutes, counts of `PUSH`, `PREVIEW`, `SKIP`, and `DEFER`, each reason, each read-back `MATCH` or `MISMATCH`, and whether a save happened. Say `WAIT` or `sheet: unchanged` when no push was considered. No sheet id, no token, no profile id, no password.

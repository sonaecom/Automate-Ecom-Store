# Owner dashboard

Dry run follows `{baseDir}/modules/ops/dry-run.md`: walk the steps, take the screenshots, write the report, and do not click Save, Submit, or Send.

Read-only. The default view is Google Sheets. The optional web app is the same numbers in a browser. Do not type a rate that is not already in the sheet or the rate ledger. Do not average two sources.

Policy gate action is `read`.

## When to use

The owner wants overview, platform, market, store, staff, SKU profit, ads, wallet, cancellation and return rates, inventory, and alerts.

## Choose a surface

Ask once if they did not name one.

1. **Google Sheets, the default.** Push the fact tabs from the module that produced them: `FxFacts`, `AdsFacts`, `WalletFacts`, `CancelFacts`. The owner edits `Settings/FX`. The owner tabs use QUERY so a later push does not wipe formulas. See each module's `sheets-tab.md`.
2. **Web dashboard.** Optional. Vietnamese labels, light and dark, phone layout. It reads those same tabs, or the same CSV files.

```bash
cd dashboard/web
pnpm i && pnpm dev
```

`DATA_SOURCE=sample` is the example files and needs no key. `DATA_SOURCE=sheets` needs `GOOGLE_SHEETS_ID` and `GOOGLE_SHEETS_ACCESS_TOKEN` in `.env.local`. Do not commit that file. Do not make the spreadsheet public so an API key can read it.

Set `DASHBOARD_PASSWORD` before pointing the app at real exports. On Vercel, also turn on Password Protection. The steps are in `dashboard/web/README.md`.

## What the pages use

- Overview, currency toggle, and Settings use `FxFacts`, `MarketRates`, and `Settings/FX`. Base currency defaults to VND. Market versus custom follows `{baseDir}/modules/fx/reporting.md`. Editing a custom rate on the Settings page recomputes the months on screen and does not write the sheet.
- Ads uses `AdsFacts`. Wallet uses `WalletFacts`. Last 4 digits only.
- Cancel and return uses `Orders` when that tab exists, with the same shipped-out rule as `{baseDir}/modules/orders/cancel-return.md`. Otherwise it lists `CancelFacts` by level.
- SKU profit uses `SkuPnl`. Inventory uses `Inventory`. Those two files are examples until a module writes them. The page says so.
- Alerts use the thresholds tab. If the label is `example`, say the threshold is an example.
- AI cost uses `AiCost`, one row per run and store. A blank cost stays blank.

## QC

A base amount on screen matches native amount times the stored rate, or the row shows the sheet's `qc` value. If a recomputed amount and the sheet amount differ, show both. Do not average them.

## Stop

The app would write a rate, a budget, a withdrawal, or a public link to the spreadsheet. A password would be pasted into a file that is committed.

## Report

Which surface the owner is using, the base currency, the FX mode, and whether the numbers are the example set or their sheet.

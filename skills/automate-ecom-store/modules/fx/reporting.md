# Multi-currency reporting

Dry run follows `{baseDir}/modules/ops/dry-run.md`: walk the steps, take the screenshots, write the report, and do not click Save, Submit, or Send.

Read-only. Sales, ad spend, and wallet amounts stay in the currency of the market. This module converts them into one base currency. Default base is VND. The owner can set another base. It does not change a price, a budget, or a payout.

Policy gate action is `read`.

## When to use

The owner wants PHP, MYR, IDR, THB, VND, SGD, USD, or any other market currency beside a base-currency total, and a switch between the daily market rate and their own monthly rate.

## Definitions

Read `{baseDir}/modules/fx/sources.md` and follow it. Two modes:

- `market` — daily rate from the free currency-api file, stored per date.
- `custom` — owner rate for one currency for one month, from `Settings/FX`. Example: `1 PHP = 430 VND`.

The dashboard toggle is `Dashboard!B1`. Both amounts are on every row, so the toggle changes the view without dropping the other rate.

### Fallback

Never invent a rate. Never average two rates. Never use a rate dated after the amount.

Market view, in order:

1. Daily ledger rate on the amount date. Fallback `none`.
2. Latest daily rate on or before that date. Fallback `market_on_or_before`.
3. `Settings/FX` row for that month with mode `market`. Fallback `monthly_market`.
4. No rate. The base amount stays blank. QC is `NO_RATE`.

Custom view, in order:

1. `Settings/FX` row for that month with mode `custom`. Fallback `none`.
2. Latest earlier month with mode `custom` for that currency. Fallback `earlier_custom_month`.
3. Daily rate on the amount date. Fallback `market_for_missing_custom`.
4. Latest daily rate on or before that date. Fallback `market_on_or_before`.
5. `Settings/FX` row for that month with mode `market`. Fallback `monthly_market`.
6. No rate. QC is `NO_RATE`.

If the two market files, or the two custom files, disagree on the rate that step would use, stop on that step. QC is `RATE_MISMATCH`. Do not fall through and do not pick one.

If the native currency is the base, the rate is 1 and the mode is `identity`.

Market columns stay blank when no market rate exists, even if a custom rate exists. The custom columns still hold that custom rate. The toggle chooses which pair to show.

## Steps

1. Take native amounts from the official exports already used for sales, ads, and wallet. One row per figure. Columns: `date, store, platform, market, stream, native_amount, currency, source, read_time`. `stream` is `sales`, `ads`, or `wallet`. Do not convert them by hand.
2. Second source for a market rate is a second ledger file. Second source for a custom rate is a second export of `Settings/FX`. Omit the second file only when you have one source, and say so.
3. Convert. This recompute is always full: every row is native amount times the current table. Editing a custom rate and running again rewrites that month's history. Old base amounts are not kept.

```bash
node {baseDir}/scripts/fx-convert.mjs --amounts <AMOUNTS> --market-rates <LEDGER> --market-rates-b <LEDGER_B> --custom-rates <SETTINGS_FX> --custom-rates-b <SETTINGS_FX_B> --previous <LAST_CONVERTED> --base VND --mode custom --out-dir ~/.automate-ecom-store/data/fx/
```

`--base` defaults to VND. `--mode` is `custom` or `market` and defaults to `custom`. Add `--fetch` to fill missing days from the free source in `sources.md`. Add `--import-json` to load one saved currency-api file offline. A day already in the ledger is left as it is.

4. Read `converted.csv`. Each row has the native amount, both rates, the rate date, the rate month, the mode, and the fallback. `qc` is the reason a row did not convert.
5. `rates-used.csv` is the rate stored for each date or month the run actually applied. `recomputed: YYYY-MM CUR` means that custom rate changed versus `--previous`.
6. Push facts. Do not push `Settings/FX` again after the owner has edited it.

```bash
node {baseDir}/scripts/push-sheets.mjs --push --csv ~/.automate-ecom-store/data/fx/converted.csv --tab FxFacts
node {baseDir}/scripts/push-sheets.mjs --push --csv ~/.automate-ecom-store/data/fx/rates-used.csv --tab RatesUsed
```

7. The owner tab formulas are in `{baseDir}/modules/fx/sheets-tab.md`. The toggle shows the amount, the rate, the date or month, and which rule applied.

## QC

`amount` equals native amount times the stored rate, or the row is `QC_FAIL`. A mismatch names the date or month and the currency. Totals add only rows with `qc` `OK`, and they do not add different native currencies together.

## Stop

You would type a rate that was not in the ledger or on `Settings/FX`. The two files disagree and you would average them. You would freeze a historical month instead of recomputing it after a custom-rate edit.

## Report

Base, view, each stream's native total and base total, rows with `NO_RATE` or `RATE_MISMATCH`, any `recomputed` month, source names, read time. State the rate and the date or month beside every base figure you quote.

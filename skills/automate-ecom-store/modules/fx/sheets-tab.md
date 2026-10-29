# Multi-currency sheet

Policy preflight: read `{baseDir}/policies/LAYER.md` and run `policy-gate.mjs` for this platform and market before any action in this file.

Dry run follows `{baseDir}/modules/ops/dry-run.md`: walk the steps, take the screenshots, write the report, and do not click Save, Submit, or Send.

The owner edits `Settings/FX`. The script rewrites `FxFacts` and `RatesUsed`. The owner tab is `Multi-currency`. Formulas on that tab stay put because the script does not write it.

## Settings/FX

Columns A to D:

```text
month, currency, rate, mode
```

One row per month and currency. Rate means 1 unit of that currency in the base currency. Do not push this tab again after the owner has typed in it. Export it and pass the file as `--custom-rates` when you recompute.

## Dashboard toggle

`Dashboard!B1` is `market` or `custom`. `Dashboard!B2` is the base currency, default `VND`. The next script run uses the same view: `--mode` and `--base`.

## FxFacts columns

`date, store, platform, market, stream, native_amount, currency, base_currency, market_rate, market_rate_date, market_rate_month, market_fallback, amount_market, custom_rate, custom_rate_date, custom_rate_month, custom_fallback, amount_custom, applied_mode, applied_rate, applied_rate_date, applied_rate_month, applied_fallback, amount_base, qc, source, read_time`

`stream` is `sales`, `ads`, or `wallet`.

## Multi-currency formulas

List every fact row from `A1`:

```text
=QUERY(FxFacts!A1:AA, "select * where A is not null", 1)
```

Amount that follows the toggle, from `AC2`:

```text
=ARRAYFORMULA(IF(FxFacts!A2:A="", "", IF(Dashboard!B1="market", FxFacts!M2:M, FxFacts!R2:R)))
```

Which rate applied, from `AD2`. A fallback other than `none` is the rule that was used. `none` means the selected mode itself.

```text
=ARRAYFORMULA(IF(FxFacts!A2:A="", "", IF(Dashboard!B1="market", IF(FxFacts!L2:L="none", IF(FxFacts!G2:G=FxFacts!H2:H, "identity", "market"), FxFacts!L2:L), IF(FxFacts!Q2:Q="none", IF(FxFacts!G2:G=FxFacts!H2:H, "identity", "custom"), FxFacts!Q2:Q))))
```

Rate, from `AE2`:

```text
=ARRAYFORMULA(IF(FxFacts!A2:A="", "", IF(Dashboard!B1="market", FxFacts!I2:I, FxFacts!N2:N)))
```

Rate date or month, from `AF2`:

```text
=ARRAYFORMULA(IF(FxFacts!A2:A="", "", IF(Dashboard!B1="market", IF(FxFacts!J2:J="", FxFacts!K2:K, FxFacts!J2:J), IF(FxFacts!O2:O="", FxFacts!P2:P, FxFacts!O2:O))))
```

Native amount stays in column F. Do not hide it.

`RatesUsed` is the rate ledger for the applied view: one row per rate date or rate month actually used.

Filter `qc` not equal to `OK` for the exception list. A trend chart uses `date` and the toggle amount. Top stores use `totals.csv` level `store`.

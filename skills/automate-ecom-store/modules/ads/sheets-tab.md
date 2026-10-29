# Ads & Top-up sheet

Dry run follows `{baseDir}/modules/ops/dry-run.md`: walk the steps, take the screenshots, write the report, and do not click Save, Submit, or Send.

The owner looks at the tab named `Ads & Top-up`. The script writes rows to `AdsFacts` so those formulas are not wiped.

## AdsFacts columns

`date, store, platform, market, spend, currency, gmv_attributed, roas, spend_pct_gmv, balance, days_left, topup_amount, match_status, source, read_time, timezone`

## Ads & Top-up formulas

Put this in `A1` of `Ads & Top-up`. It lists every fact row.

```text
=QUERY(AdsFacts!A1:P, "select * where A is not null", 1)
```

Spend percent of GMV for one store, with the store label in `Settings!B1`:

```text
=IF(SUMIF(AdsFacts!B:B, Settings!B1, AdsFacts!G:G)=0, "undefined", SUMIF(AdsFacts!B:B, Settings!B1, AdsFacts!E:E)/SUMIF(AdsFacts!B:B, Settings!B1, AdsFacts!G:G))
```

ROAS versus the floor in `Settings!B2`:

```text
=IF(SUMIF(AdsFacts!B:B, Settings!B1, AdsFacts!E:E)=0, "undefined", SUMIF(AdsFacts!B:B, Settings!B1, AdsFacts!G:G)/SUMIF(AdsFacts!B:B, Settings!B1, AdsFacts!E:E))
```

Conditional format: if that ROAS is a number and it is below `Settings!B2`, mark the cell. Days of balance left are column K. Alert the owner when K is a number and K is below 3.

`match_status` values the script writes: `MATCH`, `UNMATCHED_TOPUP`, `UNMATCHED_CHARGE`, `DUPLICATE`, `QC_FAIL`, `SINGLE_SOURCE`.

Filter the tab to `match_status` not equal to `MATCH` for the owner's exception list. A chart of spend by date uses columns A and E on `AdsFacts`.

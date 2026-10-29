# FX sources

The base currency defaults to VND. Pass `--base` to use another code. A rate is how many units of the base equal **1** unit of the native currency. `1 PHP = 430 VND` is currency `PHP`, rate `430`, base `VND`.

## Market rate (mode `market`)

Free source, no key: the [currency-api](https://github.com/fawazahmed0/currency-api) daily files.

Primary URL:

```text
https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@<YYYY-MM-DD>/v1/currencies/<base>.min.json
```

Mirror if the primary URL fails:

```text
https://<YYYY-MM-DD>.currency-api.pages.dev/v1/currencies/<base>.min.json
```

`<base>` is the base code in lower case, for example `vnd`. The file says how many units of each currency equal **1** unit of the base. The script stores the inverse, so the ledger is still "1 native = rate base". It stores the `date` field from that file, not a guessed date.

`--fetch` downloads a missing day and appends it to the local ledger. It does not replace a rate already stored for that date and currency. The ledger file is `market-ledger.csv`: `date, currency, base, rate, source`.

## Custom rate (mode `custom`)

The owner types one rate per currency per month on the `Settings/FX` tab. Columns, in this order:

```text
month, currency, rate, mode
```

`month` is `YYYY-MM`. `mode` is `custom` or `market`. A `custom` row is the owner's rate. A `market` row is an optional monthly market rate used only when no daily rate exists. Any other mode is ignored.

Example: month `2026-10`, currency `PHP`, rate `430`, mode `custom`.

## What is stored on every converted number

Native amount, native currency, base currency, rate, rate date, rate month, mode (`market`, `custom`, or `identity`), and the fallback name. `identity` means the native currency is the base, so the rate is 1.

Both the market conversion and the custom conversion are stored. The dashboard toggle picks which pair to show. `applied_*` is the pair from `--mode` on the last run.

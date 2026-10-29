# Wallet & Payouts sheet

Dry run follows `{baseDir}/modules/ops/dry-run.md`: walk the steps, take the screenshots, write the report, and do not click Save, Submit, or Send.

The owner looks at the tab named `Wallet & Payouts`. The script writes rows to `WalletFacts` so those formulas are not wiped.

## WalletFacts columns

`date, store, platform, market, available, pending, incoming, currency, withdrawal_amount, withdrawal_fee, withdrawal_net, bank_last4, withdrawal_status, match_status, source, read_time, timezone`

## Wallet & Payouts formulas

In `A1`:

```text
=QUERY(WalletFacts!A1:Q, "select * where A is not null", 1)
```

Available balance for the store label in `Settings!B1`:

```text
=SUMIF(WalletFacts!B:B, Settings!B1, WalletFacts!E:E)
```

Pending:

```text
=SUMIF(WalletFacts!B:B, Settings!B1, WalletFacts!F:F)
```

Filter `match_status` to everything except `MATCH` and `OK` for the exception list. Status values the script writes: `MATCH`, `MISSING`, `PENDING_TOO_LONG`, `AMOUNT_MISMATCH`, `DUPLICATE`, `QC_FAIL`, `SINGLE_SOURCE`.

Alert the owner from `{baseDir}/modules/ops/alerts.md` when a row is `MISSING`, `PENDING_TOO_LONG`, or `AMOUNT_MISMATCH`.

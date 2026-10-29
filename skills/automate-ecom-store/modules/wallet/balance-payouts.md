# Seller wallet and withdrawals

Policy preflight: read `{baseDir}/policies/LAYER.md` and run `policy-gate.mjs` for this platform and market before any action in this file.

Dry run follows `{baseDir}/modules/ops/dry-run.md`: walk the steps, take the screenshots, write the report, and do not click Save, Submit, or Send.

Read-only. Once per session for each saved store, inside the pace and session caps. Never start a withdrawal. Never add or edit a bank account. Bank numbers are last 4 digits only.

Policy gate action is `read`.

## When to use

The owner wants available balance, pending balance, incoming settlements, and a check that each withdrawal actually reached the bank.

## Prerequisites

1. Account safety and the session runner. One seller tab. Do not poll the wallet.
2. `{baseDir}/modules/wallet/metric-map.md` for where the number lives.
3. `{baseDir}/modules/wallet/sheets-tab.md` before the dashboard write.
4. Two sources for available and pending: the wallet screen and an official statement export. One source is `SINGLE_SOURCE` and is not final.

## Steps

1. Open the store profile. Read available, pending, and incoming once. Copy them exactly. Record the on-screen label, timezone, and `read_time`.
2. Open the withdrawal history on that same page. For each row copy date, amount, fee, status, and the last 4 digits of the bank account. If a full account number is visible, do not copy it. Do not click Withdraw.
3. Download the official statement for the same moment. Two-source QC:

```bash
node {baseDir}/scripts/wallet-reconcile.mjs --balance-a <SCREEN> --balance-b <EXPORT> --withdrawals <WITHDRAWALS> --credits <BANK_CREDITS> --as-of <YYYY-MM-DD> --out-dir <OUT_DIR>
```

`<OUT_DIR>` is `~/.automate-ecom-store/data/wallet/`. On `QC_FAIL`, stop and report both figures. Do not average them.

4. Bank credits come from Gmail deposit notices or a statement file already in Drive. The script reduces a long account number to the last 4 digits. Match a completed withdrawal to a credit when the currency matches, the credit equals amount minus fee, the credit date is on or after the withdrawal date and within 5 days, and the last 4 digits match. Five days is a default. If the statement page prints a different arrival window, pass `--wait-days` with that number.
5. A completed withdrawal with no credit is `MISSING`. A pending withdrawal older than 7 days is `PENDING_TOO_LONG` (`--pending-days` if the page names a different limit). A credit that is not amount minus fee is `AMOUNT_MISMATCH`. A repeated bank row is `DUPLICATE`.
6. Alert the owner for every `MISSING`, `PENDING_TOO_LONG`, and `AMOUNT_MISMATCH`. The alert does not start a withdrawal.
7. Push `normalized-wallet.csv` to `WalletFacts`. The `Wallet & Payouts` tab reads it. See `sheets-tab.md`.

```bash
node {baseDir}/scripts/push-sheets.mjs --push --csv <OUT_DIR>/normalized-wallet.csv --tab WalletFacts
```

If the Google token is missing, keep the local CSV and say the sheet was not updated.

## Platform notes

Shopee is Seller Wallet or My Balance. TikTok Shop is Balance or Finance. Lazada is Wallet or Account Statement. Use the header you saw.

## QC

Available and pending agree across two sources, or both numbers are in the report. Every figure has a source and a read time. No full bank account number in the output. No withdrawal was started.

## Stop

- A control would withdraw or change a bank account.
- The two sources disagree.
- A file still has more than 4 digits of an account number in a row.
- You would refresh the wallet again in this session to "update" it.

## Report

Per store: available, pending, incoming, currency, each withdrawal with fee, net, last 4, status, and match result, source names, read time, timezone. Screenshot the balance page with any full account number covered. To show a balance in the base currency, pass the same native amounts to `{baseDir}/modules/fx/reporting.md`. Do not convert them in this module.

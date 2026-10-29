# Owner alerts

Policy preflight: read `{baseDir}/policies/LAYER.md` and run `policy-gate.mjs` for this platform and market before any action in this file.

Dry run follows `{baseDir}/modules/ops/dry-run.md`: walk the steps, take the screenshots, write the report, and do not click Save, Submit, or Send.

Tell the owner in this chat. Do not email a customer. Do not email a one-time code. One alert per cause per session, not a repeat every minute.

Send an alert when:

- GMV in the latest official export is down versus the previous export by more than the percent in dashboard Settings. If Settings has no percent, describe both numbers and do not invent a threshold.
- ROAS from the export is below `roas_floor`. If the floor is still a placeholder, say the floor is unset and show the two figures.
- Penalty points or a violation count went up versus the last health snapshot.
- A captcha was shown. Hand the screen to a person after the one allowed slider try in account safety.
- A SKU in the stock export is zero and the spec still lists it for sale.
- Inventory sync skipped an auto row for `large_change` or `from_zero`. Do not type that quantity. A manual set stays `PREVIEW` until the owner confirms it. Do not type an unconfirmed quantity. A confirmed manual set may be typed, then read back.
- Days of ads balance left, from `modules/ads/spend-topup.md`, are under 3. Propose a top-up. Do not perform it.
- A withdrawal from `modules/wallet/balance-payouts.md` is missing, pending too long, or the bank amount does not match. Do not start a withdrawal.
- An order from `modules/orders/settlement.md` is `UNDERPAID`. Do not file the dispute yourself.
- Platform fee percent from `modules/fees/fee-cap.md` is `NEAR` or `OVER` the owner's cap. Name the fee program and the SKU. A proposal to opt out, change a price, or stop a promotion waits for the owner. Do not click it. If the two exports disagree, show both numbers.
- A store cancellation rate or return rate from `modules/orders/cancel-return.md` is above the owner's threshold. Do not cancel orders to change the rate.
- Shop health from `modules/scale/health.md` is `EARLY` or `BREACH` against the late-shipment, cancellation, chat-reply, or penalty threshold in `policies/rules.yaml` for that same market. An `unverified=yes` Lazada PH, MY, or ID figure is still an alert, and the local page still needs a browser re-check. Do not cancel orders or open a second account to change the number.
- A sales, ads, or wallet row from `modules/fx/reporting.md` has no rate or the two rate files disagree. Do not invent a rate and do not average the two files.
- A dispute deadline from `modules/orders/disputes.md` is inside 2 days. Do not submit the appeal yourself.
- Account security from `modules/ops/account-security.md` shows a new login or a bank-account change. Do not edit the account.

Each alert names the platform, the market, the two exact figures, and the export time. Last 4 digits of a card only, and only if a card was already on screen. Never the full number. Never a top-up.

## Platform notes

Read the health and order pages inside the store profile, one tab, human pace. Competitor prices that feed an alert are read from the non-store browser. Shopee, TikTok Shop, and Lazada alerts use the same text. The page name differs. If you cannot find the health page, stop and ask. Do not guess a penalty number.

## QC

The figures in the alert match the export you just opened, and a second official view. If they differ, send both and do not pick one.

## Stop

Stop if sending the alert would require a customer email or a payment click.

## Report

The alert text and whether the owner has replied.

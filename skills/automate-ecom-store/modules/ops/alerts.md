# Owner alerts

Tell the owner in this chat. Do not email a customer. Do not email a one-time code. One alert per cause per session, not a repeat every minute.

Send an alert when:

- GMV in the latest official export is down versus the previous export by more than the percent in dashboard Settings. If Settings has no percent, describe both numbers and do not invent a threshold.
- ROAS from the export is below `roas_floor`. If the floor is still a placeholder, say the floor is unset and show the two figures.
- Penalty points or a violation count went up versus the last health snapshot.
- A captcha was shown. Hand the screen to a person after the one allowed slider try in account safety.
- A SKU in the stock export is zero and the spec still lists it for sale.
- Days of ads balance left, from `modules/ads/spend-topup.md`, are under 3. Propose a top-up. Do not perform it.
- A withdrawal from `modules/wallet/balance-payouts.md` is missing, pending too long, or the bank amount does not match. Do not start a withdrawal.
- An order from `modules/orders/settlement.md` is `UNDERPAID`. Do not file the dispute yourself.
- A store cancellation rate or return rate from `modules/orders/cancel-return.md` is above the owner's threshold. Do not cancel orders to change the rate.
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

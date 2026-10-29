# Affiliate chat reply

Policy preflight: read `{baseDir}/policies/LAYER.md` and run `policy-gate.mjs` for this platform and market before any action in this file.

Dry run follows `{baseDir}/modules/ops/dry-run.md`: walk the steps, take the screenshots, write the report, and do not click Save, Submit, or Send.

Reply to a creator who already wrote in the platform affiliate or order chat. Shopee, TikTok Shop, and Lazada use this same file. The invite itself stays in the platform invite module.

Policy gate action is `submit` for the reply text. Dry run stops before Send.

## When to use

A creator asked about a sample, a video, or a commission inside the seller centre. Not for a new invite batch. Not for a buyer review request.

## Steps

1. Run `affiliate-gate.mjs` for this platform and market before you promise a commission change. A Shopee MY targeted offer still needs a store-wide campaign. Do not invent an invite limit. Voucher rules for this pack were not captured.
2. Read the thread once. Draft a short reply from the owner's note. Run `check-message-length.mjs`. Pass the draft through `policy-gate.mjs --action submit --text`.
3. The reply stays on the platform. No phone number, no email, no off-platform link, no request that the creator cancel an order.
4. Do not promise income. Do not ask for a 5-star or positive review. Do not offer a reward for a rating. A commission change is a proposal in `{baseDir}/modules/affiliate/post-invite.md` until the owner says yes.
5. One reply, then the 20–60 second pause. `--add` one `chat_replies`. On `CAP`, stop.
6. Screenshot `screenshots/qc1-affiliate-chat.png` before Send and `screenshots/qc2-affiliate-chat.png` after the sent bubble is on screen.

## QC

The sent text matches the draft. The gate was `ALLOW`. No second channel was used.

## Stop

The gate blocks the text. The creator asked for an off-platform payment. You would change the commission without a yes.

## Report

Handle label, platform, whether you sent or handed the thread to a person. Do not paste a long private address.

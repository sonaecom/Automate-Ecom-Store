# Affiliate chat reply

Policy preflight: read `{baseDir}/policies/LAYER.md` and run `policy-gate.mjs` for this platform and market before any action in this file.

Dry run follows `{baseDir}/modules/ops/dry-run.md`: walk the steps, take the screenshots, write the report, and do not click Save, Submit, or Send.

Reply to a creator who already wrote in the platform affiliate or order chat. Shopee, TikTok Shop, and Lazada use this same file.

Policy gate action is `submit` for the reply text. Dry run stops before Send.

Read `{baseDir}/modules/affiliate/invite-lessons.md` and this shop's block in `~/.automate-ecom-store/invite.yaml` before the first click. One profile, one tab. An xdg-open or Open app prompt is Cancel, never Allow.

## When to use

A creator wrote in the seller-centre chat after an invite, or asked for a sample. Not a buyer review request. Not a cold invite batch.

## KOL chat after invite

The approved flow is `{baseDir}/docs/affiliate/kol-chat-flow.md`. This section follows that file. The earlier note is retired.

Enqueue one task per creator thread with `task-queue.mjs`. A second message on the same creator updates that task. Actions are `kol_problem`, `kol_deadline`, `kol_sample`, `kol_question`, `kol_collaborate`, and `kol_followup`.

Read `data/<shop>/invited_kol.csv` and `data/<shop>/kol_chat_log.csv` before Send. Run `kol-chat.mjs --check`, then `--can-send`. Send only on `ALLOW` and `SEND`. Use the template id from the shop file. Fill placeholders from that file only.

Approve only a size in `sample_allowlist`, by hand. Any other size uses `sample_other_size`. Turn automated approval by criteria to manual or to no sample.

`followups.enabled` stays false until the owner sets timing and text. Do not invent a deadline.

Log every sent or received message with `kol-chat.mjs --log`. At session end, count replied, approved, declined, escalated, and pending from that log.

## Steps

1. Run `affiliate-gate.mjs` for this platform and market before you promise a commission change. A Shopee MY targeted offer still needs a store-wide campaign. Do not invent an invite limit. Voucher rules for this pack were not captured.
2. Read the thread once. Draft from the shop templates or FAQ. Run `check-message-length.mjs`, then `kol-chat.mjs --check`. Do not send on `BLOCKED`.
3. The reply stays on the platform. No phone number, no email, no URL, no off-platform deal, no price cut, and no request that the creator cancel an order. A refund points at the platform order flow and does not promise one.
4. Do not promise income. Do not ask for a 5-star or positive review. Do not offer a reward for a rating. A commission change is a proposal in `{baseDir}/modules/affiliate/post-invite.md` until the owner says yes.
5. One reply, then the human typing pause. `--add` one `chat_replies`. On `CAP`, or when the KOL session caps are full, stop. Append `kol_chat_log.csv` before the next thread.
6. Screenshot `screenshots/qc1-affiliate-chat.png` before Send and `screenshots/qc2-affiliate-chat.png` after the sent bubble is on screen.

## QC

The sent text matches the draft. The gate was `ALLOW`. No second channel was used.

## Stop

The gate blocks the text. The creator asked for an off-platform payment. You would change the commission without a yes.

## Report

Handle label, platform, whether you sent or handed the thread to a person. Do not paste a long private address.

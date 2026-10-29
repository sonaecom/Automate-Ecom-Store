# Affiliate chat reply

Policy preflight: read `{baseDir}/policies/LAYER.md` and run `policy-gate.mjs` for this platform and market before any action in this file.

Dry run follows `{baseDir}/modules/ops/dry-run.md`: walk the steps, take the screenshots, write the report, and do not click Save, Submit, or Send.

Reply to a creator who already wrote in the platform affiliate or order chat. Shopee, TikTok Shop, and Lazada use this same file.

Policy gate action is `submit` for the reply text. Dry run stops before Send.

Read `{baseDir}/modules/affiliate/invite-lessons.md` and this shop's block in `~/.automate-ecom-store/invite.yaml` before the first click. One profile, one tab. An xdg-open or Open app prompt is Cancel, never Allow.

## When to use

A creator wrote in the seller-centre chat after an invite, or asked for a sample. Not a buyer review request. Not a cold invite batch.

## KOL chat after invite

Platform chat only. Language comes from `chat.language`. PH and MY default to English when that field is empty. Any other market with an empty language stops. Ask the owner. Do not invent a translation.

Never promise a refund, an off-platform deal, a contact detail, or a price cut. For a refund, point to the platform order flow. Do not name a contact, a phone, an email, or a URL. Run `policy-gate.mjs --action submit --text` on the draft. `VIOLATION` means do not send.

### No invite yet

The creator asked for a sample and this shop's invite log has no invite row for that handle (`invite-log.mjs --handle` is `NEW`). Create one custom target invite by copying the standard template in `invite-lessons.md`: fixed commission on all products, expiry about 30 days, manual sample approval, samples only from the allowlist. Then send this sentence, with `<shop>` and `<sample_size>` filled from `chat.shop_label` and the allowlisted size. Do not rewrite it when the language is English:

```text
Hi! We've sent you a Target collaboration invite from <shop>. Please check your invitations and request the <sample_size> sample there. Thank you!
```

If `chat.language` is not English, send only the sentence the owner stored for that language. If they did not store one, stop. If more than one size is allowlisted, stop and ask which size. If either value is still a `<PLACEHOLDER>`, stop.

Cap custom invites at `custom_invites_per_session` (10). Count rows from this session:

```bash
node {baseDir}/scripts/invite-log.mjs --csv <SHOP_LOG> --count --terms-prefix chat;sample_no_invite --since <SESSION_START>
```

At 10, stop. Also `--add` one `affiliate_invites`. On `CAP`, stop. This is not a batch of cold invites.

### Sample request

Approve a sample by hand only when the variation's own name is an allowlisted size. Politely decline any other size, in the configured language, and offer the allowlisted size. Do not add a price, a refund, a contact, or a URL.

Per-product "automated approval based on criteria" can auto-approve a size that is not on the allowlist. Set that control to manual, or to no sample. Do not leave it on.

### Log

Every chat action is one row on this shop's invite log. `terms` starts with `chat;`. An invite row for the same handle stays a duplicate. A chat row does not.

| Action | terms |
| --- | --- |
| Custom invite sent | `chat;sample_no_invite;fixed_all_products;expiry_30;sample_manual` |
| Allowlisted size approved | `chat;sample_approve` |
| Other size declined | `chat;sample_decline` |
| Any other reply that was sent | `chat;reply` |

```bash
node {baseDir}/scripts/invite-log.mjs --csv <SHOP_LOG> --append --handle <HANDLE> --campaign <CAMPAIGN_NAME> --time <YYYY-MM-DDTHH:MM:SS> --terms <TERMS>
```

Use `<CHAT>` as the campaign name when there is no invitation name yet.

## TODO

Content and deadline follow-up is not defined. The owner will set it. Do not invent a deadline, a chase message, or a content checklist.

## Steps

1. Run `affiliate-gate.mjs` for this platform and market before you promise a commission change. A Shopee MY targeted offer still needs a store-wide campaign. Do not invent an invite limit. Voucher rules for this pack were not captured.
2. Read the thread once. For a sample with no invite, use the KOL chat section above. Any other draft is the owner's note, in `chat.language`. Run `check-message-length.mjs`. Pass the draft through `policy-gate.mjs --action submit --text`.
3. The reply stays on the platform. No phone number, no email, no URL, no off-platform deal, no price cut, and no request that the creator cancel an order. A refund points at the platform order flow and does not promise one.
4. Do not promise income. Do not ask for a 5-star or positive review. Do not offer a reward for a rating. A commission change is a proposal in `{baseDir}/modules/affiliate/post-invite.md` until the owner says yes.
5. One reply, then the 20–60 second pause. `--add` one `chat_replies`. On `CAP`, stop. Append the chat row before the next thread.
6. Screenshot `screenshots/qc1-affiliate-chat.png` before Send and `screenshots/qc2-affiliate-chat.png` after the sent bubble is on screen.

## QC

The sent text matches the draft. The gate was `ALLOW`. No second channel was used.

## Stop

The gate blocks the text. The creator asked for an off-platform payment. You would change the commission without a yes.

## Report

Handle label, platform, whether you sent or handed the thread to a person. Do not paste a long private address.

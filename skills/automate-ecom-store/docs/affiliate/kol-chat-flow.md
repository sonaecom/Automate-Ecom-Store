# KOL chat flow after invite (generic, all shops, all platforms)

Applies to Shopee, TikTok Shop, Lazada affiliate/creator chat. No shop-specific values: everything comes from the shop file copied from `{baseDir}/config/shops/shop.example.yaml` to `~/.automate-ecom-store/config/shops/<shop>.yaml` (`shop_name`, `language`, `commission`, `sample_allowlist`, `templates`, `faq`, `followups`).

This file supersedes the earlier KOL chat after invite note.

## 1. Hard rules (policy gate, checked before every message)

- Platform chat only. Never move the creator to WhatsApp/Zalo/FB/email.
- Never send phone, email, social handles, URLs, QR codes or addresses.
- Never promise refunds, cash, off-platform payment, price cuts or guaranteed earnings.
- Never ask for positive reviews or ratings, or reward them.
- No unsolicited marketing blasts: message only creators who were invited or who messaged first.
- Polite, short, one message per turn, at human typing speed (random, uneven).
- Refund/order issues: point them to the platform order flow; escalate to staff.

Before Send:

```bash
node {baseDir}/scripts/kol-chat.mjs --check --platform <PLATFORM> --market <MARKET> --text "<DRAFT>"
```

`BLOCKED` means do not send. The check is the policy gate plus a forbidden-content match for a phone, a URL, an email, or a handle.

## 2. Intake: dedupe + priority

Every inbound creator message or follow-up becomes one task in the shared task queue.

- Dedupe: one open thread per creator per shop. A new message on the same thread updates that task and does not create a new one. The same template is never sent twice within 24h, and nothing is sent if our last message is still unanswered (except a scheduled follow-up).
- Check invite log `data/<shop>/invited_kol.csv` and chat log `data/<shop>/kol_chat_log.csv` first.

```bash
node {baseDir}/scripts/invite-log.mjs --csv <INVITED_KOL_CSV> --handle <CREATOR>
node {baseDir}/scripts/kol-chat.mjs --can-send --csv <KOL_CHAT_LOG> --creator <CREATOR> --template <TEMPLATE_ID> --now <YYYY-MM-DDTHH:MM:SS>
```

A follow-up adds `--follow-up`. `SKIP_TEMPLATE` and `HOLD_UNANSWERED` mean do not send.

- Priority (owner can override/pin in `tasks.yaml`):
  - P0: creator reports a problem (sample not received, wrong item, commission dispute), or a platform deadline (sample request expiring, invite expiring <48h). Actions `kol_problem`, `kol_deadline`.
  - P1: creator accepted the invite or requested a sample: answer and approve or decline. Action `kol_sample`.
  - P2: creator asks questions (commission, products, content brief). Action `kol_question`.
  - P3: creator without an invite asks to collaborate. Action `kol_collaborate`.
  - P4: scheduled follow-ups (no reply, content reminder). Action `kol_followup`.
  - Within a level: owner-pinned first, then higher creator score (from audit), then oldest.
- Session cap per config (default 30 messages, 10 custom invites); the rest roll to the next session.

## 3. Conversation flow (templates in config, placeholders only)

1. **Invite sent:** no message, or one short intro if the platform allows. Template id `intro`: "Hi <creator>! We just sent you a collaboration invite from <shop_name>: <commission>% on all products, free <sample_size> sample. Happy to work long-term!"
2. **Creator accepts / asks for sample:** approve only sizes in `sample_allowlist`. Other sizes use template id `sample_other_size`: "Thanks for your interest! For samples we offer the <sample_size> pack. Could you request that one?"
3. **Creator asks without invite:** create a custom target invite from the standard template, then template id `no_invite`: "Hi! We've sent you a collaboration invite from <shop_name>. Please check your invitations and request the <sample_size> sample there. Thank you!"
4. **Questions:** answer from the FAQ in config (commission, product facts, shipping time, content brief). If not in the FAQ, say the `faq_miss` line, "Let me check and get back to you", and escalate to staff (P2).
5. **Problems:** acknowledge, collect order/sample ID, escalate to staff, no promises.
6. **Follow-ups:** owner-defined in config (`followups:` timing and text). Default is OFF until the owner sets them. Never invent deadlines.
7. **Decline / no interest:** thank them, mark as `closed`, and don't contact again for 90 days. Send `templates.decline_thanks` only when the owner has set that sentence.

Fill placeholders from the shop file only. If a value is still a `<PLACEHOLDER>`, stop. If more than one allowlisted size is needed and the file does not say which, stop and ask.

Language comes from the shop file. Empty language uses English for PH and MY, and Bahasa for ID only when the owner has stored the Bahasa sentences. Do not invent a translation.

## 4. Logging and QC

Every sent or received message goes to `kol_chat_log.csv`.

```text
time,creator,thread,template_id,priority,result
```

`time` is `YYYY-MM-DDTHH:MM:SS`. `result` is `sent`, `received`, `approved`, `declined`, `escalated`, or `closed`.

```bash
node {baseDir}/scripts/kol-chat.mjs --log --csv <KOL_CHAT_LOG> --time <TIME> --creator <CREATOR> --thread <THREAD> --template <TEMPLATE_ID> --priority <P0-P4> --result <RESULT>
```

Before sending: the policy gate and the forbidden-content check above.

End-of-session summary to the owner: replied, approved, declined, escalated, pending. Count those `result` values in the log for this session. Do not add a result the log does not have.

## 5. Notes

- Turn off "automated approval by criteria" for non-allowlisted sample sizes. Set it to manual or to no sample.
- One tab, the shop's own browser profile, popups to Cancel.
- Language from config (default English for PH/MY, Bahasa for ID).

# Lazada affiliate invite

Policy preflight: read `{baseDir}/policies/LAYER.md` and run `policy-gate.mjs` for this platform and market before any action in this file.

Dry run follows `{baseDir}/modules/ops/dry-run.md`: walk the steps, take the screenshots, write the report, and do not click Save, Submit, or Send.

Classification: **write**. Use `affiliate-plan.mjs` with the approved shortlist. Manifest `affiliate.invite`. Lazada coverage in the policy files is still incomplete, so do not invent a missing rule. If a menu label does not match, stop and ask. Do not keep opening other menus.

Bản mẫu, cần người phụ trách chỉnh lại. Lần đầu có người xem: nhãn không khớp thì dừng, chụp màn hình, và hỏi.

## When to use

The person wants Lazada affiliates invited from the official affiliate screen. Refine the labels before regular use.

## Prerequisites

1. Read `{baseDir}/account-safety.md` and finish session start before any seller click. `{baseDir}` is the skill folder.
2. Read `{baseDir}/session-runner.md`. Pace, caps, the captcha log, dedupe, and message length go through those scripts.
3. Use the saved store whose `platform` is `lazada`. `headless` in `~/.automate-ecom-store/config.yaml` must be false. Do not print the profile id.
4. The gate result is `READY`, captcha review is not `REVIEW`, and one visible tab is on seller home.
5. Read `{baseDir}/modules/affiliate/invite-lessons.md` and this shop's block in `~/.automate-ecom-store/invite.yaml` before the first click.

## Steps

1. Finish account-safety session start for this Lazada profile only. Do not hunt other windows. Hint for the invite screen: Lazada Affiliate. If that area is not on screen, stop and screenshot. Do not tour the rest of Lazada. A browser prompt to open `xdg-open` or an app is Cancel, never Allow. Run the affiliate gate. Lazada PH, MY, and ID coverage is incomplete. The captured note is commission after delivery, marked from pages that were not fully read. Voucher rules and an official invite limit were not captured. Do not invent them. On `BLOCK`, do not invite.

```bash
node {baseDir}/scripts/affiliate-gate.mjs --platform lazada --market <MARKET>
```
2. First supervised run: stop on the invite screen, save `screenshots/template-invite-screen.png`, and ask the person to confirm this is the creator or affiliate invite form. Do not type and do not send on that first visit.
3. After the person confirms the screen in this chat, continue in the same tab. Fill top to bottom only the fields that are actually on the form: name, start, end, commission or reward, products, sample, creators, message. Skip a field the form does not have. Do not invent a Shopee-only control.
4. Start time must be in the future. Commission fields: select all, then type, then read the value back. If the field appended digits, select all and type once more. If it still mismatches, stop.
5. If a sample control exists, choose only a variation whose SKU and size are on this shop's allowlist. Never trust the product title. Manual approval only. Do not turn on auto-approve. If the exact size is missing, stop. If no sample control exists, do not add a sample. Ask if the person expected one. Commission is the one fixed percent on every product. Expiry is `expiry_days` (default 30). A contact field comes from `contact`. Do not open an old invitation, including one hidden under a status filter.
6. Audit creators with `{baseDir}/modules/affiliate/creator-audit.md` before any select. Check this shop's invite log with `invite-log.mjs` before the run and again before the batch. One invitation holds about 10 approved creators (`PASS` and `proposed` `yes`), not one creator each. Long pause between invitations. Do not invite `EXCLUDE`, `HOLD`, or a log `SKIP`. If the approved list ends early, do not submit.
7. Length-check the message (default 200, or the lower on-screen limit). It must be the private `<INVITE_MESSAGE>`. Do not rewrite it.
8. QC before submit: screenshot `screenshots/qc1-invite.png`. Read every filled field from the screen. `--add` the invite count. On `CAP`, do not submit.
9. Submit once. Ignore any payment or program-join dialog (close it and stop). QC on the saved detail page: screenshot `screenshots/qc2-invite.png`. Visible fields must match QC #1.
10. After QC #2, append this shop's log with `invite-log.mjs --append` (`handle,campaign_name,invited_time,terms`). Each new handle must then be `SKIP`. Then follow account-safety session end.

**Done when:** the saved invite matches both checks, or you stopped on the first visit for label confirmation.

## QC

- First unsupervised labels are not assumed. A confirmed screen is required before typing.
- Handles already in the CSV were not invited again.
- Both screenshots match on commission, count, and message length.

## Stop conditions

- The invite screen was not confirmed on a supervised run.
- The exact sample variation is missing, or the message is over the limit.
- The affiliate cap, the list, or either QC blocks submit.
- Any payment or program-join control.

## Report

Whether this was a label-confirmation stop or a completed invite. If completed: campaign id, invite count, commission, message length, cap used, duration, captcha count, both QC results, and screenshot paths. Handles belong in the chat report and the private CSV only. Omit profile id, API address, port, and key.

# Shopee customer chat reply

Policy preflight: read `{baseDir}/policies/LAYER.md` and run `policy-gate.mjs` for this platform and market before any action in this file.

Dry run follows `{baseDir}/modules/ops/dry-run.md`: walk the steps, take the screenshots, write the report, and do not click Save, Submit, or Send.

> Skeleton. `shopee-affiliate-invite` is the proven Shopee path. This file is the safe order of work. On a supervised run, if an on-screen label does not match the hint below, stop and ask. Do not wander through other menus.

Khung an toàn cho Shopee. Lần chạy có người xem: nhãn menu không khớp thì dừng và hỏi.

## When to use

The person wants polite replies sent in Shopee chat from text they already approved.

## Prerequisites

1. Read `{baseDir}/account-safety.md` and finish session start before any seller click. `{baseDir}` is the skill folder.
2. Read `{baseDir}/session-runner.md`. Pace, caps, the captcha log, dedupe, and message length go through those scripts.
3. Use the saved store whose `platform` is `shopee`. `headless` in `~/.automate-ecom-store/config.yaml` must be false. Do not print the profile id.
4. The gate result is `READY`, captcha review is not `REVIEW`, and one visible tab is on seller home.

## Steps

1. Finish account-safety session start. Hint for inbox: Shopee Chat. Reply only in the official inbox, in the same tab.
2. Use the reply text the person approved for this run. If it still contains a `<PLACEHOLDER>` token, stop. Run `check-message-length.mjs`. If the screen shows a limit below 200, pass that lower `--max`. Never pass a higher max. On anything except `result: OK`, do not send.
3. Open only threads the person listed. If the list is "unanswered threads on the first screen", take that screen in order and stop at the `chat_replies` cap (default 10 session and 10 daily). Do not search the whole history.
4. Read the buyer message before you reply. If it asks for a refund, a partial refund, money back, an off-platform payment, or a contact channel outside the shop, do not answer that request. Stop and ask. No refund promise. No deal outside the platform. No personal email or phone number.
5. Send the approved text only, unchanged, polite, and no longer than the check allows. `--add 1` on `chat_replies` before each send. On `CAP`, stop.
6. Wait with `delay-range.mjs --kind page-load` after each reply. Check duration before the next thread.
7. QC before send: the text in the box matches the approved text, and the thread is one the person allowed. Screenshot `screenshots/qc1-chat.png` for the first reply and whenever the text changes.
8. After send, QC on the thread: screenshot `screenshots/qc2-chat.png`. The sent bubble must match the approved text. If the platform shows a failure, do not retry in a loop. One retry after the normal wait is allowed, then stop.
9. Follow account-safety session end. Idle on seller home.

**Done when:** each sent reply matches the approved text, or you stopped on a refund or off-platform request.

## QC

- Every sent bubble matches the approved text.
- No reply promised a refund or moved the buyer off the platform.
- Reply count stays within the chat cap.

## Stop conditions

- The buyer asks for a refund or an off-platform deal.
- The approved text fails the length check or still has a placeholder.
- The chat cap is reached, or a send fails twice.

## Report

How many replies were sent, how many threads were skipped and why, cap used, duration, captcha count, and screenshot paths. Do not paste buyer personal data into git. Omit profile id, API address, port, and key.

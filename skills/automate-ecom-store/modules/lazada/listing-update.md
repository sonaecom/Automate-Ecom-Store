# Lazada listing update

> Template to refine. The menu hints below are not a proven click-path. On the first supervised run, if a label does not match, stop, screenshot, and ask. Do not keep opening other menus.

Bản mẫu, cần người phụ trách chỉnh lại. Lần đầu có người xem: nhãn không khớp thì dừng, chụp màn hình, và hỏi.

## When to use

The person has a private change list for existing Lazada listings. Confirm the product menu on a supervised run.

## Prerequisites

1. Read `{baseDir}/account-safety.md` and finish session start before any seller click. `{baseDir}` is the skill folder.
2. Read `{baseDir}/session-runner.md`. Pace, caps, the captcha log, dedupe, and message length go through those scripts.
3. Use the saved store whose `platform` is `lazada`. `headless` in `~/.automate-ecom-store/config.yaml` must be false. Do not print the profile id.
4. The gate result is `READY`, captcha review is not `REVIEW`, and one visible tab is on seller home.

## Steps

1. Finish account-safety session start. Hint for the edit screen: Lazada Products, using bulk edit when it is on screen. Prefer the official bulk or mass-edit tool over opening one product page per item.
2. Read the private change file under `data/` (gitignored). Columns: `item_label`, `field`, `new_value`. Reject rows that still contain a `<PLACEHOLDER>` token.
3. Dedupe with `dedupe-csv.mjs --column item_label` against `data/listing-edits.csv`. Skip `SKIP` rows.
4. Check duration. Edit only `NEW` rows, and never more than the remaining `listing_edits` cap (default 10 session and 10 daily). `--add` that many before save. On `CAP`, do not save.
5. For each row, find one matching item. If zero or several match, stop on that row. If `field` is a variation, match the variation row's own name, never the product title. A nearby size is not a match.
6. If `new_value` lowers a price, follow the account-safety approval rule before typing. Never delete a listing, variation, or image.
7. Wait 20–60 seconds after each item edit (pace multiplier included). Use the 3–8 second wait for other actions, and the 2–5 minute pause every 10–15 actions.
8. QC before save: screenshot `screenshots/qc1-listing.png`. Read the preview. The count and the new values must match the change file.
9. Save once in the same tab. QC on the saved result: screenshot `screenshots/qc2-listing.png`. Cross-check the saved values against QC #1. On a mismatch, stop. Do not save a second time.
10. Append saved rows to `data/listing-edits.csv` with columns `item_label,field,new_value,edited_date,source`. Then follow account-safety session end and idle on seller home.

**Done when:** QC #2 matches, or you stopped without an extra save.

## QC

- Before save and on the saved page, the changed fields match the private change file.
- Variation edits match the variation's own name.
- The caps count equals the number of listings saved in this session.

## Stop conditions

- Account-safety says stop (captcha, time, gap, headless, new tab, approval, third reload).
- The item or the variation name is ambiguous or missing.
- A delete, or a price cut without the required yes.
- QC #1 and QC #2 disagree.

## Report

Platform, skill name, how many listings changed, which fields, duration, captcha count, cap used, both screenshot paths, and both QC results. Item labels may appear in the chat report. Do not commit them. Omit profile id, API address, port, and key.

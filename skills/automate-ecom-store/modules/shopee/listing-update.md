# Shopee listing update

Policy preflight: read `{baseDir}/policies/LAYER.md` and run `policy-gate.mjs` for this platform and market before any action in this file.

Dry run follows `{baseDir}/modules/ops/dry-run.md`: walk the steps, take the screenshots, write the report, and do not click Save, Submit, or Send.

Classification: **write**. Saving a listing changes the store. `read_only` does not open this module. Price changes and deletions stay proposals. The click path is still supervised: if an on-screen label does not match the hint below, stop and ask. Do not wander through other menus.

Config shape: `{baseDir}/modules/shopee/listing-update.config.example.yaml`. Copy the private change list to `~/.automate-ecom-store/data/listing-changes.csv`. The sample `{baseDir}/templates/sample-listing-changes.csv` is synthetic. Replace every token before a real run. `session_limit` is the `listing_edits` ceiling from config, not a quota to fill.

Khung an toàn cho Shopee. Lần chạy có người xem: nhãn menu không khớp thì dừng và hỏi.

## When to use

The person has a private change list for existing Shopee listings. A new product or a full gallery rebuild uses `product-listing.md`. Not for deletions or ads.

## Prerequisites

1. Read `{baseDir}/account-safety.md` and finish session start before any seller click. `{baseDir}` is the skill folder.
2. Read `{baseDir}/session-runner.md`. Pace, caps, the captcha log, dedupe, and message length go through those scripts.
3. Use the saved store whose `platform` is `shopee`. `headless` in `~/.automate-ecom-store/config.yaml` must be false. Do not print the profile id.
4. The gate result is `READY`, captcha review is not `REVIEW`, and one visible tab is on seller home.

## Steps

1. Finish account-safety session start. Hint for the edit screen: Shopee Products or My Products, using mass edit when it is on screen. Prefer the official bulk or mass-edit tool over opening one product page per item.
2. Plan the change list before any seller click. Continue only on `result: PLAN`. `READ_ONLY`, `REJECT`, `POLICY`, and `SKIP` mean do not edit.

```bash
node {baseDir}/scripts/listing-edit.mjs --changes ~/.automate-ecom-store/data/listing-changes.csv --log ~/.automate-ecom-store/data/listing-edits.csv --out-dir ~/.automate-ecom-store/data/listing/ --store <STORE_LABEL> --day <YYYY-MM-DD> --mode full --policy ALLOW --journal ~/.automate-ecom-store/data/journal/<STORE_LABEL>.jsonl --session-limit <LISTING_EDITS_CAP>
```

The hourly ceiling is 40 listing edits. `--session-limit` is the work in front of you, not a reason to edit 40. `--hourly-done` is how many already saved this hour. `--target` is the owner's number when they typed one. Omit it when they did not. Pass `--price-approved yes` only after the owner says yes to that price change. Also pass `--price-drop-percent` from `price_drop_approval_percent` when that value is a real number. Omit it while it is still a placeholder. A cut at or above that percent stays `HOLD_PRICE`. `HOLD_DELETE` is never typed. `OVER_CAP` waits. The ceiling is not a target: `apply_count` may be lower than `--session-limit`.

3. Read `listing-plan.csv`. Edit only `APPLY` rows. Skip `SKIP`. Do not type `HOLD_PRICE` or `HOLD_DELETE`.
4. Check duration. `--add` the `apply_count` on `listing_edits` before save. On `CAP`, do not save. Do not add more than `apply_count`.
5. For each row, find one matching item. If zero or several match, stop on that row. If `field` is a variation, match the variation row's own name, never the product title. A nearby size is not a match.
6. If `new_value` lowers a price, follow the account-safety approval rule before typing. Never delete a listing, variation, or image.
7. Wait with `delay-range.mjs --kind page-load` after each item edit (pace multiplier included). Use `--kind click` for other actions, and `--kind batch-rest` every 10–15 actions.
8. QC before save: screenshot `screenshots/qc1-listing.png`. Read the preview. The count and the new values must match the change file.
9. Save once in the same tab. QC on the saved result: screenshot `screenshots/qc2-listing.png`. Cross-check the saved values against QC #1. On a mismatch, stop. Do not save a second time.
10. Append saved rows to `data/listing-edits.csv` with columns `item_label,field,new_value,edited_date,source`. Then close the journal. Do this only after QC #2 matches. Then follow account-safety session end and idle on seller home.

```bash
node {baseDir}/scripts/listing-edit.mjs --done --store <STORE_LABEL> --day <YYYY-MM-DD> --journal ~/.automate-ecom-store/data/journal/<STORE_LABEL>.jsonl
```

**Done when:** `result: PLAN` listed only the rows you saved, QC #2 matches those rows, `--done` prints `result: DONE`, or you stopped without an extra save. A passing real run saves each `APPLY` row once, leaves every `HOLD_PRICE` and `HOLD_DELETE` untyped, and does not fill the cap with extra listings.

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

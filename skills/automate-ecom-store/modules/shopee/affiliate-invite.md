# Shopee Affiliate Targeted Campaign invite

Create one Targeted Campaign in the shop's own Shopee Seller Centre, offer a free sample on one exact variation, and invite the next new affiliates who are not already in the private invited list.

This path was checked on a real supervised run. Follow it in order.

## When to use

The person asks to invite affiliates (KOLs) to a Shopee Targeted Campaign with a free sample and a short message. Do not use this skill for Open Campaign, ads, vouchers, or chat.

## Prerequisites

1. Read and follow `{baseDir}/account-safety.md` through session start. `{baseDir}` is the skill folder that contains `account-safety.md`.
2. Read `{baseDir}/session-runner.md` and use its scripts for pace, caps, captcha log, dedupe, and message length.
3. Read `~/.automate-ecom-store/config.yaml` and, for campaign fields, the task section saved there (see `{baseDir}/modules/shopee/affiliate-invite.config.example.yaml`). The saved store you open must have `platform: shopee`. `headless` must be false.
4. Session gate is `READY`, captcha review is not `REVIEW`, and one visible tab is on Seller Centre home.

If account-safety is missing, stop. Do not open a browser on your own.

## Steps

Helpers, from this skill:

```bash
node {baseDir}/scripts/check-message-length.mjs --file <MESSAGE_FILE>
node {baseDir}/scripts/dedupe-csv.mjs --csv <INVITED_CSV> --list
node {baseDir}/scripts/dedupe-csv.mjs --csv <INVITED_CSV> --handle <HANDLE>
node {baseDir}/scripts/caps-counter.mjs --state <SESSION_STATE> --check-duration --max-minutes <SESSION_MINUTES_MAX>
```

Write the message into a file under `data/` before the length check. Continue only on `result: OK`. Do not pass `--max` above 200. The on-screen counter wins if it is stricter.

### 1. Preflight the campaign

Đọc config chiến dịch, kiểm tra câu nhắn và CSV. Phiên AdsPower đã được account-safety mở.

1. Reject leftover placeholders in either config file.
2. Length-check `campaign.message`. It must ask for a reply and a free-sample request, and it must mention a long-term partnership with a new shop.
3. `dedupe-csv.mjs --list` on `paths.invited_csv`. Remember the existing set.
4. Read remaining invite room from caps: session limit and daily limit minus counts already used. `kol_count` must be a positive integer no higher than that room and no higher than the session cap (default 30). If it is higher, stop and ask. Do not raise the cap.
5. Check duration. On `TIME_UP`, end the session without opening the form.

**Done when:** the message is `OK`, the invited set is loaded, and `kol_count` fits the remaining cap.

### 2. Open the create form

In the same tab: Seller Centre home, then Marketing Centre, then Affiliate Marketing Solution, then Targeted Campaign, then Create.

| English | You may see |
| --- | --- |
| Seller Centre | Kênh Người bán |
| Marketing Centre | Trung tâm Marketing |
| Affiliate Marketing Solution | Giải pháp Tiếp thị liên kết |
| Targeted Campaign | Target Campaign / Chiến dịch mục tiêu |
| Create | Create New Campaign / Tạo |

Use the label on screen. Do not open Open Campaign, Quick Create, a paid program, or Affiliate Marketplace as a substitute. If a label is missing, snapshot and ask.

**Done when:** the Targeted Campaign create form is the only tab.

### 3. Fill top to bottom

Điền đúng thứ tự. Không nhảy cóc.

Order: **name, start time, end time, commission, products, free sample, affiliates, message.** If commission appears only after a product is chosen, choose the product, set commission, verify it, then continue. Do not set samples or affiliates before the visible commission matches.

Between actions, run the 3–8 second pacer (with the session multiplier). Between groups of affiliates, take the 2–5 minute pause. A group is `affiliate_batch_size` (default 10).

1. **Name.** Type `campaign.name`.
2. **Start.** It must be in the future against the Seller Centre clock, or the computer clock if the page has none. If the configured start has passed, move it forward 5 minutes and move the end by the same amount. Report both times. If the page rejects the end, stop.
3. **End.** After the start. Change it only by the rule above.
4. **Commission.** Focus the field, select all, then type `commission_percent`. The field appends to the default if you skip select-all, so a default `1` plus typed `10` becomes `110`. Read the visible value. It must equal the configured percent. One retry of select-all and type is allowed. If it still mismatches, stop. Do this for every visible rate field.
5. **Products.** Add each configured product. Use `label` only to recognize the row. If you cannot tell which row it is, stop. Do not invent an id.
6. **Free sample.** For each product:
   - Open the variation list before you trust the title and before you type a quantity.
   - Read each variation's own name. Ignore the product title.
   - Select only the row whose name is exactly `sample_variation_name`.
   - If that exact name is not in the list, stop. Do not pick a nearby size. A title that contains the same size text is not a match.
   - Set quantity to `sample_quantity` on that variation only. If the page maximum is lower, enter the maximum and report the configured quantity, the maximum, and the number you entered.
   - Leave every other variation without a sample and without a quantity.
7. **Affiliates.** Refresh dedupe if this step took a long time. Open the picker in this tab or in a drawer on this page. Walk the list from top to bottom. Do not search, sort, or jump. The handle is the username, not the display name. Skip empty handles and `SKIP` handles. Select only `NEW` handles, in list order, in batches of `affiliate_batch_size`, with the long pause between batches. Stop at `kol_count`. If the list ends first, do not submit. Tell the person the count and wait. Check duration before each batch.
8. **Message.** Length-check again. Type the config message only. Match the on-screen counter to 200 or less.

**Done when:** the form is complete, the selected count equals `kol_count`, and you have not submitted.

### 4. QC before submit

Screenshot `screenshots/qc1-before-submit.png`. Scroll in the same page for `qc1-products.png`, `qc1-sample.png`, `qc1-affiliates.png`, and `qc1-message.png` if the form is long.

Read the screen. Confirm commission, products, the exact variation name, quantity, affiliate count, message text, message length, and a still-future start. Keystrokes are not proof. On a miss, fix only with the rules above, or stop.

Before submit, reserve the cap:

```bash
node {baseDir}/scripts/caps-counter.mjs --state <SESSION_STATE> --action affiliate_invites --add <KOL_COUNT> --session-limit <SESSION_LIMIT> --daily-limit <DAILY_LIMIT>
```

On `CAP`, do not submit.

**Done when:** QC matches and the cap add returned `OK`.

### 5. Submit

Click create once. Confirm only a dialog that is plainly "create this campaign". If it mentions payment, fee, wallet, top-up, or joining a program, do not confirm. Close it, screenshot, ask, stop.

Wait for the saved detail page in the same tab. Do not click Create again.

**Done when:** the detail page is open, or you stopped on a non-create dialog.

### 6. QC on the saved page

Screenshot `screenshots/qc2-detail.png`. Read the campaign id from the page. Do not invent one. Match name, status, schedule, commission, products, variation names, quantity, and affiliate count to QC #1. If the message is hidden, say so. Everything visible must match. On a mismatch, do not edit in a hurry and do not create a second campaign. Stop. Do not append the CSV.

**Done when:** the detail page matches, or you stopped without appending.

### 7. Append the CSV

Append one row per affiliate this submit actually invited.

```text
handle,name,campaign_id,commission,invited_date,source
```

`invited_date` is `YYYY-MM-DD` from the Seller Centre clock, else the computer's local date. `source` is `targeted-campaign`. Quote a field that contains a comma, quote, or line break, and double quotes inside it. If unsure, stop.

Run dedupe again. Each new handle must be `SKIP`. If any is `NEW`, the append missed. Fix the file. Do not create another campaign.

**Done when:** every invited handle from this run is `SKIP`.

### 8. Session end

Follow account-safety session end. Idle on Seller Centre home in the same tab.

## QC

QC #1 and QC #2 above are both required. Also confirm the caps count increased by `kol_count` only after a successful submit.

## Stop conditions

- Account-safety says stop (captcha, time, gap, headless, new tab, approval, third reload).
- The exact variation name is not on the product.
- Fewer than `kol_count` new affiliates are in the list.
- Either QC fails.
- A control would take payment or join a program.

Do not finish a failed run by creating a second campaign.

## Report

Send it in chat. You may also save `data/last-report.md` (gitignored). Include campaign id, name, status, commission, sample variation name, quantities, affiliates just invited (handle and display name), schedule actually saved, duration, captcha count, pace multiplier, invite cap used, screenshot paths, and both QC results. Omit the API key, API address, port, profile id, and websocket.

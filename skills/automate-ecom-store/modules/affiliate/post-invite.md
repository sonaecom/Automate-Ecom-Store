# After the affiliate invite

Policy preflight: read `{baseDir}/policies/LAYER.md` and run `policy-gate.mjs` for this platform and market before any action in this file.

Dry run follows `{baseDir}/modules/ops/dry-run.md`: walk the steps, take the screenshots, write the report, and do not click Save, Submit, or Send.

Follow creators you already invited. Sample received, video posted, and GMV per creator. Reminders go through the platform chat only. Do not email a creator. Do not promise a refund or an off-platform deal.

This continues `{baseDir}/modules/shopee/affiliate-invite.md` and the TikTok Shop and Lazada invite modules. It does not send a new invite batch.

## When to use

The owner wants to know who received the sample, who posted, and who produced GMV, and to send a short reminder to those who have not posted.

## Steps

1. Read the invited CSV from the affiliate module. Do not add a handle that is not already in that file.
2. On the affiliate or sample page, read status for each handle: sample shipped, sample received, video posted, GMV. Copy the numbers. Record `read_time` and the column names.
3. Score only from those fields. A posted video and GMV above the owner's private threshold is `keep`. No video after the date they set is `remind`. No threshold in the private note means do not invent one. List them as `review` instead of `remind`.
4. A reminder is one platform chat message from the approved text, inside the `chat_replies` cap, with the 20–60 second pause. No second channel.
5. Write `KOLFacts` for the owner tab `KOL`.

Columns: `handle, store, platform, market, sample_status, video_posted, gmv, currency, score, read_time`.

```text
=QUERY(KOLFacts!A1:J, "select * where A is not null", 1)
```

Handles may be in the chat report. Do not commit them.

## Platform notes

Shopee: Targeted Campaign detail and the sample request list. TikTok Shop: the affiliate or creator collaboration page. Lazada: the affiliate collaboration page. If GMV is not on that page, use the official affiliate export. Do not scrape a public profile from the seller browser.

## QC

The GMV matches the export. The reminder text matches the approved line. The chat cap was not exceeded.

## Stop

The message would leave the platform. The handle is not in the invited file. The person did not approve the reminder text.

## Report

Counts for received, posted, and remind. GMV total with source and read time. No email addresses.

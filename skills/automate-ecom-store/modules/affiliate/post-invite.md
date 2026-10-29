# After the affiliate invite

Policy preflight: read `{baseDir}/policies/LAYER.md` and run `policy-gate.mjs` for this platform and market before any action in this file.

Dry run follows `{baseDir}/modules/ops/dry-run.md`: walk the steps, take the screenshots, write the report, and do not click Save, Submit, or Send.

Follow creators you already invited. Record acceptance, content posted, orders, GMV, and ROI per creator. Feed that result back as a weight proposal. Do not change weights until the owner says yes. Reminders go through the platform chat only. Do not email a creator. Do not promise a refund or an off-platform deal.

This continues `{baseDir}/modules/shopee/affiliate-invite.md` and the TikTok Shop and Lazada invite modules. It does not send a new invite batch.

## When to use

The owner wants to know who received the sample, who posted, and who produced GMV, and to send a short reminder to those who have not posted.

## Steps

1. Read the invited CSV from the affiliate module. Do not add a handle that is not already in that file.
2. On the affiliate or sample page, read status for each handle: sample shipped, sample received, video posted, GMV. Copy the numbers. Record `read_time` and the column names.
3. Label only from those fields. A posted video and GMV above the owner's private threshold is `keep`. No video after the date they set is `remind`. No threshold in the private note means do not invent one. List them as `review` instead of `remind`. The numeric score and ROI are step 5.
4. A reminder is one platform chat message from the approved text, inside the `chat_replies` cap, with `delay-range.mjs --kind page-load`. No second channel.
5. Write one results row per invited handle. Copy acceptance, whether content was posted, orders, GMV, sample cost, and commission cost from the seller-centre page or its official export. Leave a cost blank when the page does not show it. Do not invent it.

```text
handle,accepted,content_posted,orders,gmv,sample_cost,commission_cost,currency,read_time,followers,avg_video_views,engagement_rate,last_activity_days,items_sold,category_match,creator_level,past_collab,usual_commission,samples_sent
```

The metric columns are the same figures used at invite time, copied again from the shortlist, so the tuner can compare winners and losers.

```bash
node {baseDir}/scripts/creator-score.mjs --results <RESULTS_CSV> --creators ~/.automate-ecom-store/data/affiliate/creators.csv --config ~/.automate-ecom-store/creator-score.yaml --tune --out-dir ~/.automate-ecom-store/data/affiliate/
```

`creator-results.csv` has ROI. ROI is `(gmv - sample_cost - commission_cost) / (sample_cost + commission_cost)` when the cost is above 0. Otherwise ROI is blank. `weight-proposal.csv` is a proposal. On `NEED_MORE`, there were fewer than two winners or two losers. Do not edit `creator-score.yaml` until the owner accepts the proposal. A winner posted content and has GMV above 0. A loser was accepted, or was sent a sample, and then had no orders or no GMV.

6. Write `KOLFacts` only when `sheets_reports` is yes. Otherwise keep the local CSV and do not connect Google. The owner tab is `KOL`.

Columns: `handle, store, platform, market, accepted, content_posted, orders, gmv, cost, roi, currency, read_time`.

```text
=QUERY(KOLFacts!A1:L, "select * where A is not null", 1)
```

Handles may be in the chat report. Do not commit them.

## Platform notes

Shopee: Targeted Campaign detail and the sample request list. TikTok Shop: the affiliate or creator collaboration page. Lazada: the affiliate collaboration page. If GMV is not on that page, use the official affiliate export. Do not scrape a public profile from the seller browser.

## QC

The GMV matches the export. The reminder text matches the approved line. The chat cap was not exceeded.

## Stop

The message would leave the platform. The handle is not in the invited file. The person did not approve the reminder text.

## Report

Counts for received, posted, and remind. Per creator: accepted, content posted, orders, GMV, cost, and ROI, or say ROI is undefined. GMV total with source and read time. Whether a weight proposal was shown, and whether the owner accepted it. No email addresses.

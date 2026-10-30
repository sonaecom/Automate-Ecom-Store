# Creator audit before an invite

Policy preflight: read `{baseDir}/policies/LAYER.md` and run `policy-gate.mjs` for this platform and market before any action in this file. The action is `read`.

Dry run follows `{baseDir}/modules/ops/dry-run.md`: walk the steps, take the screenshots, write the report, and do not click Save, Submit, or Send.

This step is mandatory before every affiliate or creator invite on Shopee, TikTok Shop, and Lazada. Do not select a creator, and do not submit an invite, until the owner has approved the shortlist from this file.

Read only what the seller-centre card shows. Do not invent a metric. Do not open a public profile in another tab. Do not leave the affiliate picker.

## When to use

The invite module is about to choose creators. Run this first. The later result check is `{baseDir}/modules/affiliate/post-invite.md`.

## Prerequisites

1. Account safety and the session runner. One visible tab. Human pace between creator cards.
2. `{baseDir}/modules/affiliate/creator-score.example.yaml` copied to `~/.automate-ecom-store/creator-score.yaml` when the owner wants different weights. The defaults apply when that file is absent.
3. This shop's invite log from `{baseDir}/modules/affiliate/invite-lessons.md`, so a handle invited in the last 90 days is excluded. Pass that file as `--invited`. `invited_time` counts. Do not rebuild the log by opening old invitations.
4. The shop category and the commission you intend to offer. Pass them if the config still has a placeholder.

## What to copy

From the creator card, and only from that card: GMV tier, items sold, followers, average video views, engagement rate, how recent the last LIVE or video was, category, audience gender, audience age, audience region, creator level, past collaboration with this shop, and the commission rate they usually take. If a past sample is on the same card or in the shop's sample history, also copy samples sent, orders from those samples, and GMV from those samples.

`last_activity_days` is the number of days from the newest LIVE or video date on the card to today. If the card has no date, leave the cell empty. The script treats an empty date as inactive.

Write `yes` or `no` for category match and past collaboration. Empty means the card did not say. A title is not a category.

## Steps

1. Policy gate for this platform and market, action `read`. On `VIOLATION`, stop.
2. Stay in the affiliate picker. Open one creator card, copy the fields, close it, then run the pacer before the next card.

```bash
node {baseDir}/scripts/delay-range.mjs --profile normal --kind click
```

Check the session clock before the next card. On `TIME_UP`, stop. A read is not an invite. Do not add to `affiliate_invites` for a card you only read.

3. Save the rows under `~/.automate-ecom-store/data/affiliate/creators.csv`. Headers:

```text
handle,gmv_tier,gmv,items_sold,followers,avg_video_views,engagement_rate,last_activity_days,category,category_match,audience_gender,audience_age,audience_region,creator_level,past_collab,usual_commission,samples_sent,sample_orders,sample_gmv,read_time
```

4. Score. `--top` is the invite count you would send, still not an invite. It must be inside the remaining `affiliate_invites` cap.

```bash
node {baseDir}/scripts/creator-score.mjs --creators ~/.automate-ecom-store/data/affiliate/creators.csv --invited <INVITED_CSV> --as-of <YYYY-MM-DD> --config ~/.automate-ecom-store/creator-score.yaml --category <CATEGORY> --offered-commission <PERCENT> --top <N> --out-dir ~/.automate-ecom-store/data/affiliate/
```

Omit `--config` when the owner has not saved one. The defaults are min engagement `0.02`, active in the last 30 days, category required, views/followers at least `0.01`, GMV above 0, and no invite of the same handle in 90 days.

5. Read `shortlist.csv`. `PASS` rows are ranked. `proposed` `yes` is the top N of those rows. `EXCLUDE` and `HOLD` are not invited.

| Reason | Meaning |
| --- | --- |
| `inactive` | No LIVE or video date, or the last one is older than the window |
| `off_category` | Category does not match |
| `suspicious_ratio` | Views divided by followers are under the floor |
| `invited_90d` | That handle is already in the invited file inside the cooldown |
| `sample_no_sales` | Samples were sent and orders or sample GMV are 0 |
| `low_engagement` | Engagement is under the minimum |
| `gmv_zero` | GMV is not above the minimum |
| `missing_*` | That field was not on the card. The row is `HOLD` |
| `duplicate` | The handle was already in this file |

6. Show the owner the ranked proposed rows: rank, handle, score, and reasons, plus the exclude and hold counts. Wait for a yes on this shortlist. A yes for a different campaign, or a yes that raises N above the cap, does not approve this list.
7. Invite only handles with `proposed` `yes` that the owner approved. Do not replace a missing handle with an `EXCLUDE` or `HOLD` row. If the approved count is under the campaign count, stop and ask. Do not submit until they accept the smaller count in this chat.

## QC

Every invited handle is `PASS`, `proposed` `yes`, and named in the owner's yes. The score file and the card agree on followers, views, and engagement. No second tab was opened.

## Stop

- The script prints `result: EMPTY`.
- A metric would be guessed.
- The owner has not approved this shortlist.
- The session clock is `TIME_UP`.

## Report

Pass, exclude, and hold counts. For each proposed row: rank, handle, score, reasons. Say that no invite was sent until the owner answered. Screenshot the picker, not a public profile.

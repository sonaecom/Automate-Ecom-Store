# Session scheduler

Dry run follows `{baseDir}/modules/ops/dry-run.md`: walk the steps, take the screenshots, write the report, and do not click Save, Submit, or Send.

Build a plan. Do not start the work until the person says to run the next block.

For each saved store, one block only if `caps-counter.mjs --show --gap-hours` would be `READY` and the policy gate for that market is not blocking the actions in the block.

A block is at most `session_minutes_max` minutes (30–40). Inside it:

- Listing publishes at most the remaining `listing_edits` (default 10).
- Affiliate invites at most the remaining cap, in batches of 10.
- Ads setting changes at most 3, and never a top-up.
- Chat replies at most 10.
- Homepage publish is one, after its own QC.
- Policy update runs once a week, before the first block of the week. It only reads public help pages.

Leave at least `gap_hours_min` hours between blocks for the same store. Do not plan two stores in the same hour. Money actions are not scheduled. They stay proposals.

Write the plan in the chat: time window, store label, platform, modules, and which cap remains. Do not include profile ids.

## Platform notes

The same plan shape for Shopee, TikTok Shop, and Lazada. A store whose policy file is pending can be planned for read-only modules only.

## QC

Every planned count is less than or equal to the cap printed by `caps-counter.mjs`. Dry run prints the plan and does not open Seller Centre.

## Stop

Stop if the plan would exceed a cap or stack two stores together.

## Report

The plan, and which blocks were actually run.

# Review replies

Policy preflight: read `{baseDir}/policies/LAYER.md` and run `policy-gate.mjs` for this platform and market before any action in this file.

Dry run follows `{baseDir}/modules/ops/dry-run.md`: walk the steps, take the screenshots, write the report, and do not click Save, Submit, or Send.

Reply in the official review box. Thank the buyer or offer help with a real problem. Do not ask for a star count, a positive review, or a changed rating. Do not offer a coin, voucher, or refund in exchange for a rating.

Policy gate action is `submit` on the reply text. The one post-delivery chat is `{baseDir}/modules/customers/post-delivery.md`, not this file.

## When to use

A public review is waiting for a seller reply. A buyer problem in chat goes to the platform chat module and then to a person.

## Steps

1. Open the review list once. Copy the review text, the star count the buyer already gave, and the order label. Do not argue with the star count.
2. Draft the reply. If the review describes a fault, apologize and say a person will follow up in the order chat. Do not ask them to edit the review.
3. Run the policy gate on the draft. Any hit for a star ask, a reward, or an off-platform contact is a stop.
4. QC #1: screenshot `screenshots/qc1-review-reply.png` with the draft visible. Send once if dry run is off and the gate is `ALLOW`. QC #2: screenshot `screenshots/qc2-review-reply.png` of the published reply.
5. One reply per review. Pause with `delay-range.mjs --kind page-load`. Stay inside `chat_replies`.

## QC

The published reply matches the draft. It does not mention a star target or a reward.

## Stop

The draft asks for 5 stars, a positive review, or a changed rating. The draft offers a reward. You would hide the review.

## Report

How many replies went out, how many were handed to a person, platform, market. No buyer name in git.

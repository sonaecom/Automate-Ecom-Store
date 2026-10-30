# Customer retention

Policy preflight: read `{baseDir}/policies/LAYER.md` and run `policy-gate.mjs` for this platform and market before any action in this file.

Dry run follows `{baseDir}/modules/ops/dry-run.md`: walk the steps, take the screenshots, write the report, and do not click Save, Submit, or Send.

Use only the platform's own follower and voucher tools. Propose a comeback offer. Do not publish it until the owner says yes for that offer. Do not message buyers outside the platform.

Policy gate for a proposal is `read`. Publishing a voucher is `publish` and needs `ALLOW` plus the owner's yes. Dry run stops before publish.

## When to use

The owner wants buyers who already purchased, or followers, to see an official voucher or a follower coupon.

## Steps

1. Read the official buyer or follower list once. Group only with the filters the page already has, such as bought before or follower. Do not export personal addresses into the chat.
2. Count the segment. The count is the page's count, checked against the export if there is one.
3. Propose one voucher: who it is for, the discount from the owner's private note, the dates, and the product labels. If the note has no discount, ask. Do not invent a percent.
4. Show the proposal. Creating it uses `{baseDir}/modules/shopee/vouchers-promotions.md` or the TikTok Shop or Lazada promotions module, and only after the yes.
5. Do not store buyer names in git. A count and the voucher id from the saved page are enough in the report.

No dashboard tab. The voucher, once live, is visible in the promotions module.

## Platform notes

Shopee: Marketing Centre vouchers and the follower or chat broadcast tools the seller centre shows. TikTok Shop: the official coupon or follower tool. Lazada: the official voucher tool. If the tool is not on screen, stop. Do not use a browser extension or a bought contact list.

## QC

The published voucher matches the proposal: audience, discount, dates, products. Two checks, before save and on the saved voucher.

## Stop

No owner yes. The tool would message outside the platform. The discount is a guess.

## Report

Segment count, proposal or saved voucher, source, read time. No buyer personal data.

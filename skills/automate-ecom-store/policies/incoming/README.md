# Incoming official policy files

A later research pass will bring official Shopee, TikTok Shop, and Lazada policy pages for PH, MY, and ID. Drop them onto the files that are already here. The gate and the weekly checker do not need a code change.

Replace only these paths:

- `policies/shopee/PH.md`
- `policies/shopee/MY.md`
- `policies/shopee/ID.md`
- `policies/tiktokshop/PH.md`
- `policies/tiktokshop/MY.md`
- `policies/tiktokshop/ID.md`
- `policies/lazada/PH.md`
- `policies/lazada/MY.md`
- `policies/lazada/ID.md`

Keep the front matter keys `platform`, `market`, `retrieved`, and `source_url`. Keep the `### rule_id` headings the gate already parses:

`prohibited_restricted`, `listing_titles`, `listing_images`, `keyword_spam`, `misleading_claims`, `pricing_promotion`, `review_rating`, `chat_off_platform`, `affiliate_creator`, `ads`, `shipping_sla`, `penalty_points`, `returns_refunds`, `account_automation`, `data_privacy`, `local_hub`.

Each rule still needs `status`, `verify`, `source`, `retrieved`, `modules`, `match`, and `summary`. Set `verify: no` only for a page that was actually opened. Add new official URLs to `policies/sources.yaml` with the same `id`, `platform`, `market`, `topic`, `url`, and `retrieved` fields.

Do not rename the market code. Do not remove the star-rating or off-platform blocks. A research file does not change a price, a budget, or a listing by itself.

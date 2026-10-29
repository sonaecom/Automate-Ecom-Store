---
platform: shopee
market: MY
retrieved: 2026-10-29
source_url: https://seller.shopee.com.my/edu/home
---

# Shopee MY policy summary

Retrieved 2026-10-29. These are summaries of public seller pages, not a replacement for them. A rule with verify: yes must be opened on the official page before a mutating action. The gate still blocks a star-rating ask and an off-platform contact.

### prohibited_restricted
- status: flag
- verify: yes
- source: https://seller.shopee.com.my/edu/home
- retrieved: 2026-10-29
- modules: product-listing, prelaunch
- match: firearm; narcotic; counterfeit; replica
- summary: Shopee prohibits prohibited, restricted, and counterfeit goods. The full list is on the local seller education or Seller Center page. Do not list an item the page names. This match list is only a few obvious words, not the whole catalogue.

### listing_titles
- status: flag
- verify: yes
- source: https://seller.shopee.com.my/edu/home
- retrieved: 2026-10-29
- modules: product-listing, ab-test
- match: 
- summary: Titles must describe the product the buyer receives. Do not stuff keywords, competitor names, or claims the spec does not allow. The in-app counter wins over any draft length.

### listing_images
- status: flag
- verify: yes
- source: https://seller.shopee.com.my/edu/home
- retrieved: 2026-10-29
- modules: product-listing, ab-test
- match: before and after; 100% cure; whatsapp; zalo
- summary: Images must show the real product. Do not put a phone number, a chat app, a price that contradicts the listing, or a medical before-and-after on the picture. Exact crop and text limits differ by market. Re-read the local page before publish.

### keyword_spam
- status: flag
- verify: yes
- source: https://seller.shopee.com.my/edu/home
- retrieved: 2026-10-29
- modules: product-listing
- match: 
- summary: Do not repeat keywords, hide text, or add unrelated brands to win search. If the form warns about spam, stop and shorten the title.

### misleading_claims
- status: block
- verify: yes
- source: https://seller.shopee.com.my/edu/home
- retrieved: 2026-10-29
- modules: product-listing, reviews-trust
- match: cures cancer; guaranteed cure; 100% effective
- summary: Do not claim a cure, a guaranteed result, or an official approval that is not in the spec and on the official page. verify is yes because the banned-claim list is market specific. The three phrases above are blocked anyway.

### pricing_promotion
- status: flag
- verify: yes
- source: https://seller.shopee.com.my/edu/home
- retrieved: 2026-10-29
- modules: vouchers-promotions, ab-test, ads-kickstart
- match: 
- summary: A price, a voucher, or a discount needs the owner's yes and the policy gate action price or publish. Do not show a crossed-out price the product never used. Do not invent a percent.

### review_rating
- status: block
- verify: yes
- source: https://seller.shopee.com.my/edu/home
- retrieved: 2026-10-29
- modules: post-delivery, reviews-trust, customer-chat
- match: 5 stars; five stars; 5 sao; năm sao; bintang 5; 5 bintang; ห้าดาว; 5 ดาว
- summary: Do not ask for a star count, do not pay for a rating, and do not ask only happy buyers. One honest thank-you after delivery is allowed in the post-delivery module. A platform review reward, if the screen has one, must apply to any qualifying review.

### chat_off_platform
- status: block
- verify: yes
- source: https://seller.shopee.com.my/edu/home
- retrieved: 2026-10-29
- modules: post-delivery, customer-chat, affiliate-invite
- match: whatsapp; wa.me; telegram; t.me/; zalo; wechat; line.me
- summary: Keep buyer and creator messages inside the platform chat. Do not send a phone number, a personal chat app, or a link that takes the conversation off the platform.

### affiliate_creator
- status: flag
- verify: yes
- source: https://seller.shopee.com.my/edu/home
- retrieved: 2026-10-29
- modules: affiliate-invite, creator-outreach
- match: 
- summary: Invite creators only with the platform's own affiliate or creator tool. Do not promise income. Do not ask a creator to post a false review. Commission changes are proposals.

### ads
- status: flag
- verify: yes
- source: https://seller.shopee.com.my/edu/home
- retrieved: 2026-10-29
- modules: ads-kickstart, ads
- match: 
- summary: Ad claims must match the listing. A budget increase needs the owner's yes for that amount. Do not top up from this skill. A prohibited product must not be advertised.

### shipping_sla
- status: flag
- verify: yes
- source: https://seller.shopee.com.my/edu/home
- retrieved: 2026-10-29
- modules: prelaunch, daily-report
- match: 
- summary: Ship by the SLA shown in Seller Center for this market. The number of days is not copied here because it changes by channel and programme. Read the on-screen SLA before promising a date. verify: yes.

### penalty_points
- status: flag
- verify: yes
- source: https://seller.shopee.com.my/edu/home
- retrieved: 2026-10-29
- modules: account-security, alerts
- match: 
- summary: Penalty or non-compliance points are read from Account Health. Do not guess the threshold. A rise in points is an owner alert, not a licence to change settings. Lazada SG's help page describes point milestones. Other markets must be re-read.

### returns_refunds
- status: flag
- verify: yes
- source: https://seller.shopee.com.my/edu/home
- retrieved: 2026-10-29
- modules: disputes, settlement, cancel-return
- match: 
- summary: Follow the on-screen return and refund window. Do not refuse a case the page says is the seller's to accept. Filing a dispute is a proposal. Do not invent a deadline.

### account_automation
- status: block
- verify: yes
- source: https://seller.shopee.com.my/edu/home
- retrieved: 2026-10-29
- modules: account-safety, session-runner
- match: new-fingerprint; delete-cache
- summary: One profile per store. Do not run a second account to avoid a limit, do not share a login, and do not use an unofficial bot. This skill's visible paced browser is the allowed path. Headless mode and fingerprint changes stay forbidden.

### data_privacy
- status: block
- verify: yes
- source: https://seller.shopee.com.my/edu/home
- retrieved: 2026-10-29
- modules: post-delivery, retention, backup
- match: 
- summary: Do not copy a buyer's address, phone, or full name into git, chat logs, or a sheet. Order ids and store labels are enough. Do not pretend to be the buyer or misstate who wrote a review.

### local_hub
- status: flag
- verify: yes
- source: https://seller.shopee.com.my/edu/home
- retrieved: 2026-10-29
- modules: prelaunch
- match: 
- summary: Local seller education or terms entry for Shopee MY. Re-read it before the first mutating action in this market.

## Update log

The weekly checker appends a row here when the official page hash changes. That row is a flag. It does not change a price, a budget, a listing, or a programme.

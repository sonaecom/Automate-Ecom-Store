---
platform: shopee
market: PH
retrieved: 2026-10-29
source_url: https://seller.shopee.ph/edu/article/2945/calculate-seller-penalty-points-issued
---

# shopee / PH seller policy rules (retrieved 2026-10-29)

## Sources

| URL | Title | Read date | Status |
|---|---|---|---|
| https://seller.shopee.ph/edu/article/2945/calculate-seller-penalty-points-issued | Shopee PH - How are penalty points issued (updated May 21, 2025) | 2026-10-29 | snippet: official URL via search index; page is JS-rendered, direct fetch not possible |
| https://seller.shopee.ph/edu/article/275 | Shopee PH - Overview of Seller Penalty Points System | 2026-10-29 | snippet: official URL via search index; direct fetch/curl returns empty JS shell |
| https://seller.shopee.ph/edu/article/15939/seller-penalty-points-system-faq | Shopee PH - FAQs on Penalty Points system | 2026-10-29 | snippet: official URL via search index |
| https://seller.shopee.ph/edu/article/3135 | Shopee PH - How is LSR calculated | 2026-10-29 | snippet: official URL via search index |
| https://seller.shopee.ph/edu/article/3096 | Shopee PH - What is a misleading discount (updated Aug 5, 2026) | 2026-10-29 | read in full |
| https://seller.shopee.ph/edu/article/6897 | Shopee PH - penalty points system (SG article id) | 2026-10-29 | not read: HTTP 404 |

## Rules

- **[SH-PH-001] (fulfilment, warn)** MUST keep Late Shipment Rate below 10% (7-day window, assessed weekly on Monday) — threshold: LSR ≥ 10% = 2 points; LSR ≥ 10% and late-shipped orders ≥ 30 = 3 points (effective June 3, 2024) — source: https://seller.shopee.ph/edu/article/2945/calculate-seller-penalty-points-issued
- **[SH-PH-002] (fulfilment, warn)** MUST keep Non-Fulfilment Rate (seller cancellations/returns, 7 days) below 10% — threshold: NFR ≥ 10% = 2 points; NFR ≥ 10% and non-fulfilled orders ≥ 30 = 3 points — source: https://seller.shopee.ph/edu/article/2945/calculate-seller-penalty-points-issued
- **[SH-PH-003] (fulfilment, block)** MUST ship non-pre-order items within 2 days (Ship-by Date based on Days to Ship, excl. holidays) — threshold: "For non-pre-order products, you should ship your orders out within 2 days." — source: https://seller.shopee.ph/edu/article/3135
- **[SH-PH-004] (fulfilment, warn)** MUST comply with Shopee Packaging Guidelines — threshold: 2 points per violation (effective February 17, 2025) — source: https://seller.shopee.ph/edu/article/15939/seller-penalty-points-system-faq
- **[SH-PH-005] (fulfilment, warn)** MUST NOT ship wrong/missing items — threshold: 2 points — source: https://seller.shopee.ph/edu/article/15939/seller-penalty-points-system-faq
- **[SH-PH-006] (fraud, block)** MUST NOT send empty parcels — threshold: 3 points (first offence), 6 points (second offence), Account freeze (third offence onwards) — source: https://seller.shopee.ph/edu/article/2945/calculate-seller-penalty-points-issued
- **[SH-PH-007] (fraud, block)** MUST NOT use a fake return address — threshold: 2 points — source: https://seller.shopee.ph/edu/article/2945/calculate-seller-penalty-points-issued
- **[SH-PH-008] (reviews, block)** MUST NOT brush orders (incl. fake orders to inflate sales/reviews) — threshold: Up to 9 points per violation; accumulation of 15 points within 30 days due to Order Brushing will result in account freezing — source: https://seller.shopee.ph/edu/article/2945/calculate-seller-penalty-points-issued
- **[SH-PH-009] (reviews, block)** MUST NOT brush orders, reviews, followers or likes — threshold: Account restrictions; may include account freeze — source: https://seller.shopee.ph/edu/article/2945/calculate-seller-penalty-points-issued
- **[SH-PH-010] (fraud, block)** MUST NOT make false transaction attempts (buying from own shop) — threshold: Up to 2 points — source: https://seller.shopee.ph/edu/article/2945/calculate-seller-penalty-points-issued
- **[SH-PH-011] (automation, block)** MUST NOT crawl or scrape data on Shopee — threshold: Account restrictions — source: https://seller.shopee.ph/edu/article/2945/calculate-seller-penalty-points-issued
- **[SH-PH-012] (automation, block)** MUST NOT generate fake web traffic — threshold: Account restrictions — source: https://seller.shopee.ph/edu/article/2945/calculate-seller-penalty-points-issued
- **[SH-PH-013] (ads, block)** MUST NOT run Unfair Boosting Ads — threshold: Removal of affected sold count/reviews/ratings and/or Account freeze — source: https://seller.shopee.ph/edu/article/275
- **[SH-PH-014] (chat, block)** MUST NOT direct transactions outside of Shopee — threshold: Up to 2 penalty points — source: https://seller.shopee.ph/edu/article/275
- **[SH-PH-015] (chat, block)** MUST NOT ask buyers to cancel orders (Chat to Cancel) — threshold: Up to 2 penalty points — source: https://seller.shopee.ph/edu/article/275
- **[SH-PH-016] (chat, block)** MUST NOT send offensive/rude/abusive chat messages or review replies — threshold: Up to 2 penalty points — source: https://seller.shopee.ph/edu/article/275
- **[SH-PH-017] (chat, block)** MUST NOT send prohibited items or pornographic/obscene content via chat — threshold: Prohibited item: Warning / 2 penalty points / Account freeze; pornographic content: Account freeze — source: https://seller.shopee.ph/edu/article/275
- **[SH-PH-018] (listing, block)** MUST NOT place non-Shopee ads on products — threshold: 2 penalty points — source: https://seller.shopee.ph/edu/article/275
- **[SH-PH-019] (listing, block)** MUST NOT list prohibited items, spam (keyword spam, duplicates) or misleading-pricing listings — threshold: Up to 6 points per violation — source: https://seller.shopee.ph/edu/article/2945/calculate-seller-penalty-points-issued
- **[SH-PH-020] (ip, block)** MUST NOT list IP-infringing or counterfeit items — threshold: Up to 15 points for IP infringement or counterfeit — source: https://seller.shopee.ph/edu/article/2945/calculate-seller-penalty-points-issued
- **[SH-PH-021] (listing, warn)** MUST avoid poor-quality listings that get deleted — threshold: 3 to 4 deleted listings = 1 point; ≥5 deleted listings = 3 points (effective June 2, 2025) — source: https://seller.shopee.ph/edu/article/2945/calculate-seller-penalty-points-issued
- **[SH-PH-022] (livestream, block)** MUST NOT stream in wrong category or with explicit/harassing content on Shopee Live — threshold: Wrong category: up to 15 points per violation; severe content: 3 points + Shopee Live ban; repeat: account freeze — source: https://seller.shopee.ph/edu/article/2945/calculate-seller-penalty-points-issued
- **[SH-PH-023] (pricing, block)** MUST NOT raise price just before a promotion to exaggerate the discount — threshold: "Please allow two (2) weeks lead time for price changes before applying discounts and promotions"; violation may lead to permanent listing deletion (incl. reviews, sold count) and penalties — source: https://seller.shopee.ph/edu/article/3096
- **[SH-PH-024] (scam, block)** MUST NOT engage in scams — threshold: Confirmed Scam = Account ban; Potential Scam = Warning, up to 3 penalty points — source: https://seller.shopee.ph/edu/article/275
- **[SH-PH-025] (penalty, warn)** Penalty points reset on the last Monday of each quarter — threshold: Reset last Monday of March, June, September, December — source: https://seller.shopee.ph/edu/article/15939/seller-penalty-points-system-faq

## Gaps (not researched / not readable)

- Not covered from official pages this pass: affiliate/KOL rules, voucher T&Cs, detailed return/refund SLAs, shop-health metric targets beyond those above, full prohibited-items lists. Add on next re-check.

## Update 2026-10-29: affiliate, vouchers/promotions, returns

### Additional sources

| URL | Title | Read date | Status |
|---|---|---|---|
| https://help.shopee.ph/portal/10/article/174380-Commission-Structure-on-Shopee | Shopee PH Help - Commission Structure on Shopee (affiliate, eff. April 1, 2025) | 2026-10-29 | snippet: official URL via search index |
| https://seller.shopee.ph/edu/article/1137 | Shopee PH - Shopee Returns Window (updated Sep 11, 2024) | 2026-10-29 | snippet: official URL via search index (JS page) |
| https://seller.shopee.ph/edu/article/7808/New-Process-Shopee-New-Return-Refund-Process | Shopee PH - Shopee's Return/Refund Process | 2026-10-29 | snippet: official URL via search index |
| https://seller.shopee.ph/edu/article/7822/return-refund-on-shopee-app | Shopee PH - Processing Return/Refund Requests | 2026-10-29 | snippet: official URL via search index |
| https://seller.shopee.ph/edu/article/3088 | Shopee PH - Filling in voucher details | 2026-10-29 | not read: only title seen in search; no rule text captured |

### affiliate

- **[SH-PH-105] (warn)** CommsXtra seller-set affiliate commission MUST be at least 1% (up to 9% Shopee commission on Live/Video; External 2.5%, cap ₱40) — threshold: "at least 1%"; "no order cap for seller set commission" — source: https://help.shopee.ph/portal/10/article/174380-Commission-Structure-on-Shopee

### vouchers

- No rule captured from an official page this pass (see sources table for 'not read').

### returns

- **[SH-PH-106] (warn)** Buyer return/refund window: Mall 15 days, Non-Mall 7 days from 'Delivered' — threshold: Mall 15 days; Non-Mall 7 days — source: https://seller.shopee.ph/edu/article/1137
- **[SH-PH-107] (block)** MUST respond to Shopee Agent evidence request within 1 day, else case assessed without seller evidence — threshold: within 1 day — source: https://seller.shopee.ph/edu/article/7822/return-refund-on-shopee-app
- **[SH-PH-108] (warn)** Dispute a non-seller-fault R/R resolution within 2 days (incl. Sundays and Holidays) with valid proof; forward+return shipping fees charged to seller on buyer-win — threshold: 2 days — source: https://seller.shopee.ph/edu/article/7808/New-Process-Shopee-New-Return-Refund-Process
- **[SH-PH-109] (warn)** MUST assist buyers with warranty claims outside the Returns Window — source: https://seller.shopee.ph/edu/article/7808/New-Process-Shopee-New-Return-Refund-Process

### chat

- No rule captured from an official page this pass (see sources table for 'not read').

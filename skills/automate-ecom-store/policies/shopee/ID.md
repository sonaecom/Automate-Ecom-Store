---
platform: shopee
market: ID
retrieved: 2026-10-29
source_url: https://seller.shopee.co.id/edu/article/7070
---

# shopee / ID seller policy rules (retrieved 2026-10-29)

## Sources

| URL | Title | Read date | Status |
|---|---|---|---|
| https://seller.shopee.co.id/edu/article/7070 | Shopee ID - Sistem & Ketentuan Poin Penalti | 2026-10-29 | snippet: official URL via search index; direct fetch/curl returns empty JS shell |
| https://seller.shopee.co.id/edu/article/6868 | Shopee ID - Kebijakan Pemenuhan Pesanan | 2026-10-29 | snippet: official URL via search index; direct fetch empty |
| https://seller.shopee.co.id/edu/article/339 | Shopee ID - Bagaimana Tingkat Keterlambatan Pengiriman Dihitung | 2026-10-29 | snippet: official URL via search index |

## Rules

- **[SH-ID-036] (fulfilment, warn)** MUST keep Late Shipment Rate below 10% (ideal < 2%) — threshold: ≥10% = 1 Poin; ≥10% and ≥50 late orders = 2 Poin — source: https://seller.shopee.co.id/edu/article/6868
- **[SH-ID-037] (fulfilment, warn)** MUST keep Non-Fulfilment Rate below 10% — threshold: ≥10% = 1 Poin; ≥10% & ≥30 = 2 Poin; ≥60% & <30 = 3 Poin; ≥60% & ≥30 = 4 Poin — source: https://seller.shopee.co.id/edu/article/7070
- **[SH-ID-038] (listing, block)** MUST NOT upload prohibited products — threshold: 1 Poin/2 Poin + product removed; severe: 3 Poin/6 Poin + account restriction/block — source: https://seller.shopee.co.id/edu/article/7070
- **[SH-ID-039] (listing, block)** MUST NOT use foreign languages other than English in product name/description — threshold: 1 Poin + product removed — source: https://seller.shopee.co.id/edu/article/7070
- **[SH-ID-040] (listing, block)** MUST NOT reuse an old product page for a new product changing model/brand/function/material — threshold: 3 Poin/6 Poin + product removed — source: https://seller.shopee.co.id/edu/article/7070
- **[SH-ID-041] (listing, block)** MUST NOT re-upload blocked products without changes or re-upload deleted products — threshold: 1 Poin + product removed — source: https://seller.shopee.co.id/edu/article/7070
- **[SH-ID-042] (pricing, block)** MUST NOT raise product price before a promotion to give a larger discount — threshold: Listed in penalty table (point value not visible in snippet) — source: https://seller.shopee.co.id/edu/article/7070
- **[SH-ID-043] (listing, block)** MUST NOT promote infant milk/formula products in any form — threshold: 1 Poin/2 Poin + product removed — source: https://seller.shopee.co.id/edu/article/7070
- **[SH-ID-044] (listing, warn)** Pre-order products MUST NOT exceed 20% (assessed only when ≥300 pre-order products) — threshold: Restriction of displayed products — source: https://seller.shopee.co.id/edu/article/7070
- **[SH-ID-045] (vouchers, block)** MUST NOT abuse Free Shipping subsidy or vouchers — threshold: 1 Poin — source: https://seller.shopee.co.id/edu/article/7070
- **[SH-ID-046] (fraud, block)** MUST NOT send empty or significantly different parcels — threshold: 6 Poin first, 9 Poin second violation — source: https://seller.shopee.co.id/edu/article/7070
- **[SH-ID-047] (listing, block)** MUST NOT violate shop-name rules — threshold: 2 Poin — source: https://seller.shopee.co.id/edu/article/7070

## Gaps (not researched / not readable)

- Not covered from official pages this pass: affiliate/KOL rules, voucher T&Cs, detailed return/refund SLAs, shop-health metric targets beyond those above, full prohibited-items lists. Add on next re-check.

## Update 2026-10-29: affiliate, vouchers/promotions, returns

### Additional sources

| URL | Title | Read date | Status |
|---|---|---|---|
| https://seller.shopee.co.id/edu/article/11239 | Shopee ID - Mekanisme Perhitungan Komisi AMS (09-10-2025) | 2026-10-29 | snippet: official URL via search index |
| https://seller.shopee.co.id/edu/article/23961 | Shopee ID - Pengajuan Pengembalian Barang/Dana dari Pembeli | 2026-10-29 | snippet (search synthesis only, no verbatim text) - treat as unverified |
| https://seller.shopee.co.id/edu/article/24020 | Shopee ID - Merespons Pengajuan Pengembalian Barang/Dana | 2026-10-29 | snippet (search synthesis only) - unverified |
| https://seller.shopee.co.id/edu/article/21016 | Shopee ID - Kebijakan Penyalahgunaan Voucher Live & Video | 2026-10-29 | not read: direct fetch returns empty JS shell; only search summary |

### affiliate

- **[SH-ID-117] (warn)** AMS: direct orders charged full set commission; indirect orders half ('Setengah'); unpaid commission via payment link on the 18th of next month — threshold: 50% indirect — source: https://seller.shopee.co.id/edu/article/11239

### vouchers

- No rule captured from an official page this pass (see sources table for 'not read').

### returns

- **[SH-ID-118] (warn)** Buyer return window: Mall 15 days; non-Mall 2 calendar days after receipt or before order completion; partial-refund response 1 calendar day — threshold: 15 / 2 / 1 days — source: https://seller.shopee.co.id/edu/article/23961 — ⚠️ UNVERIFIED: from search synthesis, no verbatim quote captured

### chat

- No rule captured from an official page this pass (see sources table for 'not read').

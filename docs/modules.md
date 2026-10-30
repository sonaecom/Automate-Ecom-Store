# Modules

Run any module with `scripts/real-test.mjs --module <id>`. Each id maps to a manifest in `skills/automate-ecom-store/core/manifest/`.

| Module id | Manifest | Platform guides | Status |
| --- | --- | --- | --- |
| `affiliate.invite` | `affiliate-invite` | `modules/shopee/affiliate-invite.md`, `modules/tiktokshop/creator-outreach.md`, `modules/lazada/affiliate-invite.md` | Stable on Shopee; Beta elsewhere |
| `affiliate.post-invite` | `kol-follow` | `modules/affiliate/post-invite.md`, `chat-reply.md` | Beta |
| `listing.edit` | `shopee-listing-update` | `modules/*/listing-update.md` | Beta |
| `listing.product` | `product-listing` | `modules/*/product-listing.md` | Beta |
| `ads.read` | `spend-topup` (read only) | `modules/ads/`, `modules/shopee/ads-gmv-max.md`, `modules/*/ads.md` | Beta |
| `ads.change` | `ads-change` | same as above | Beta |
| `customers.chat` | `customer-chat` | `modules/*/customer-chat-reply.md` | Beta |
| `inventory.stock-price` | `stock-price` | `modules/*/stock-price-sync.md`, `modules/inventory/` | Beta |
| `selling.promotion` | `promotion` | `modules/shopee/vouchers-promotions.md`, `modules/*/promotions.md` | Beta |
| `orders.handling` | `order-handling` | `modules/orders/` | Beta |
| `reviews.replies` | `review-reply` | `modules/reviews/replies.md` | Beta |
| `ops.daily-report` | `daily-report` | `modules/*/daily-report.md` | Beta |
| `homepage.decoration` | `shop-decoration` | `modules/homepage/`, `modules/*/shop-decoration.md` | Beta |
| `content.video-live` | `video-live` | `modules/content/video-live.md` | Beta |

**Stable** — proven in supervised real-store runs. **Beta** — code, manifest and unit tests exist; supervised runs in progress. TikTok Shop and Lazada guides are templates refined after a supervised run.

Planning-only areas (no browser writes): `modules/growth/`, `modules/scale/`, `modules/fees/`, `modules/fx/`, `modules/wallet/` (read-only money views).

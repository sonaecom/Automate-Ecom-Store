# Seller API adapters

Use the official API for reads and stock sync when the seller already has access. Use the visible AdsPower browser for everything the API cannot do. Do not put a key, a secret, or a partner id in this folder.

| Platform | API | Docs |
| --- | --- | --- |
| Shopee | Shopee Open Platform | https://open.shopee.com/documents |
| TikTok Shop | TikTok Shop Partner API | https://partner.tiktokshop.com/ |
| Lazada | Lazada Open Platform | https://open.lazada.com/ |

`adapter.mjs` is the stub. `createAdapter("<platform>")` then `read("<resource>")`.

- `orders`, `products`, `ads_report`, and `wallet_read` are API reads. The stub throws `NOT_CONFIGURED` until access is connected outside the repo.
- `listing_images`, invites, shop decoration, chat replies, and captcha are `BROWSER_ONLY`.

Two-source QC still applies: an API figure and the official export or the screen. Do not average a mismatch. Writes that change a listing, a price, a message, or a payout stay on the screen, at a human pace, inside the caps. The API path does not top up, withdraw, or register a program.

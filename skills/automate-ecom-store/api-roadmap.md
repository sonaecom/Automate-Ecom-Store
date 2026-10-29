# Official API roadmap

Prefer the official seller API for data and stock sync when that seller already has access. Use the visible AdsPower browser only for work the API cannot do. The stub is `{baseDir}/adapters/README.md` and `{baseDir}/adapters/adapter.mjs`. No key belongs in this repo.

| Platform | API | Public docs |
| --- | --- | --- |
| Shopee | Shopee Open Platform | https://open.shopee.com/documents |
| TikTok Shop | TikTok Shop Partner API | https://partner.tiktokshop.com/ |
| Lazada | Lazada Open Platform | https://open.lazada.com/ |

API reads, once access is connected outside the repo: orders, products, ads report, wallet read. The stub throws `NOT_CONFIGURED` until then. Two-source QC still compares the API figure with the official export or the screen. Do not average a mismatch.

Browser only: listing images, affiliate or creator invites, shop decoration, customer chat, captcha, and any button the API does not offer. Those calls throw `BROWSER_ONLY`.

Not on the roadmap, and not allowed now:

- Undocumented or internal seller endpoints
- Replaying network calls from the browser
- A script that tops up, withdraws, or registers a campaign by itself
- Headless mode
- A partner key, secret, or shop id committed to git

AdsPower still opens the profile through the official `adspower-browser` skill, MCP, or CLI. The address is `<ADSPOWER_API_BASE>` in the private config, empty when the client default works.

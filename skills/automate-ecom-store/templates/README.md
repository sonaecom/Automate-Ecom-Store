# Template library

| File | Use |
| --- | --- |
| `listing_images.py` | Square listing images from a private spec. Refuses placeholders unless `--allow-placeholders`. |
| `homepage_assets.py` | Homepage banners at the draft sizes in `modules/homepage/sizes.md`. |
| `sample-ads-*.csv` | Placeholder spend, top-up, charge, and balance rows for the reconciler. |
| `sample-wallet-*.csv` | Placeholder wallet, withdrawal, and bank-credit rows. Last 4 digits only. |
| `sample-settlement*.csv` | Placeholder order payouts. One row is underpaid on purpose. |
| `sample-orders-cancel*.csv` | Placeholder orders. One return has no pickup time and must stay out of the return rate. |
| `sample-fx-*` | Placeholder sales, ads, and wallet amounts with a daily rate ledger and a monthly custom rate table. |
| `messages/library.json` | KOL invite, chat reply, review reply, post-delivery thank-you, and title templates in EN, VI, ID, MS, and TH. KOL invites are at most 200 characters. The thank-you does not ask for a star rating. |
| `sample-scorecard.csv` | Example store-versus-competitor rows. The script prints five fixes. |
| `sample-funnel.csv` | Example impressions, clicks, add-to-cart, and orders. |
| `sample-hero.csv` | Example SKUs. Out-of-stock, non-compliant, and photo-missing rows stay off the hero list. |
| `sample-break-even.csv` | Example costs. One SKU cannot cover its costs. |
| `sample-ab.csv` | Example before and after counts. One test is inconclusive. |
| `sample-follow-up.csv` | Example orders. A not-yet-delivered row must not be messaged. |
| `sample-scale-*.csv` | Example rows for a store that is already selling. One SKU shows sales up and margin down. One expansion is on hold. |
| `sample-inventory-*.csv` | Example platform stock, warehouse quantities, the SKU map, a manual variation set, and the last pushed quantities. No real shop or sheet. |
| `sample-fee-*.csv` | Example settlement fees and caps. One order disagrees on purpose. No real shop. |
| `../modules/listing/spec.example.yaml` | Listing content plan. |
| `../modules/listing/research-sheet.md` | Competitor notes. |
| `../modules/homepage/style.example.yaml` | Brand colors and tone. |
| `../policy/*/MARKET.example.yaml` | Empty policy file. Copy to `<MARKET>.yaml` when the pack arrives. |

Generated images go under `~/.automate-ecom-store/`, not into git. Use the same colors and font as the listing set when you make homepage assets.

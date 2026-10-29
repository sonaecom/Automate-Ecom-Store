# Template library

| File | Use |
| --- | --- |
| `listing_images.py` | Square listing images from a private spec. Refuses placeholders unless `--allow-placeholders`. |
| `homepage_assets.py` | Homepage banners at the draft sizes in `modules/homepage/sizes.md`. |
| `sample-ads-*.csv` | Placeholder spend, top-up, charge, and balance rows for the reconciler. |
| `sample-wallet-*.csv` | Placeholder wallet, withdrawal, and bank-credit rows. Last 4 digits only. |
| `sample-settlement*.csv` | Placeholder order payouts. One row is underpaid on purpose. |
| `sample-orders-cancel*.csv` | Placeholder orders. One return has no pickup time and must stay out of the return rate. |
| `../modules/listing/spec.example.yaml` | Listing content plan. |
| `../modules/listing/research-sheet.md` | Competitor notes. |
| `../modules/homepage/style.example.yaml` | Brand colors and tone. |
| `../policy/*/MARKET.example.yaml` | Empty policy file. Copy to `<MARKET>.yaml` when the pack arrives. |

Generated images go under `~/.automate-ecom-store/`, not into git. Use the same colors and font as the listing set when you make homepage assets.

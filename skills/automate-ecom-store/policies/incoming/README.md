# Policy research drop-in

The 2026-10-29 research pass is in the market files and in `policies/rules.yaml` (104 rules) and `policies/sources.yaml`. Source URLs, retrieved dates, and the markers `UNVERIFIED`, `snippet only`, and `not read` stay as recorded.

Files:

- `policies/shopee/PH.md`, `MY.md`, `ID.md`
- `policies/tiktokshop/PH.md`, `MY.md`, `ID.md`
- `policies/lazada/PH.md`, `MY.md`, `ID.md`

The gate reads `rules.yaml` for the platform and market on every module. A review request cannot ask for a positive or 5-star review or offer a reward. Chat cannot carry a contact, a URL, or an off-platform deal. A scrape or a request flood is blocked. A fake discount must wait out the lead time printed as `lead_days`. Late-shipment and cancellation numbers from that file feed shop-health alerts for the same market.

Lazada PH, MY, and ID coverage is incomplete. The weekly updater must browser re-check those pages. It must not treat a timed-out or empty fetch as the local rule.

# Policy gate

The rules live in `{baseDir}/policies/LAYER.md`, `policies/<platform>/<MARKET>.md`, and `policies/rules.yaml`. This file remains so older steps still find the gate.

```bash
node {baseDir}/scripts/policy-gate.mjs --platform <PLATFORM> --market <MARKET> --action <ACTION> --text "<TEXT>"
```

- `ALLOW`: a market summary exists and its `retrieved` date is within 7 days, and the text is clean.
- `POLICY_PENDING`: no market file. Read-only actions may continue. Mutating actions stop.
- `STALE`: the file is older than 7 days. Tell the owner. Do not mutate.
- `VIOLATION`: blocked wording. That includes a positive or 5-star review ask, a reward for a review, a contact or URL, an off-platform deal, a scrape or request flood, and a price raised to fake a discount.
- `FLAG`: a verify-or-flag rule matched on a mutating action.

Mutating actions: `publish`, `price`, `budget`, `refund`, `register`, `delete`, `stock_write`, and `submit`.

```bash
node {baseDir}/scripts/policy-update.mjs
```

The checker reads public pages from `policies/sources.yaml`. A change is an alert and a changelog row. It does not change seller settings. Lazada PH, MY, and ID coverage is incomplete. Those `snippet only`, `not read`, and `UNVERIFIED` rows are a browser re-check, not a curl hash.

`--dry-run` prints the plan and does not write.

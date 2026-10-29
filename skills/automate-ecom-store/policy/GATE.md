# Policy gate

Every module starts here. Copy `MARKET.example.yaml` to `<platform>/<MARKET>.yaml` when the policy pack for that market arrives. Example files do not count.

```bash
node {baseDir}/scripts/policy-gate.mjs --platform <PLATFORM> --market <MARKET> --action <ACTION>
```

- `ALLOW`: a policy file exists and its `retrieved` date is within 7 days.
- `POLICY_PENDING`: no policy file for that market yet. Read-only actions may continue. Mutating actions stop.
- `STALE`: the file is older than 7 days. Run the updater, tell the owner, and do not mutate.

Mutating actions: `publish`, `price`, `budget`, `refund`, `register`, `delete`, `stock_write`, `submit`.

The weekly read is:

```bash
node {baseDir}/scripts/policy-update.mjs
```

It fetches the URLs in `sources.yaml`, compares a hash to the local cache, and appends `~/.automate-ecom-store/policy-changelog.md` when a page changed. It then prints `ALERT`. It does not open Seller Centre and it does not change a price, a budget, a listing, or a program.

`--dry-run` prints the plan and does not write the changelog.

# Platform policy layer

Read this with `account-safety.md` before every module. If they disagree, the stricter rule wins. Account safety still wins on pace, captcha, one visible tab, and not moving money.

The market file is `policies/<platform>/<MARKET>.md` for Shopee, TikTok Shop, and Lazada, and for PH, VN, MY, ID, TH, and SG. PH, MY, and ID notes read on 2026-10-29 live in those files. `policies/rules.yaml` is the rule list the gate loads for that pair. Each rule keeps its source URL and retrieved date. `UNVERIFIED`, `snippet only`, and `not read` stay as recorded.

```bash
node {baseDir}/scripts/policy-gate.mjs --platform <PLATFORM> --market <MARKET> --action <ACTION> --text "<TEXT>"
```

- `ALLOW`: the market file is present, `retrieved` is within 7 days, and the text hit no block rule.
- `POLICY_PENDING`: no market file. Reads may continue. Mutations stop.
- `STALE`: older than 7 days. Run the weekly check, tell the owner, do not mutate.
- `VIOLATION`: the text asks for a positive or 5-star review, offers a reward for a review, sends a contact, a URL, or an off-platform deal, proposes a scrape or a request flood, or raises a price to fake a discount. Stop.
- `FLAG`: a rule matched and the action would publish or send. Stop and show the owner the source line.

Pass titles, image text, chat drafts, and voucher text in `--text` or `--file`. The gate also prints `health_threshold` and `discount_rule` from `rules.yaml` for this platform and market. Shop health uses a blank threshold from that same market only. A fake-discount lead time is `lead_days` on the pricing rule. Human pace still comes from account safety: one visible tab, no scrape flood.

Lazada PH, MY, and ID coverage is incomplete. The weekly updater must browser re-check those pages. A timed-out fetch, a `snippet only` line, or a `not read` line is not the local rule.

The weekly check is read-only:

```bash
node {baseDir}/scripts/policy-update.mjs
```

It fetches `policies/sources.yaml` from the public pages, diffs the snapshot, appends `## Update log` on the market file, and writes `~/.automate-ecom-store/policy-changelog.md`. It prints `ALERT`. It does not change a price, a budget, a listing, a message, or a programme. `--dry-run` does not write. `--no-apply-changelog` alerts without editing the market file.

Official URLs are listed in `{baseDir}/policies/sources.yaml`, including every research URL and its status from 2026-10-29.

Lazada PH, MY, and ID coverage is incomplete and needs a browser re-check in the weekly updater. The note is repeated in `{baseDir}/policies/incoming/README.md`.

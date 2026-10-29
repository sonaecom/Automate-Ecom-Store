# Platform policy layer

Read this with `account-safety.md` before every module. If they disagree, the stricter rule wins. Account safety still wins on pace, captcha, one visible tab, and not moving money.

The market file is `policies/<platform>/<MARKET>.md` for Shopee, TikTok Shop, and Lazada, and for PH, VN, MY, ID, TH, and SG. Each rule has a source URL, a retrieved date, and `verify: yes` when the local page was not the one opened on 2026-10-29.

```bash
node {baseDir}/scripts/policy-gate.mjs --platform <PLATFORM> --market <MARKET> --action <ACTION> --text "<TEXT>"
```

- `ALLOW`: the market file is present, `retrieved` is within 7 days, and the text hit no block rule.
- `POLICY_PENDING`: no market file. Reads may continue. Mutations stop.
- `STALE`: older than 7 days. Run the weekly check, tell the owner, do not mutate.
- `VIOLATION`: the text asks for a star rating, sends the buyer off the platform, or uses a blocked claim. Stop.
- `FLAG`: a rule matched and the action would publish or send. Stop and show the owner the source line.

Pass titles, image text, chat drafts, and voucher text in `--text` or `--file`.

The weekly check is read-only:

```bash
node {baseDir}/scripts/policy-update.mjs
```

It fetches `policies/sources.yaml` from the public pages, diffs the snapshot, appends `## Update log` on the market file, and writes `~/.automate-ecom-store/policy-changelog.md`. It prints `ALERT`. It does not change a price, a budget, a listing, a message, or a programme. `--dry-run` does not write. `--no-apply-changelog` alerts without editing the market file.

Official URLs are listed in `{baseDir}/policies/sources.yaml`.

PH, MY, and ID files are the slots for a later research pass. Keep the same headings when those official pages are dropped in. The shape is `{baseDir}/policies/incoming/README.md`.

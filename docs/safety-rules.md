# Safety rules

Full text: `skills/automate-ecom-store/account-safety.md` and `OPERATING_RULES.md`.

## Ceilings (not targets)

| Action | Ceiling |
| --- | --- |
| Affiliate invites | 2,000 / day and 100 / hour, batches of ~10 with 2–5 min pauses |
| Listing edits | 40 / hour |
| Ads changes | 10 / hour |
| Chat replies | 10 / session and 10 / day |

`--max-actions` is a hard cap: a write that would pass it stops with `LIMIT` before anything is typed.

## Rhythm

- Work in batches of 40–50 minutes with 10–20 minute breaks; seller sessions 2–3 hours apart.
- Bursts of 10–15 actions, then a 120–300 s rest; after a captcha every gap doubles.

## Browser

- One profile per store, one fixed proxy and fingerprint per profile; never change IP, UA, cookies, or fingerprint.
- One visible tab. No headless mode.
- Login page, "page unavailable", identity check, or proxy country change: stop and report.

## Captcha

At most one human-like slider drag per session. If it remains or anything else appears: screenshot, alert, pause the store at least 30 minutes. No solver services.

## Money and approvals

Read-only. Top-up, withdraw, pay, budget changes, refunds, program joins, deletions, and large price cuts are proposals the owner clicks.

## Security

- No direct marketplace APIs, internal endpoints, request replay, injected scripts, or cookie/token reads.
- No secrets, IPs, profile ids, or real names in the repo.
- Read-only mode is the default and is enforced in `core/safety/read-only.mjs`.

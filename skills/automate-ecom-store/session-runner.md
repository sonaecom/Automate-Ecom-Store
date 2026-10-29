# Session runner

`SKILL.md` reads `{baseDir}/account-safety.md` before this file. These scripts are the counter and the clock. They do not click the seller page.

`{baseDir}` is the skill folder (the directory that contains `SKILL.md`).

## When to use

Use these scripts during every store session: before start, between actions, after a captcha, and at the end. The task queue in `{baseDir}/modules/ops/task-queue.md` decides which chunk runs. Platform skills name the action (`listing_edits`, `affiliate_invites`, or `ads_changes`) and the message or CSV they need checked. One profile at a time.

On a host that stays up, run `{baseDir}/scripts/unattended-tick.mjs` before `open-browser`. `WAIT` means do not open a profile. Pace commands below still apply inside a session that does start. A restart of the agent does not cancel the gap.

Before the module types, `{baseDir}/core/runner.mjs` checks the manifest, the read-only guard, the policy result, and the action_key journal. A done key is not repeated that day. Policy text is only `policies/rules.yaml`.

## Prerequisites

- Private `~/.automate-ecom-store/config.yaml` exists (`save-config.mjs --status` says the key is set).
- Node is available. The scripts have no packages and no network calls.
- Paths in config are relative to `~/.automate-ecom-store/` unless they are absolute.
- Do not print `profile_id`, `api_base`, or the API key.

## Steps

1. Use `save-config.mjs --status` instead of opening the config in the chat. Reject a run when status says the key is missing.
2. Gate the session:

```bash
node {baseDir}/scripts/captcha-log.mjs --csv <CAPTCHA_LOG> --review --platform <PLATFORM>
node {baseDir}/scripts/caps-counter.mjs --state <SESSION_STATE> --show --gap-hours <GAP_HOURS_MIN>
```

Continue only when captcha review is `OK` and the caps result is `READY`.

3. After account-safety opens the profile, start the clock:

```bash
node {baseDir}/scripts/caps-counter.mjs --state <SESSION_STATE> --new-session
```

4. Before each counted change, add first. A `CAP` result means you do not make the change:

```bash
node {baseDir}/scripts/caps-counter.mjs --state <SESSION_STATE> --action affiliate_invites --add 1 --session-limit 30 --daily-limit 30
```

Use the limits `apply-stores.mjs` printed for this store. If that store has no private caps, use the global caps. Do not use a higher number. Before each new batch:

```bash
node {baseDir}/scripts/caps-counter.mjs --state <SESSION_STATE> --check-duration --max-minutes <SESSION_MINUTES_MAX>
```

On `TIME_UP`, end the session.

5. Wait with the pacer. Pass `--multiplier` equal to `pace_multiplier` from `--show` (1 until a captcha, then 2):

```bash
node {baseDir}/scripts/delay-range.mjs --min 3 --max 8 --multiplier 1
node {baseDir}/scripts/delay-range.mjs --min 20 --max 60 --multiplier 1
node {baseDir}/scripts/delay-range.mjs --min 120 --max 300 --multiplier 1
```

6. Dedupe a private CSV before inviting or editing a row that might already be done:

```bash
node {baseDir}/scripts/dedupe-csv.mjs --csv <CSV> --list
node {baseDir}/scripts/dedupe-csv.mjs --csv <CSV> --handle <HANDLE>
node {baseDir}/scripts/dedupe-csv.mjs --csv <CSV> --column item_label --value <ITEM_LABEL>
```

Exit 0 means the check ran. Skip `SKIP` rows. Act only on `NEW` rows.

7. Check message length before typing a message. Default max is 200. Pass `--max` only when the on-screen limit is lower. Never pass a max above the platform limit. The on-screen counter wins.

```bash
node {baseDir}/scripts/check-message-length.mjs --file <MESSAGE_FILE>
```

Continue only on `result: OK`.

8. After any captcha, log it, then double the pace:

```bash
node {baseDir}/scripts/captcha-log.mjs --csv <CAPTCHA_LOG> --platform <PLATFORM> --skill <SKILL> --step <STEP> --type slider --slider-used no --outcome stopped --note "screen left for a person"
node {baseDir}/scripts/caps-counter.mjs --state <SESSION_STATE> --set-multiplier 2
```

9. End:

```bash
node {baseDir}/scripts/caps-counter.mjs --state <SESSION_STATE> --end-session
```

Add `--block-minutes 30` when a captcha was not cleared.

## QC

- `--show` counts match the changes you actually saved, not the changes you only typed.
- A message check `OK` still loses to an on-screen counter that says the text is too long.
- Dedupe `SKIP` means do not act on that row again.

## Stop conditions

- Config missing, or still the example placeholders.
- Captcha review is `REVIEW`.
- Gate result is `TOO_SOON` or `BLOCKED`.
- `--add` returns `CAP`, or duration returns `TIME_UP`.
- A script exits 2 (bad file or bad arguments). Fix the file with a person. Do not keep clicking.

## Report

Include session id, start, end, duration, pace multiplier, each action count against its limit, captcha log path, and the gate result. Do not include the profile id, the API address, or the key.

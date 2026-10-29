# Account safety

SKILL.md loads this file before every task. If a module disagrees with this file on profiles, tabs, pace, caps, captcha, headless mode, or approvals, this file wins. The module only adds the page steps for that task.

This pack operates stores the staff member is allowed to manage. The goal is account health: fewer captchas, fewer restrictions, and no store bans. Work at a human pace in a visible window.

`{baseDir}` is the skill folder. Scripts live in `{baseDir}/scripts/`. Private config is only `~/.automate-ecom-store/config.yaml`, mode 600, written by `{baseDir}/scripts/save-config.mjs`. Never copy that file into the git repo. Paths named `data/` or `screenshots/` in a module are directories inside `~/.automate-ecom-store/`, not the repository.

## When to use

Use this at the start and the end of every Shopee, Lazada, and TikTok Shop task. SKILL.md reads this file before it opens a module.

## Profile and login

- One AdsPower profile per store. That profile keeps its own fixed proxy and fingerprint.
- Open only the profile id in private config. If the seller page is a different store than the one this profile is for, stop. Do not switch accounts.
- Never log a store in outside its own profile.
- Never change IP, proxy, user agent, or fingerprint. Do not call `new-fingerprint`, `delete-cache-v2`, `update-browser`, `create-proxy`, or any tool that edits the profile.
- Never clear cookies or site data.
- Never start a second window for the same store.

## Browser driver

Official AdsPower tooling opens and manages the profile. Package: [AdsPower/adspower-browser](https://github.com/AdsPower/adspower-browser).

```bash
npx clawhub@latest install adspower-browser --force
npm i -g adspower-browser
openclaw mcp set adspower-local-api '{"command":"npx","args":["-y","local-api-mcp-typescript"],"env":{"PORT":"<PORT>","API_KEY":"<API_KEY>"}}'
```

`<PORT>` and `<API_KEY>` come from the private environment. `<PORT>` is the port shown at **AdsPower > Automation > API**, the same screen as `ADSPOWER_API_BASE` (placeholder `<ADSPOWER_API_BASE>`). Do not write a host, a port number, or a key into this repo. Do not hand-write Local API HTTP calls. Do not build a websocket yourself.

Page actions go through `@playwright/mcp` attached to the CDP websocket from this run's `open-browser` result:

```bash
openclaw mcp set playwright '{"command":"npx","args":["-y","@playwright/mcp@latest","--cdp-endpoint","<CDP_WS_ENDPOINT>"]}'
```

Do not use AdsPower page tools (`navigate`, `click-element`, `fill-input`, `open-new-page`, `connect-browser-with-ws`, `drag-element`, `hover-element`, and the rest of that page set). Do not launch Playwright's own browser. Do not pass headless to either tool.

**Never use headless mode for store work.** The AdsPower window stays visible so a person can watch it. Some AdsPower docs show a headless client switch. Do not use it.

## One tab

After attach, list tabs and close every tab except one. Later moves stay in that tab. Never open a new tab (`browser_tabs` action `new`, AdsPower `open-new-page`, or a link that spawns a tab). If a click opens a tab, close it unused and find a same-tab control. If you cannot, stop and ask.

Reload a page at most twice. A third reload means stop and ask. Navigating to the same URL counts as a reload.

Optional supervisor dot: when `show_click_dot` is true, before a direct click place an 8px red circle at the element center with `browser_evaluate`, then click, then remove the dot. Skip the dot if evaluate is unavailable. Run no other page script.

```javascript
([x, y]) => {
  const id = "__supervisor_click_dot";
  document.getElementById(id)?.remove();
  const dot = document.createElement("div");
  dot.id = id;
  dot.style.cssText = "position:fixed;left:" + (x - 4) + "px;top:" + (y - 4) + "px;width:8px;height:8px;border-radius:50%;background:red;z-index:2147483647;pointer-events:none;";
  document.documentElement.appendChild(dot);
}
```

Click with `browser_click`. Do not hover and do not animate the pointer across the screen.

## Session batching

A session is one visible visit.

- Start a session only when `caps-counter.mjs --show --gap-hours <gap_hours_min>` prints `result: READY`. Default gap is 2 hours. Private config may set the gap from 2 to 3 hours. If it is outside 2–3, stop and ask. Do not start earlier.
- Work at most `session_minutes_max` minutes (default 40, allowed range 30–40). If config is outside 30–40, stop and ask. Before each new batch of actions, run `--check-duration`. On `TIME_UP`, stop the task even if work remains, then idle on home.
- When the session ends, idle on that platform's seller home in the same tab. Do not log out. Do not close the profile. Run `--end-session`.
- Do not chain a second session. The next start waits for the gap.

## Human pace

An action is a finished field edit, a click that changes the page, a menu move, a list page change, or a pop-up dismiss. Snapshots, screenshots, and helper scripts are not actions.

Use `delay-range.mjs` so the wait is random. Do not invent a shorter wait.

| When | Command |
| --- | --- |
| After each action | `--min 3 --max 8` |
| After each item edit (listing, stock, price, one chat reply) | `--min 20 --max 60` |
| After every 10–15 actions | `--min 120 --max 300` |

Pick the burst length once per cycle, a whole number from 10 to 15, and pause when `action_count` reaches it. Do not pause in the middle of select-all and type on the same field. During a long pause, leave the page alone. Do not reload to keep the session warm.

After any captcha, run `caps-counter.mjs --set-multiplier 2` and pass `--multiplier` from `pace_multiplier` on every later wait in that session. That doubles 3–8 into 6–16, 20–60 into 40–120, and 120–300 into 240–600.

## Caps

Defaults, overridable in private config, never raised during a run:

| Action | Session cap | Daily cap | How to apply it |
| --- | --- | --- | --- |
| `listing_edits` | 10 | 10 | One edited listing counts as one |
| `affiliate_invites` | 30 | 30 | One creator counts as one, in batches of 10 |
| `ads_changes` | 3 | 3 | One saved ads setting change counts as one |
| `chat_replies` | 10 | 10 | One sent reply counts as one |

Before the action, `--add` the count you are about to commit. On `CAP`, do not do the action. Affiliate invites happen in small batches (`affiliate_batch_size`, default 10): after each batch, take the 2–5 minute pause, then continue only if time and caps remain.

Prefer the platform's official export, bulk edit, or the shop's already-approved official seller API over opening many pages. Official exports and bulk screens are the normal path. Do not call private or internal endpoints, do not replay network calls, and do not flood requests. Do not read cookies or tokens. Do not call `get-profile-cookies`.

## Captcha

On a slider puzzle, image grid, human-check, or unusual-traffic page:

1. Stop the task steps. Log a row with `captcha-log.mjs` (`slider_used` `no` until you actually drag).
2. If it is a slider and this session has not dragged yet: one `browser_drag` of the handle toward the target, lasting 1–2 seconds, not at a constant speed. Set `slider_used` to `yes` in a second log row or by telling the person the first row was updated in the report. Do not drag twice.
3. If the captcha remains, it is not a slider, or another captcha appears: do not drag again. Do not call a solver, an extension, or another service. Leave the screen as it is. Screenshot `<screenshots_dir>/captcha.png`. Alert the person with that path. Run `--end-session --block-minutes 30`. Idle. Do not continue today until `result: READY` (the block is at least 30 minutes, and the normal session gap still applies if it is longer).

Before every session, `--review` the captcha log for this platform. On `REVIEW` (2 or more captchas today), show the rows to a person and do not start.

## Pop-ups and approvals

Close notifications with X, Close, Not now, Cancel, or the same control in the page language. Never accept a program sign-up, a paid plan, a top-up, or a payment.

Stop and get a clear yes in this chat before any of these clicks:

- Budget change, top-up, wallet, or any payment
- Refund, or a promise of a refund
- A price cut at or above `price_drop_approval_percent` when that private value is a real number. If the value is still a placeholder, every price cut needs a yes
- Any deletion of a listing, campaign, voucher, ad, or message

A yes applies only to the exact change you described. Do not reuse it for the next row.

## Numbers, variants, and QC

Reports use exact figures copied from an official export or the saved page. Cross-check the figure against a second official view (export opened again, or the summary on the saved page). If the two views differ, report both and do not pick a winner. Do not estimate, round, or fill a gap from memory.

Never trust a product title for a variant size. Read the variation row's own name. A title that merely contains the size text is not a match. A nearby size is not a match. If the exact name is missing, stop.

Every edit has two checks:

1. QC before submit: read the screen, screenshot, and match every changed field to the private instruction.
2. QC on the saved page: screenshot, and match what was saved to QC #1.

If either check fails, do not submit a correction in a hurry and do not create a second record. Stop and ask.

## Secrets

Do not write API keys, the Local API address, ports, profile ids, the CDP websocket, shop names, product names, creator handles, or personal emails into this repository. The live chat report may repeat figures and handles the person needs. Do not commit that report. If config and env `ADSPOWER_API_BASE` are both set and differ, stop without printing either value. If any private value still contains a `<PLACEHOLDER>` token, stop.

## Session start

Do this before the platform skill's own steps.

1. Run `{baseDir}/scripts/save-config.mjs --status`. Continue only when `config: present` and `api_key: set`. If the config is missing, return to the first-run section in `SKILL.md`. Do not read `{baseDir}/config.example.yaml` as the live file. Do not print the key, the Local API address, or any profile id.
2. `api_base: default` means the marketer kept the client's usual Local API address. `api_base: custom` means a private address is saved. Either is allowed. `headless` must be false.
3. `{baseDir}/scripts/captcha-log.mjs --review` for the platform of the store you are about to open. On `REVIEW`, stop.
4. `{baseDir}/scripts/caps-counter.mjs --show --gap-hours` using `schedule.gap_hours_min`, with `--state` pointing at `~/.automate-ecom-store/data/session-state.json`. Continue only on `READY`.
5. Official `check-status` (MCP, or `ads check-status` if the MCP tool is missing). If it fails, stop. Do not guess a port.
6. `open-browser` once with `profile_id` from config, `headless` `"0"`, `ip_tab` `"0"`, `proxy_detection` `"0"`, `last_opened_tabs` `"0"`. Prefer the MCP tool. CLI fallback:

```bash
ads open-browser '{"profile_id":"<PROFILE_ID>","headless":"0","ip_tab":"0","proxy_detection":"0","last_opened_tabs":"0"}'
```

The shell may expand `"$ADSPOWER_API_KEY"` only if the CLI requires `--api-key`. Do not record the expanded command. Do not pass a port number in a file. Take the puppeteer websocket from the result. If it is missing, stop.

7. Attach Playwright MCP to that websocket. No headless flag.
8. Reduce to one tab.
9. `{baseDir}/scripts/caps-counter.mjs --new-session` on that same state file, and note the clock time.
10. Open that platform's seller home in the same tab, only to confirm the session is on the store for this profile. Then run the platform skill.

**Done when:** one visible tab is on seller home, the session clock is running, and captcha review was not `REVIEW`.

## Session end

1. If a captcha blocked the run, the block command from the captcha section is already the end. Skip extra clicks.
2. Otherwise, in the same tab, open seller home and stop clicking.
3. `{baseDir}/scripts/caps-counter.mjs --end-session` on that state file, with `--block-minutes 30` only after a failed captcha.
4. Report: platform, skill name, session start and end, duration, pace multiplier, caps used, captcha count, screenshot paths, QC results, and whether the run finished or stopped. Omit keys, addresses, ports, profile ids, and the websocket.

**Done when:** the single tab is idle on seller home, or the screen is frozen on a captcha waiting for a person.

## QC

Every platform edit uses the two checks in "Numbers, variants, and QC": screenshot and read the form before submit, then match the saved page. Reports use exact export figures, cross-checked. Variation size comes from the variation's own name.

## Stop conditions

Stop, without improvising, when:

- The profile, proxy, fingerprint, cookies, or logged-in store would have to change
- Headless mode, a new tab, a third reload, an internal endpoint, or a captcha solver is the only way forward
- The session gate is not `READY`, captcha review is `REVIEW`, duration is `TIME_UP`, or a cap returns `CAP`
- A captcha survives the one slider drag
- The click is a payment, top-up, sign-up, refund, deletion, or a price cut that still needs a yes
- QC #1 and the saved page disagree

## Report

Use the session-end list: platform, skill, start, end, duration, pace multiplier, caps used, captcha count, screenshot paths, QC results, and whether the run finished or stopped. Exact figures only. Omit keys, addresses, ports, profile ids, and the websocket.

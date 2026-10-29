---
name: automate-ecom-store
description: Operate your own Shopee, Lazada, and TikTok Shop stores in a visible AdsPower profile. Read account safety, then route to the task.
version: "1.30.0"
user-invocable: true
metadata:
  openclaw:
    requires:
      bins:
        - node
---

# Automate Ecom Store

One skill for marketers running their own Shopee, Lazada, and TikTok Shop stores. `{baseDir}` is this folder. If it is not replaced, use the directory that contains this file.

Read `{baseDir}/account-safety.md` in full before any seller click, every run. If a module disagrees with that file, account safety wins.

## When to use

Use this when a marketer wants store work done in the seller centre: affiliate or creator invites, listing edits, stock or price sync, promotions, ads, customer chat, or a daily report. Do not use it for a store they are not allowed to operate.

## First run

If the person says "reset config", do the reset section first, then this section.

Safety caps are already filled in by `save-config.mjs` (10 listing edits, 30 affiliate invites in batches of 10, 3 ads changes, 10 chat replies, per session and per day). Do not ask the marketer to type those numbers.

### 1. Ask for the API key only

1. Run `node {baseDir}/scripts/save-config.mjs --status`.
2. `result: OK` means the key and at least one store are already saved. Go to "Every run".
3. `result: NEED_STORES` means the key is already saved. Skip the key question. Go to "List profiles".
4. `result: MISSING` means ask for one thing only: the AdsPower API key. Say it is saved on this computer in `~/.automate-ecom-store/config.yaml` (mode 600) and you will not repeat it. Do not ask for an address, a profile id, a platform, or the caps.

Save the key with an empty store list and an empty address, so the official AdsPower tool uses its usual Local API address:

```bash
node {baseDir}/scripts/save-config.mjs <<'JSON'
{"api_key":"<API_KEY>","api_base":"","stores":[]}
JSON
```

Put the real key only in that local command. Do not copy the command into the chat after it has a real key. Do not suggest a host or a port.

### 2. List profiles

Use the official AdsPower CLI or MCP (`get-browser-list` / `ads get-browser-list`). Do not pass an address. Do not hand-write an HTTP call. Give the CLI the saved key through the environment for that command only, without printing the key.

If the command cannot connect and `api_base` is `default`, ask once for the address shown in **AdsPower > Automation > API**. Save it with another stdin write that sets `api_base` and omits `api_key`. Do not repeat the address. Retry the profile list once. If it still fails, stop and tell them to open the AdsPower app. Do not invent an address.

Read every page of the profile list. Keep each profile id in your notes. Do not show ids in the chat.

Run the names through the guesser:

```bash
node {baseDir}/scripts/guess-platform.mjs
```

Show a numbered list: number, profile name, and the guess (Shopee, Lazada, TikTok Shop, or chưa rõ). Nothing else.

- If `unknown_count` is 0, they can reply `ok` to accept every guess, or correct by number, for example `1 shopee, 2 tiktok`.
- If any line is `unknown`, do not accept a bare `ok`. Ask them to assign those numbers, for example `2 lazada`. They can also correct a guess the same way.
- They can drop a number by saying so (`bỏ 3`). One profile is one store. Do not change its proxy or fingerprint.

Then save, omitting the key so the saved key stays in place. `label` is the profile name. `profile_id` comes from your notes, not from the chat.

```bash
node {baseDir}/scripts/save-config.mjs <<'JSON'
{"stores":[{"platform":"<PLATFORM>","profile_id":"<PROFILE_ID>","label":"<STORE_LABEL>"}]}
JSON
```

Run `--status` again. Continue only on `result: OK`. Tell them how many stores were saved, which platforms, and that the safety caps are already on. Do not quote the key, the address, or any profile id.

### 3. Context interview

Ask this after the AdsPower key is saved and the stores are picked. Ask it again whenever they say "phỏng vấn lại" or "làm lại lộ trình". Read the questions from the script and ask them in Vietnamese, in order. Each question can be skipped. Do not invent an answer for a skip.

```bash
node {baseDir}/scripts/onboard-context.mjs --questions
```

Map the replies into JSON. `store_count` is `1` or `many`. Platforms are `shopee`, `tiktokshop`, or `lazada`. Markets are `PH`, `MY`, `ID`, `VN`, `TH`, or `SG`. Stage `A` is a new store, `B` is an existing store that is underperforming, `C` is stable or growing. Goals are `doanh_thu`, `loi_nhuan`, `don`, or `thuong_hieu`. Team size is `1`, `2-5`, or `6+`. Cadence is `week`, `month`, or `quarter`. Omit a skipped field. Match each store by its label, not by profile id.

```bash
node {baseDir}/scripts/onboard-context.mjs --save <<'JSON'
{"store_count":"many","platforms":["shopee"],"markets":["VN"],"goals":["loi_nhuan"],"team_size":"2-5","cadence":"month","stores":[{"label":"<STORE_LABEL>","stage":"A","market":"VN"}]}
JSON
```

A skip of the whole interview is `{"skip":true}`. That does not delete a roadmap already saved. The script writes stage and market onto the saved stores, then writes `roadmap.md`, `roadmap.yaml`, and `roadmap.csv` under `~/.automate-ecom-store/`. Recommendations follow the stage: A is policy, listing, first affiliates, vouchers, and first ads. B is health, fees, ads ROAS, listing fixes, and cancel or return rates. C is ads under the cap, margin, stock, expansion, team SLA, and Mall. The roadmap lists those modules in order, with a milestone and a KPI, for the cadence they picked.

Do not print the key, the address, or any profile id. If `unknown_store` is printed, the label did not match a saved store. Ask once, then continue with the stores that matched.

At the end of a period, re-suggest from results. Do not replace the roadmap until they accept.

```bash
node {baseDir}/scripts/onboard-context.mjs --resuggest --as-of <YYYY-MM-DD> --results <RESULTS_CSV>
node {baseDir}/scripts/onboard-context.mjs --accept
```

`--resuggest` writes `roadmap-suggestion.md` and `roadmap-suggestion.yaml`. `WAIT` means the period has not ended. `NEED_RESULTS` means a current KPI has no row. `SUGGEST` means a missed KPI is repeated and later modules move back. `--accept` copies that suggestion over the live roadmap.

### 4. Two optional Google questions

Ask these after the AdsPower key is saved. Ask both. Each answer is yes or no. Neither is required. Do not ask a general "connect Gmail and Drive?" question.

1. Do you want reports on Google Sheets?
2. Do you already have a real-time inventory tracking file on Google Sheets?

Save the answers. Omit the key. `true` is yes. `false` is no.

```bash
node {baseDir}/scripts/save-config.mjs <<'JSON'
{"google":{"sheets_reports":false,"inventory_sheet":false}}
JSON
```

If both are no, skip Google entirely. Do not open a sign-in. Do not create Drive folders. Do not save a token. Manual and auto inventory still run. Local CSV reports still run.

Google (Gmail, Drive, and Sheets) is connected only for a yes:

1. Sheets reports. Use the OpenClaw Google connectors when those are available. Otherwise ask them to complete Google's own sign-in, then save the token only with:

```bash
node {baseDir}/scripts/push-sheets.mjs --save-token
```

The token is read from stdin and written to `~/.automate-ecom-store/google-token.json` (mode 600). Do not echo it. Then create the Drive folders named in account-safety "Mail and Drive". Exports, reports, images, and the dashboard file live there. Gmail on that connection is for penalty mail, campaign invitations, one-time codes while the person is here, and reports to the owner. Never auto-reply to a customer email.

2. An existing real-time inventory file on Google Sheets. Sign in again with Google's read-only Sheets scope `https://www.googleapis.com/auth/spreadsheets.readonly`. An optional Drive metadata scope may be added only to read the file's modified time. Do not accept the read-write Sheets scope for this file. Save it with:

```bash
node {baseDir}/scripts/inventory-sync.mjs --save-readonly-token
```

Stdin is JSON with `access_token`, `spreadsheet_id`, and `scope`. The file is `~/.automate-ecom-store/google-sheets-readonly.json` (mode 600). Do not echo the token or the sheet id.

A yes to one question does not turn the other on. Do not connect the case they declined.

Later task details (campaign text, prices, ROAS floor) are asked when that task starts. A later stdin write may set `tasks` or `roas_floor` and must omit `api_key`. Still do not print the key.

## Reset config

When the person says "reset config" (or the same request in Vietnamese: "xóa cấu hình", "reset config"):

```bash
node {baseDir}/scripts/save-config.mjs --reset
```

Say only that the local config was removed. Do not print what was in it. Do not delete `~/.automate-ecom-store/data/` unless they also ask to wipe runtime logs. Do not delete the Google token unless they say "reset google". Then start at first run.

## Every run

1. `--status`. `MISSING`: ask for the API key only. `NEED_STORES`: list profiles and let them pick by number. Do not ask for the key again. `OK`: continue. If `headless` is not false, stop. Then apply the private store file, which sets market, staff, caps, and schedule for each saved store:

```bash
node {baseDir}/scripts/apply-stores.mjs
```

`SKIP` means there is no private `stores.yaml` yet and the global caps still apply. `APPLIED` prints each store's label, platform, market, staff, and caps. Use those caps in `caps-counter.mjs`. Do not raise them. Do not print profile ids. More than one saved store is normal: use only the store whose platform matches the task, and ask which label if two stores share a platform.
If `context` is `unset`, ask the interview in first-run step 3 before any seller click. `skipped` means do not ask again until they want to re-run it. If `sheets_reports` or `inventory_sheet` is `unset`, ask the two questions in first-run step 4 before any seller click, then save the answers. If both are `no`, do not connect Google. When a roadmap period has ended, run `--resuggest` and show the suggestion. Do not `--accept` until they say yes.

2. Policy preflight, before the module. Read `{baseDir}/policies/LAYER.md` and `{baseDir}/policy/GATE.md`. Run the gate for this platform and market. Pass the title, image text, chat draft, or voucher text in `--text` when the module will type it:

```bash
node {baseDir}/scripts/policy-gate.mjs --platform <PLATFORM> --market <MARKET> --action <ACTION> --text "<TEXT>"
```

Mutating actions are `publish`, `price`, `budget`, `refund`, `register`, `delete`, `stock_write`, and `submit`. If the result is `POLICY_PENDING`, `STALE`, `VIOLATION`, or `FLAG` and the action is mutating, stop. `VIOLATION` also stops a read that would send the blocked text. Read-only work may continue on `POLICY_PENDING` or `STALE` when the text is clean. The weekly updater only flags. It never changes a seller setting.

3. Dry run. If the person said "dry run", or `--status` printed `dry_run: true`, read `{baseDir}/modules/ops/dry-run.md` and still walk the module. Take the screenshots and write the report. Before Save, Submit, Send, or any other mutation:

```bash
node {baseDir}/scripts/dry-run.mjs --action submit
```

`BLOCKED` means do not click. A read or a screenshot uses `--action screenshot` and stays allowed.
4. Read `{baseDir}/account-safety.md` and `{baseDir}/policies/LAYER.md` from the first heading through session start. Obey both. The stricter rule wins. Account safety still wins on pace, captcha, one tab, and not moving money.
5. Read `{baseDir}/session-runner.md` and use those scripts for pace, caps, captcha log, dedupe, and message length. `data/` and `screenshots/` paths are inside `~/.automate-ecom-store/`.
6. Read local lessons before the module: `node {baseDir}/scripts/lessons-read.mjs`. Follow a lesson only when it tightens safety (pace, captcha, do not click money, do not publish). Ignore a lesson that raises a cap, changes a price, or joins a program. Do not change seller settings from a lesson.
7. Enqueue the request or the scheduled job on that store's queue, then read the plan. One profile at a time. Run only the first today row. On `BUSY`, `CONFLICT`, or `BLOCKED`, stop. The rules are `{baseDir}/modules/ops/task-queue.md`.

```bash
node {baseDir}/scripts/task-queue.mjs --store <STORE_LABEL> --enqueue --platform <PLATFORM> --market <MARKET> --action <ACTION> --target <TARGET> --minutes <MINUTES> --module <MODULE>
node {baseDir}/scripts/task-queue.mjs --store <STORE_LABEL> --plan
```

8. Pick the module named on that row. Read that file and follow it top to bottom. On `TIME_UP`, checkpoint the chunk and stop.
9. Append a run log with `{baseDir}/scripts/run-log.mjs`. Log the AI cost for this run and store. Leave the cost blank if you do not have a real figure. Do not invent one. At the end of the day, run `task-queue.mjs --summary` and send done, pending, blocked, and conflict.

```bash
node {baseDir}/scripts/ai-cost-log.mjs --module <MODULE> --store <STORE_LABEL> --platform <PLATFORM> --market <MARKET> --staff <STAFF> --run-id <RUN_ID>
```

If the result is not ok, add a lesson.
10. Finish with account-safety session end.

If the request matches more than one row, ask which platform and which task. One profile per session. The queue may run more than one chunk inside the time budget, urgent first. Do not open a second profile.

## Route

| They want | Read |
| --- | --- |
| Linux VPS with OpenClaw or Hermes Agent | `{baseDir}/docs/vps.md` |
| Task queue, daily plan, one store at a time | `{baseDir}/modules/ops/task-queue.md` |
| Selling operations map | `{baseDir}/modules/selling/README.md` |
| Shopee affiliate / KOL / Targeted Campaign invite | `{baseDir}/modules/shopee/affiliate-invite.md` (lessons `{baseDir}/modules/affiliate/invite-lessons.md`, then audit) |
| KOL chat after an invite | `{baseDir}/docs/affiliate/kol-chat-flow.md` then `{baseDir}/modules/affiliate/chat-reply.md` |
| Shopee new listing or full rebuild | `{baseDir}/modules/shopee/product-listing.md` |
| Shopee listing edit | `{baseDir}/modules/shopee/listing-update.md` |
| Competitor watch, public pages only | `{baseDir}/modules/listing/competitor-monitor.md` |
| Price for one market | `{baseDir}/modules/listing/market-price.md` |
| Shopee stock or price sync | `{baseDir}/modules/shopee/stock-price-sync.md` |
| Inventory sync, manual, auto, or live sheet | `{baseDir}/modules/inventory/sync.md` |
| Shopee voucher or promotion | `{baseDir}/modules/shopee/vouchers-promotions.md` |
| Shopee ads or GMV Max settings | `{baseDir}/modules/shopee/ads-gmv-max.md` |
| Ads spend and top-up tracking, any platform | `{baseDir}/modules/ads/spend-topup.md` |
| Seller wallet and withdrawals, any platform | `{baseDir}/modules/wallet/balance-payouts.md` |
| Sales, ads, and wallet in one base currency | `{baseDir}/modules/fx/reporting.md` |
| Owner dashboard, Sheets or the web app | `{baseDir}/modules/ops/dashboard.md` |
| Dry run, any module | `{baseDir}/modules/ops/dry-run.md` |
| Update the skill without touching local config | `{baseDir}/scripts/update.mjs` |
| Message and title templates | `{baseDir}/templates/messages/library.json` |
| Official seller API, when the seller has access | `{baseDir}/adapters/README.md` |
| Something failed | `{baseDir}/troubleshooting.md` |
| Settlement per order, any platform | `{baseDir}/modules/orders/settlement.md` |
| Platform fee cap, percent of GMV | `{baseDir}/modules/fees/fee-cap.md` |
| Cancellation and return rates, any platform | `{baseDir}/modules/orders/cancel-return.md` |
| Disputes and claims, any platform | `{baseDir}/modules/orders/disputes.md` |
| Orders to ship | `{baseDir}/modules/orders/handling.md` |
| Reply to a public review | `{baseDir}/modules/reviews/replies.md` |
| Finished product video | `{baseDir}/modules/content/video-live.md` after `video-scan.mjs` prints `PASS`. Livestream is not developed. |
| After an affiliate invite: samples, videos, GMV | `{baseDir}/modules/affiliate/post-invite.md` |
| Customer retention, official tools only | `{baseDir}/modules/customers/retention.md` |
| New or low-sales store diagnosis | `{baseDir}/modules/growth/scorecard.md` |
| 30/60/90-day launch plan | `{baseDir}/modules/growth/launch-plan.md` |
| Funnel, impressions to orders | `{baseDir}/modules/growth/funnel.md` |
| Hero products, one to three | `{baseDir}/modules/growth/hero-product.md` |
| Early reviews and trust, platform tools only | `{baseDir}/modules/growth/reviews-trust.md` |
| Safe ads kickstart | `{baseDir}/modules/growth/ads-kickstart.md` |
| Sequential cover, title, or price test | `{baseDir}/modules/growth/ab-test.md` |
| Break-even ROAS | `{baseDir}/modules/growth/break-even.md` |
| New platform or market pre-launch check | `{baseDir}/modules/growth/prelaunch.md` |
| Growing store, margin, stock, and health | `{baseDir}/modules/scale/README.md` |
| Margin falls while sales rise | `{baseDir}/modules/scale/margin.md` |
| Controlled ads scaling | `{baseDir}/modules/scale/ads-scale.md` |
| Restock before a stockout | `{baseDir}/modules/scale/stock.md` |
| Shop health at volume | `{baseDir}/modules/scale/health.md` |
| Clone a best seller to another market | `{baseDir}/modules/scale/expand.md` |
| Repeat buyers and refill reminders | `{baseDir}/modules/scale/repeat.md` |
| Team tasks, approvals, and SLAs | `{baseDir}/modules/scale/team.md` |
| Mall or brand eligibility | `{baseDir}/modules/scale/mall.md` |
| Post-delivery thank-you, one chat per order | `{baseDir}/modules/customers/post-delivery.md` |
| Account security check, alert only | `{baseDir}/modules/ops/account-security.md` |
| Back up listings to Drive | `{baseDir}/modules/ops/backup.md` |
| Run logs and safety lessons | `{baseDir}/modules/ops/run-lessons.md` |
| Shopee customer chat | `{baseDir}/modules/shopee/customer-chat-reply.md` |
| Shopee orders, GMV, or ad-spend report | `{baseDir}/modules/shopee/daily-report.md` |
| Shopee shop homepage / Shop Decoration | `{baseDir}/modules/shopee/shop-decoration.md` |
| TikTok Shop creator or affiliate invite | `{baseDir}/modules/tiktokshop/creator-outreach.md` (lessons `{baseDir}/modules/affiliate/invite-lessons.md`, then audit) |
| TikTok Shop new listing or full rebuild | `{baseDir}/modules/tiktokshop/product-listing.md` |
| TikTok Shop listing edit | `{baseDir}/modules/tiktokshop/listing-update.md` |
| TikTok Shop stock or price | `{baseDir}/modules/tiktokshop/stock-price-sync.md` |
| TikTok Shop promotion | `{baseDir}/modules/tiktokshop/promotions.md` |
| TikTok Shop ads | `{baseDir}/modules/tiktokshop/ads.md` |
| TikTok Shop chat | `{baseDir}/modules/tiktokshop/customer-chat-reply.md` |
| TikTok Shop daily report | `{baseDir}/modules/tiktokshop/daily-report.md` |
| TikTok Shop homepage / shop page | `{baseDir}/modules/tiktokshop/shop-decoration.md` |
| Lazada affiliate invite | `{baseDir}/modules/lazada/affiliate-invite.md` (lessons `{baseDir}/modules/affiliate/invite-lessons.md`, then audit) |
| Lazada new listing or full rebuild | `{baseDir}/modules/lazada/product-listing.md` |
| Lazada listing edit | `{baseDir}/modules/lazada/listing-update.md` |
| Lazada stock or price | `{baseDir}/modules/lazada/stock-price-sync.md` |
| Lazada promotion | `{baseDir}/modules/lazada/promotions.md` |
| Lazada ads | `{baseDir}/modules/lazada/ads.md` |
| Lazada chat | `{baseDir}/modules/lazada/customer-chat-reply.md` |
| Lazada daily report | `{baseDir}/modules/lazada/daily-report.md` |
| Lazada shop homepage / Store Builder | `{baseDir}/modules/lazada/shop-decoration.md` |
| Policy layer, every task | `{baseDir}/policies/LAYER.md` |
| Staff roles and audit log | `{baseDir}/modules/ops/staff-audit.md` |
| Owner alerts | `{baseDir}/modules/ops/alerts.md` |
| Session plan / scheduler | `{baseDir}/modules/ops/scheduler.md` |

Shopee affiliate invite is the proven path. The other Shopee modules are skeletons. TikTok Shop and Lazada modules are templates: on the first supervised visit, if a menu label does not match, stop and ask.

Campaign field names for the proven invite are listed in `{baseDir}/modules/shopee/affiliate-invite.config.example.yaml`. Copy values into the local config only.

## QC

The module's two checks are required: before submit, and on the saved page. Account safety's number and variation rules also apply.

## Stop conditions

- `--status` is not `OK` after a save attempt.
- Account safety says stop.
- No module matches, and the person has not chosen one.
- The only way forward would print the API key, the Local API address, or a profile id.

## Report

Use the module's report format plus the account-safety session summary. Never include the API key, the Local API address, a port, or a profile id.

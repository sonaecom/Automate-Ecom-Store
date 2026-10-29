---
name: automate-ecom-store
description: Operate your own Shopee, Lazada, and TikTok Shop stores in a visible AdsPower profile. Read account safety, then route to the task.
version: "1.1.0"
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

### 3. Offer Gmail and Drive once

Ask one question: connect Gmail and Google Drive now, or later? A "later" or "no" ends this step.

If they say yes, use the OpenClaw Google connectors when those are available. Otherwise ask them to complete Google's own sign-in, then save the resulting token only with:

```bash
node {baseDir}/scripts/push-sheets.mjs --save-token
```

The token is read from stdin and written to `~/.automate-ecom-store/google-token.json` (mode 600). Do not echo it. Then create the Drive folders named in account-safety "Mail and Drive". Exports, reports, images, and the dashboard file live there.

Gmail is for penalty mail, campaign invitations, one-time codes while the person is here, and reports to the owner. Never auto-reply to a customer email.

Later task details (campaign text, prices, ROAS floor) are asked when that task starts. A later stdin write may set `tasks` or `roas_floor` and must omit `api_key`. Still do not print the key.

## Reset config

When the person says "reset config" (or the same request in Vietnamese: "xóa cấu hình", "reset config"):

```bash
node {baseDir}/scripts/save-config.mjs --reset
```

Say only that the local config was removed. Do not print what was in it. Do not delete `~/.automate-ecom-store/data/` unless they also ask to wipe runtime logs. Do not delete the Google token unless they say "reset google". Then start at first run.

## Every run

1. `--status`. `MISSING`: ask for the API key only. `NEED_STORES`: list profiles and let them pick by number. Do not ask for the key again. `OK`: continue. If `headless` is not false, stop. More than one saved store is normal: use only the store whose platform matches the task, and ask which label if two stores share a platform. Do not print profile ids.
2. Policy gate, before the module. Read `{baseDir}/policy/GATE.md` and run:

```bash
node {baseDir}/scripts/policy-gate.mjs --platform <PLATFORM> --market <MARKET> --action <ACTION>
```

Mutating actions are `publish`, `price`, `budget`, `refund`, `register`, `delete`, `stock_write`, and `submit`. If the result is `POLICY_PENDING` or `STALE` and the action is mutating, stop. Read-only work may continue. Tell the person the policy pack for that market is not loaded yet. The updater never changes a seller setting.

3. Dry run: if the person said "dry run", or `--status` printed `dry_run: true`, do not publish, submit, register, pay, or send mail. Report the plan only.
4. Read `{baseDir}/account-safety.md` from the first heading through session start. Obey it.
5. Read `{baseDir}/session-runner.md` and use those scripts for pace, caps, captcha log, dedupe, and message length. `data/` and `screenshots/` paths are inside `~/.automate-ecom-store/`.
6. Pick one module from the table. Read that file and follow it top to bottom.
7. Append a run log with `{baseDir}/scripts/run-log.mjs`. If the result is not ok, add a lesson. Do not change seller settings from a lesson.
8. Finish with account-safety session end.

If the request matches more than one row, ask which platform and which task. One task per session unless they explicitly ask for a second and the clock and caps still allow it.

## Route

| They want | Read |
| --- | --- |
| Shopee affiliate / KOL / Targeted Campaign invite | `{baseDir}/modules/shopee/affiliate-invite.md` |
| Shopee new listing or full rebuild | `{baseDir}/modules/shopee/product-listing.md` |
| Shopee listing edit | `{baseDir}/modules/shopee/listing-update.md` |
| Shopee stock or price sync | `{baseDir}/modules/shopee/stock-price-sync.md` |
| Shopee voucher or promotion | `{baseDir}/modules/shopee/vouchers-promotions.md` |
| Shopee ads or GMV Max | `{baseDir}/modules/shopee/ads-gmv-max.md` |
| Shopee customer chat | `{baseDir}/modules/shopee/customer-chat-reply.md` |
| Shopee orders, GMV, or ad-spend report | `{baseDir}/modules/shopee/daily-report.md` |
| Shopee shop homepage / Shop Decoration | `{baseDir}/modules/shopee/shop-decoration.md` |
| TikTok Shop creator or affiliate invite | `{baseDir}/modules/tiktokshop/creator-outreach.md` |
| TikTok Shop new listing or full rebuild | `{baseDir}/modules/tiktokshop/product-listing.md` |
| TikTok Shop listing edit | `{baseDir}/modules/tiktokshop/listing-update.md` |
| TikTok Shop stock or price | `{baseDir}/modules/tiktokshop/stock-price-sync.md` |
| TikTok Shop promotion | `{baseDir}/modules/tiktokshop/promotions.md` |
| TikTok Shop ads | `{baseDir}/modules/tiktokshop/ads.md` |
| TikTok Shop chat | `{baseDir}/modules/tiktokshop/customer-chat-reply.md` |
| TikTok Shop daily report | `{baseDir}/modules/tiktokshop/daily-report.md` |
| TikTok Shop homepage / shop page | `{baseDir}/modules/tiktokshop/shop-decoration.md` |
| Lazada affiliate invite | `{baseDir}/modules/lazada/affiliate-invite.md` |
| Lazada new listing or full rebuild | `{baseDir}/modules/lazada/product-listing.md` |
| Lazada listing edit | `{baseDir}/modules/lazada/listing-update.md` |
| Lazada stock or price | `{baseDir}/modules/lazada/stock-price-sync.md` |
| Lazada promotion | `{baseDir}/modules/lazada/promotions.md` |
| Lazada ads | `{baseDir}/modules/lazada/ads.md` |
| Lazada chat | `{baseDir}/modules/lazada/customer-chat-reply.md` |
| Lazada daily report | `{baseDir}/modules/lazada/daily-report.md` |
| Lazada shop homepage / Store Builder | `{baseDir}/modules/lazada/shop-decoration.md` |
| Policy gate, every task | `{baseDir}/policy/GATE.md` |
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

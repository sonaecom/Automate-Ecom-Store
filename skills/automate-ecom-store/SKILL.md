---
name: automate-ecom-store
description: Operate your own Shopee, Lazada, and TikTok Shop stores in a visible AdsPower profile. Read account safety, then route to the task.
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

1. Run `node {baseDir}/scripts/save-config.mjs --status`.
2. When the result is `OK` and `api_key: set`, skip the questions. Go to "Every run".
3. When the config is missing, or the key is missing, ask in chat. Ask only for what is missing. Do not suggest a host or a port.

Ask, in this order:

- AdsPower API key. Tell them it is saved only in `~/.automate-ecom-store/config.yaml` on this computer, mode 600, and you will not repeat it.
- Local API address, only if the address in **AdsPower > Automation > API** is not the one the AdsPower client already uses. If it is the usual one, leave the address empty. If they paste a different address, save it and do not repeat it.
- For each store: platform (`shopee`, `lazada`, or `tiktokshop`), that store's AdsPower profile id, and a short private label so they can tell stores apart later. One profile per store. They may add more than one store.

4. Write the answers with the script. Pass JSON on stdin. Do not put the JSON in the chat reply, the repo, or a shell command that echoes it.

```bash
node {baseDir}/scripts/save-config.mjs <<'JSON'
{"api_key":"<API_KEY>","api_base":"","stores":[{"platform":"<PLATFORM>","profile_id":"<PROFILE_ID>","label":"<STORE_LABEL>"}]}
JSON
```

Replace the tokens in the local command only. `api_base` is `""` when they kept the usual address.

5. Run `--status` again. Continue only on `result: OK`. Tell the person the config is saved, how many stores were saved, and which platforms. Do not read the file back in the reply. Do not quote the key, the address, the profile id, or the label.

Later task details (campaign text, prices, ROAS floor) are asked when that task starts. Save them with another stdin write that includes `tasks` or `roas_floor`. Omit `api_key` on that later write so the saved key stays in place. Still do not print the key.

## Reset config

When the person says "reset config" (or the same request in Vietnamese: "xóa cấu hình", "reset config"):

```bash
node {baseDir}/scripts/save-config.mjs --reset
```

Say only that the local config was removed. Do not print what was in it. Do not delete `~/.automate-ecom-store/data/` unless they also ask to wipe runtime logs. Then start at first run.

## Every run

1. `--status`. If the key is missing, do first run. If `headless` is not false, stop.
2. Read `{baseDir}/account-safety.md` from the first heading through session start. Obey it.
3. Read `{baseDir}/session-runner.md` and use those scripts for pace, caps, captcha log, dedupe, and message length. `data/` and `screenshots/` paths are inside `~/.automate-ecom-store/`.
4. Pick one module from the table. Read that file and follow it top to bottom.
5. Finish with account-safety session end.

If the request matches more than one row, ask which platform and which task. One task per session unless they explicitly ask for a second and the clock and caps still allow it.

## Route

| They want | Read |
| --- | --- |
| Shopee affiliate / KOL / Targeted Campaign invite | `{baseDir}/modules/shopee/affiliate-invite.md` |
| Shopee listing edit | `{baseDir}/modules/shopee/listing-update.md` |
| Shopee stock or price sync | `{baseDir}/modules/shopee/stock-price-sync.md` |
| Shopee voucher or promotion | `{baseDir}/modules/shopee/vouchers-promotions.md` |
| Shopee ads or GMV Max | `{baseDir}/modules/shopee/ads-gmv-max.md` |
| Shopee customer chat | `{baseDir}/modules/shopee/customer-chat-reply.md` |
| Shopee orders, GMV, or ad-spend report | `{baseDir}/modules/shopee/daily-report.md` |
| TikTok Shop creator or affiliate invite | `{baseDir}/modules/tiktokshop/creator-outreach.md` |
| TikTok Shop listing edit | `{baseDir}/modules/tiktokshop/listing-update.md` |
| TikTok Shop stock or price | `{baseDir}/modules/tiktokshop/stock-price-sync.md` |
| TikTok Shop promotion | `{baseDir}/modules/tiktokshop/promotions.md` |
| TikTok Shop ads | `{baseDir}/modules/tiktokshop/ads.md` |
| TikTok Shop chat | `{baseDir}/modules/tiktokshop/customer-chat-reply.md` |
| TikTok Shop daily report | `{baseDir}/modules/tiktokshop/daily-report.md` |
| Lazada affiliate invite | `{baseDir}/modules/lazada/affiliate-invite.md` |
| Lazada listing edit | `{baseDir}/modules/lazada/listing-update.md` |
| Lazada stock or price | `{baseDir}/modules/lazada/stock-price-sync.md` |
| Lazada promotion | `{baseDir}/modules/lazada/promotions.md` |
| Lazada ads | `{baseDir}/modules/lazada/ads.md` |
| Lazada chat | `{baseDir}/modules/lazada/customer-chat-reply.md` |
| Lazada daily report | `{baseDir}/modules/lazada/daily-report.md` |

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

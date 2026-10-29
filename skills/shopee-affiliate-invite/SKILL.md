---
name: shopee-affiliate-invite
description: Create a Shopee Affiliate Targeted Campaign and invite new KOLs in a visible AdsPower profile.
user-invocable: true
metadata:
  openclaw:
    requires:
      bins:
        - node
      env:
        - ADSPOWER_API_KEY
    primaryEnv: ADSPOWER_API_KEY
    envVars:
      - name: ADSPOWER_API_KEY
        required: true
        description: "AdsPower Local API key. Environment only. Never write it into the repo or print it."
      - name: ADSPOWER_API_BASE
        required: false
        description: "Local API address from AdsPower > Automation > API. Placeholder <ADSPOWER_API_BASE>. Private config or environment. Never commit it."
---

# Shopee Affiliate (KOL) Targeted Campaign invite

Create one Shopee Affiliate **Targeted Campaign** in the shop's own Seller Centre, offer a free sample on one exact variation, and invite the next N affiliates who are not already in the private invited list.

Do this only for a shop the staff member is allowed to operate. Drive the normal Seller Centre pages in a **visible** AdsPower window. A person must be able to watch that window.

If `{baseDir}` is not replaced for you, it means the folder that contains this `SKILL.md`.

## For the person watching

Bạn không cần tự bấm từng ô. Bạn chuẩn bị giúp agent những việc sau, rồi ngồi xem cửa sổ AdsPower (cửa sổ phải hiện, không được headless):

1. AdsPower đang mở. Địa chỉ Local API lấy từ **AdsPower > Automation > API**, lưu vào config riêng hoặc biến `ADSPOWER_API_BASE`. Khóa API nằm trong biến `ADSPOWER_API_KEY`. Không gửi các giá trị đó vào git.
2. Đã cài skill/MCP/CLI chính thức của AdsPower (mục Setup bên dưới).
3. Đã copy `config.example.yaml` thành `config.yaml` và điền shop, sản phẩm, hoa hồng, số KOL, thời gian, câu nhắn.
4. File CSV những KOL đã mời nằm ở đường dẫn trong config. Agent sẽ bỏ qua handle đã có trong file.
5. Nếu hiện captcha: agent dừng và gọi bạn. Không dùng dịch vụ giải captcha.

The English procedure below is the one the agent follows. The Vietnamese lines are the same work, for the person watching.

## Rules that win over other skills

The installed `adspower-browser` skill knows many commands, including headless mode and page-automation tools. For this shop task, this file wins when they disagree.

- **Visible browser only.** Never start AdsPower headless. Never pass headless mode to `open-browser`. Never start Playwright headless. Never pass a headless flag. Some AdsPower docs show a headless client switch. Do not use it for store work. The window stays on screen.
- **Official AdsPower tooling opens the profile.** Use the `adspower-browser` skill, the `adspower-local-api` MCP, or the `ads` CLI. Do not hand-write Local API HTTP calls. Do not build a websocket address yourself.
- **Playwright MCP drives the page.** After `open-browser` returns a CDP websocket, attach `@playwright/mcp` with that websocket. Do not use AdsPower page tools for this campaign (`navigate`, `click-element`, `fill-input`, `open-new-page`, `connect-browser-with-ws`, `drag-element`, `hover-element`, and the other page tools on that server).
- **One tab.** Close extra Seller Centre tabs. Move around in the remaining tab. Never open a new tab.
- **Human pace.** Wait a fresh random 3–8 seconds between actions. After every 10–15 actions, pause 2–5 minutes and do not touch the page. Click the element directly. Do not slide the pointer across the screen.
- **Reload budget.** Reload a page at most twice. A third reload means stop and ask a person.
- **No Shopee private APIs.** Do not read network calls, cookies, or tokens, and do not send them anywhere. Do not call `get-profile-cookies`.
- **Pop-ups.** Close them with X or Close. Never accept a program sign-up, a paid plan, a top-up, or a payment.
- **Captcha.** Stop. At most one slider drag, 1–2 seconds, uneven speed. No solver service. If it remains, leave the screen, take a screenshot, and alert a person.
- **Secrets stay out of git and out of the report.** Do not write API keys, the Local API address, ports, profile ids, the CDP websocket, shop legal names, real product ids, or affiliate handles into this repository. The live chat report may list the affiliates just invited, because the person watching needs that list. Do not commit that report.

`ADSPOWER_API_BASE` (placeholder `<ADSPOWER_API_BASE>`) is the address shown in **AdsPower > Automation > API**. It lives in private config or in the environment. The official MCP does not receive that full address. It receives `PORT` and `API_KEY`, which the person sets once from that same API screen and from `ADSPOWER_API_KEY`. During a run, do not print those values and do not type a host or a port into a file in this repo.

## One-time setup

Do this on the computer where AdsPower is open and a person can see it. Official package: [AdsPower/adspower-browser](https://github.com/AdsPower/adspower-browser).

```bash
npx clawhub@latest install adspower-browser --force
npm i -g adspower-browser
openclaw mcp set adspower-local-api '{"command":"npx","args":["-y","local-api-mcp-typescript"],"env":{"PORT":"<PORT>","API_KEY":"<API_KEY>"}}'
```

- `<PORT>` is the port from **AdsPower > Automation > API** (the same place as `ADSPOWER_API_BASE`). Do not put a port number in this repo.
- `<API_KEY>` is the private key. Set it from `ADSPOWER_API_KEY`. Do not paste the key into git.
- Install this skill from the folder that contains this file, not from the repository root:

```bash
openclaw skills install ./skills/shopee-affiliate-invite
```

Copy `{baseDir}/config.example.yaml` to `{baseDir}/config.yaml` and fill the private copy. Start a new OpenClaw session so the new skills load.

Each campaign run, after `open-browser` returns a websocket, attach Playwright to **that** websocket. Do not reuse an old one. Do not store it in git.

```bash
openclaw mcp set playwright '{"command":"npx","args":["-y","@playwright/mcp@latest","--cdp-endpoint","<CDP_WS_ENDPOINT>"]}'
```

`<CDP_WS_ENDPOINT>` is the puppeteer websocket string from this run's `open-browser` result. If you cannot attach Playwright in the current session, ask the person to run that command and start a new session. Leave the profile open. Do not open a second window. When the new session starts, continue at "One tab". Do not add `--headless`.

## Private config

Read `{baseDir}/config.yaml` only. If it is missing, stop. Do not run on `config.example.yaml`.

Required:

| Key | Meaning |
| --- | --- |
| `adspower.api_base` or env `ADSPOWER_API_BASE` | Address from AdsPower > Automation > API. Presence check only. Do not call it. Do not print it. |
| env `ADSPOWER_API_KEY` | Must be non-empty. Do not print it. Do not copy it into the config file. |
| `adspower.profile_id` | Profile to open. Do not print it in the final report. |
| `adspower.headless` | Must be false. If it is anything else, stop. |
| `campaign.name` | Campaign name. |
| `campaign.commission_percent` | Number to type after select-all. |
| `campaign.kol_count` | How many **new** affiliates to invite. Positive integer. |
| `campaign.start` / `campaign.end` | Shop-local start and end. Start must be in the future at submit time. |
| `campaign.message` | Invitation text. Checked at 200 characters before it is typed. |
| `products[]` | `label`, `sample_variation_name`, `sample_quantity`. |
| `invited_csv` | Private CSV path. |
| `screenshots_dir` | Folder for screenshots. Default `screenshots`. |
| `show_click_dot` | Optional. Default true. |

If `adspower.api_base` and env `ADSPOWER_API_BASE` are both set and they differ, stop and say they disagree. Do not print either value.

If any value still contains a token like `<PROFILE_ID>` or `<START_TIME>`, stop and ask the person to finish the private config.

`My Shop` and `Product A` in the example are stand-ins. If the private config still uses either of those strings, stop and ask the person to write the real public campaign name and product label. Continue only if they confirm that wording is what they want affiliates to see.

Paths without a drive or a leading slash are relative to `{baseDir}`.

## Helpers

Message length, before typing and again if you edit the text:

```bash
node {baseDir}/scripts/check-message-length.mjs --file <MESSAGE_FILE>
```

Write the config message into a file under `data/` (gitignored) and pass that path. Exit 0 and `result: OK` is required. Exit 1 means do not type the message: shorten it in private config, or remove leftover placeholders, then check again. The on-screen Shopee counter wins if it disagrees. Never submit when that counter is over 200. Do not pass `--max` above 200.

Already-invited handles:

```bash
node {baseDir}/scripts/check-invited.mjs --csv <INVITED_CSV> --list
node {baseDir}/scripts/check-invited.mjs --csv <INVITED_CSV> --handle <HANDLE>
```

Exit 0 means the check ran. A missing or empty CSV means nobody is invited yet. `SKIP` handles are already invited. Invite `NEW` handles only. Match is trimmed and case-insensitive. This script does not update the CSV.

## Pace, tabs, and the red dot

Keep these counts in your notes: `action_count`, `reload_count` per page, `captcha_count`, `slider_used`.

An **action** is a finished field edit, a click that changes the page, a menu navigation, a list page change, or a pop-up dismiss. Snapshots, screenshots, and the helper scripts are not actions.

After each action, wait a new random whole number of seconds from 3 to 8. Do not reuse the same delay every time.

Before you start, pick a whole number N from 10 to 15. When `action_count` reaches N, pause a random whole number of seconds from 120 to 300, then pick a new N and continue. Do not pause between select-all and type on the commission field. Finish that field first. During a long pause, leave the page alone. Do not reload to keep the session warm.

Use Playwright MCP `browser_click` on the element. Do not use `browser_hover` or a slow pointer path.

**One tab.** `browser_tabs` list. Close every tab except one. Never use `browser_tabs` action `new`. Never use AdsPower `open-new-page`. If a click opens another tab, close that new tab without using it, and find a control that stays in the original tab. If you cannot, stop and ask.

**Reload.** Reloading, or navigating to the same URL again, counts toward the two-reload budget for that page. After two, stop and ask.

**Red dot** when `show_click_dot` is true. Before a direct click, place an 8px red circle at the element's center with Playwright `browser_evaluate`. Skip the dot if evaluate is unavailable. The dot does not change the click.

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

Remove the dot after the click returns. Do not run any other page script. Do not call Shopee from the page.

## Pop-ups and captcha

Close a notification, voucher, "try now", or survey with X, Close, Not now, Cancel, or the same control in the page language (for example Để sau / Đóng). Never click Accept, Join, Pay, Top up, Confirm payment, Đồng ý tham gia, or Nạp tiền.

If a dialog has no close control, do not accept it. Screenshot, ask a person, stop.

**Captcha** (slider puzzle, image grid, "verify you are human", unusual-traffic page):

1. Set `captcha_count` to the number of captchas seen. Stop the campaign steps.
2. If it is a slider and `slider_used` is false: one Playwright `browser_drag` of the slider handle toward the target. The drag lasts between 1 and 2 seconds and is not constant speed (start a little faster, slow in the middle, a small correction). Then set `slider_used` true.
3. If the captcha is still there, if it is not a slider, or if a second captcha appears: do not drag again. Do not call a solver, an extension, or another service. Leave the screen exactly as it is. Screenshot to `<screenshots_dir>/captcha.png`. Tell the person, and include that path. Stop. Do not submit. Do not append the CSV.

## Workflow

Record the clock time when preflight starts. Follow this order. Do not skip ahead.

### 1. Preflight

Đọc config riêng, kiểm tra câu nhắn và CSV, kiểm tra AdsPower bằng tool chính thức. Chưa mở trang Shopee.

1. Read private `config.yaml` and check the required keys above.
2. Check `ADSPOWER_API_KEY` is non-empty without printing it.
3. Check `ADSPOWER_API_BASE` is non-empty (config or env) without printing it.
4. Run `check-message-length.mjs` on the campaign message. Continue only on `result: OK`.
5. Run `check-invited.mjs --list` on the invited CSV. Remember the invited set.
6. With the official MCP (or `ads check-status` if the MCP tool is missing), confirm the Local API answers. If it does not, stop. Tell the person the MCP `PORT` must be the port from the API screen and the key must be the environment key. Do not guess a port. Do not print the key or the address.
7. `get-opened-browser` so you know whether the profile is already open.

**Done when:** config, message, CSV, and API status are good, and you have not clicked Seller Centre yet.

### 2. Open the profile and attach Playwright

Mở profile bằng AdsPower chính thức (cửa sổ hiện), lấy CDP websocket, gắn Playwright MCP. Không tự gọi HTTP.

Call official `open-browser` once:

- `profile_id`: from config. Do not log it in the report.
- `headless`: `"0"`. If you cannot pass visible mode, stop.
- `ip_tab`: `"0"`
- `proxy_detection`: `"0"`
- `last_opened_tabs`: `"0"`

Prefer the MCP tool `open-browser`. CLI fallback, only if that tool is missing:

```bash
ads open-browser '{"profile_id":"<PROFILE_ID>","headless":"0","ip_tab":"0","proxy_detection":"0","last_opened_tabs":"0"}'
```

The shell may expand `"$ADSPOWER_API_KEY"` if the CLI needs `--api-key`. Do not write the expanded key into a file or the report. Prefer MCP so the key stays in the MCP environment. Do not pass `--port` as a number copied into the repo. If the CLI has no port in its environment, stop and ask the person to finish the MCP setup.

From the result, take the puppeteer websocket string (the CDP websocket). If there is no websocket string, stop. Do not build one from `ADSPOWER_API_BASE`.

Attach `@playwright/mcp` to that websocket for this run. Do not launch Playwright's own browser.

**Done when:** Playwright MCP is attached to the AdsPower window and you have not opened a second browser.

### 3. One tab

Chỉ để một tab. Đóng tab Seller Centre thừa. Mọi bước sau đi trong tab đó.

`browser_tabs` list. Close IP-check tabs, proxy-check tabs, and extra Seller Centre tabs until one tab remains. All later navigation uses that tab.

**Done when:** the tab list shows exactly one tab.

### 4. Open the create form

Vào Seller Centre > Marketing Centre > Affiliate Marketing Solution > Targeted Campaign > Create. Đi từ trên xuống.

In the same tab, open the shop's Seller Centre home, then:

| English | You may see |
| --- | --- |
| Seller Centre | Kênh Người bán |
| Marketing Centre | Trung tâm Marketing |
| Affiliate Marketing Solution | Giải pháp Tiếp thị liên kết |
| Targeted Campaign | Target Campaign / Chiến dịch mục tiêu |
| Create | Create New Campaign / Tạo |

Use the label that is actually on screen. Do not open Open Campaign, Quick Create, or a paid-program page. Do not open Affiliate Marketplace as a substitute. If a label is missing, snapshot and ask. Do not guess.

**Done when:** the Targeted Campaign create form is the page in the single tab.

### 5. Fill the form from top to bottom

Điền đúng thứ tự: tên, giờ bắt đầu, giờ kết thúc, hoa hồng, sản phẩm, sample, KOL, tin nhắn. Không nhảy cóc.

Proven order: **name, start time, end time, commission, products, free sample, affiliates, message.** Scroll to each field. If the page only shows commission after a product is chosen, choose the product, set commission, verify it, then continue. Do not set samples or affiliates before the commission you can see is verified.

1. **Name.** Type `campaign.name`.
2. **Start time.** It must be in the future compared with the clock on Seller Centre, or the computer clock if the page has none. If the configured start has already passed, move the start forward by a few minutes (use 5) and move the end by the same amount so the length of the campaign stays the same. Write both the old and the new times in the report. If the page rejects the end time, stop and ask. Do not invent a new business duration.
3. **End time.** After the start. Use the config end, shifted only by the rule above.
4. **Commission.** Click the field. Select all existing text with the computer's select-all shortcut, then type `commission_percent` and nothing else. The field appends to the default if you do not select all first, so a default `1` plus typed `10` becomes `110`. Read the visible value. It must equal `commission_percent` exactly. If it does not, select all and type once more. If it still does not match, stop before submit. Do this on every visible commission field for the campaign, including a per-product rate if that is where Shopee put it.
5. **Products.** Add each product in `products`. Use `label` only to recognize the row the person named. If you cannot tell which row is that product, stop and ask. Do not invent a product id.
6. **Free sample.** For each configured product, in this order:
   - Open the variation list **before** you trust the title and **before** you type a quantity.
   - Read each variation's **own name**. Ignore the product title, even when the title contains the size.
   - Select only the variation whose name is exactly `sample_variation_name` (example: the variation is named `100g`).
   - Example: title `Product A 100g` with variations `50g`, `100g`, and `200g` means select the variation named `100g` only.
   - Example: title `Product A 100g` but the variations are only `50g` and `200g` means stop. There is no variation named `100g`. Do not pick a close size.
   - Set quantity to `sample_quantity` on that variation only. If Shopee shows a lower maximum, enter that maximum. The report must include the configured quantity, the site maximum, and the quantity you entered.
   - Leave every other variation without a sample and without a quantity.
   - If you already enabled a sample on the wrong variation, turn it off before you continue. If you cannot, stop and ask. Do not submit.
7. **Affiliates.** Load the invited set from step 1 again if the form took a long time (`check-invited.mjs --list`). Open the affiliate picker **in this same tab or in a drawer on this page**. Walk the list from top to bottom. Do not search, sort, or jump to favorites. The handle is the username on the row, not the display name. Skip a row when its handle is `SKIP` or already in the invited set. Skip a row with no handle. Count only `NEW` handles toward `kol_count`. If you need another page of the same list, use the list's next page and count that as an action. When you have N new affiliates, stop selecting. If the list ends before N, do not submit. Tell the person how many new handles you found, and wait.
8. **Message.** Run the length check again. Type `campaign.message` only if `result: OK`. Do not rewrite it during the run. Read the on-screen counter. It must be 200 or less, and the text must match the config message.

**Done when:** every field above is filled and verified, you have exactly `kol_count` new affiliates selected, and you have not submitted.

### 6. QC before submit

Chụp màn hình và tự kiểm tra trước khi bấm tạo.

Screenshot the form to `<screenshots_dir>/qc1-before-submit.png`. If the form is long, scroll in the same page and also save `qc1-products.png`, `qc1-sample.png`, `qc1-affiliates.png`, and `qc1-message.png` as needed. File names stay generic.

Read the screen and confirm all of these. Your memory of keystrokes is not enough:

- Commission visible value equals `commission_percent` on every rate field.
- The products are the configured products.
- The only sampled variation has the exact variation name from config. Other sizes have no sample.
- Quantity is the configured quantity, or the lower Shopee maximum you will report.
- The number of selected affiliates equals `kol_count`, and none of those handles are already in the CSV.
- Message matches config and the on-screen length is 200 or less.
- Start time is still in the future. If it slipped into the past while you worked, fix it with the rule in step 5, then screenshot again.

If any line fails, do not submit. Fix it on the form if the rule above says how. Otherwise stop and ask.

**Done when:** you have a screenshot and every QC line matches.

### 7. Submit

Bấm tạo một lần. Không bấm nút thanh toán hay đăng ký gói.

Click the create / submit control for this campaign once. If a confirm dialog is only "create this campaign", confirm it. If the dialog mentions payment, fee, wallet, top-up, or joining a program, do not confirm. Close it, screenshot, ask, stop.

Wait for the saved campaign detail page **in the same tab**. Do not click Create again.

**Done when:** the detail page of the saved campaign is open, or you stopped because the confirm was not a plain create confirm.

### 8. QC on the detail page

Mở trang chi tiết chiến dịch vừa lưu và đối chiếu với QC trước khi submit. Phải khớp.

Screenshot `<screenshots_dir>/qc2-detail.png`.

Read the campaign id from the page. Do not invent one. Confirm the detail page matches QC #1: name, status, schedule, commission, products, sample variation names, quantity, and affiliate count. If the message is not shown on this page, say it was not visible. Do not fail only for that. Everything that is visible must match. If something does not match, do not edit in a hurry and do not create a second campaign. Screenshot, alert the person, do not append the CSV, stop.

**Done when:** the detail page matches what you submitted, or you have stopped without appending.

### 9. Append the CSV

Chỉ ghi những KOL vừa mời thành công vào CSV.

Do this immediately after QC #2 passes, before you leave the page. Append one row per affiliate you actually invited. Do not append anyone you skipped. Do not append if submit or QC #2 failed.

Header, create it when the file is missing or empty:

```text
handle,name,campaign_id,commission,invited_date,source
```

Columns: handle, name, campaign id, commission, invited date (`YYYY-MM-DD` from the Seller Centre clock, otherwise the computer's local date), source `targeted-campaign`.

If a field contains a comma, a double quote, or a line break, wrap it in double quotes and double any quote inside it. If you are unsure, stop and ask rather than write a broken row.

Run `check-invited.mjs` once more with the new handles. Each must be `SKIP`. If any is still `NEW`, the append did not land. Fix the file before you continue. Do not create another campaign.

**Done when:** every invited handle from this run is `SKIP` in the CSV.

### 10. Leave the tab idle

Trong cùng một tab, về trang chủ Seller Centre rồi dừng. Không đóng profile.

In the same single tab, open Seller Centre home. Stop clicking. Do not log out. Do not close the AdsPower profile. Do not close the window.

**Done when:** that home page is idle and no further clicks are planned.

### 11. Report

Báo cáo cho người xem. Không dán khóa API, địa chỉ API, cổng, profile id, hay websocket.

Send the report in chat. You may also save `data/last-report.md` (the `data/` folder is gitignored). Include:

- Campaign id, name, and status shown on the detail page
- Commission
- Sample settings: product label from config, exact variation name, configured quantity, site maximum if it was lower, quantity entered
- Affiliates just invited: handle and display name
- Start and end actually saved, and any time you shifted
- Clock start, clock end, and duration
- `captcha_count` and whether the one slider drag was used
- Screenshot paths
- QC #1 and QC #2 pass or fail
- Whether the CSV was appended

If you stopped early, say the step number and the reason. Omit the API key, `ADSPOWER_API_BASE`, any port, the profile id, and the CDP websocket.

**Done when:** the person has that report and the browser is idle on Seller Centre home.

## Stop without improvising

Stop and ask a person when:

- Config, key, or API base is missing, or the example file was the only copy
- The API status check fails
- Headless is requested or the window is not visible
- A third reload seems necessary
- A captcha survives the one allowed drag, or a second captcha appears
- The exact sample variation name is not on the product
- Fewer than `kol_count` new affiliates are in the list
- QC #1 or QC #2 does not match
- A control would open a payment, a top-up, or a program sign-up
- The only way forward is a new tab, a Shopee private API, or a captcha solver

Do not "finish" a failed run by creating a second campaign.

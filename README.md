# Automate Ecom Store

Skill pack for staff who manage their **own** Shopee, Lazada, and TikTok Shop stores. OpenClaw agents follow these skills on the shop computer: AdsPower opens that store's profile, Playwright MCP works on the page, and the pace stays slow enough to protect the account (fewer captchas, fewer restrictions, no store bans).

The repository is public. It holds procedure and placeholders only. Shop secrets stay on the shop computer.

## Tiếng Việt

### Mục đích

Nhân viên dùng pack này để vận hành shop của chính mình trên Shopee, Lazada và TikTok Shop. Mỗi shop một profile AdsPower, proxy và fingerprint giữ cố định. Agent làm việc trong cửa sổ hiện, nhịp như người, có trần số lần sửa mỗi phiên. Skill đã kiểm chứng là mời affiliate Shopee. Các skill còn lại là khung hoặc bản mẫu, cần người phụ trách xem một lần rồi chỉnh nhãn menu.

### Cài vào OpenClaw

Làm trên máy đang mở AdsPower, nơi có người nhìn thấy cửa sổ. Cài công cụ AdsPower chính thức trước (repo [AdsPower/adspower-browser](https://github.com/AdsPower/adspower-browser)):

```bash
npx clawhub@latest install adspower-browser --force
npm i -g adspower-browser
openclaw mcp set adspower-local-api '{"command":"npx","args":["-y","local-api-mcp-typescript"],"env":{"PORT":"<PORT>","API_KEY":"<API_KEY>"}}'
```

`<PORT>` là cổng trên màn **AdsPower > Automation > API**. Cùng địa chỉ đó lưu riêng ở `ADSPOWER_API_BASE` (placeholder `<ADSPOWER_API_BASE>`). `<API_KEY>` lấy từ biến `ADSPOWER_API_KEY`. Không ghi host, số cổng, hay khóa vào repo.

Clone pack này. Trong `~/.openclaw/openclaw.json`, thêm gốc pack vào `skills.load.extraDirs` để OpenClaw thấy mọi `SKILL.md` bên trong (gốc repo không phải một skill):

```json
{
  "skills": {
    "load": {
      "extraDirs": ["<PACK_ROOT>"]
    }
  }
}
```

Copy `core/session-runner/config.example.yaml` thành `core/session-runner/config.yaml` và điền file riêng. Skill chiến dịch Shopee còn file `platforms/shopee/affiliate-invite/config.example.yaml`. Mở phiên OpenClaw mới (`/new` hoặc restart gateway).

Mỗi phiên, sau khi `open-browser` trả websocket CDP, gắn Playwright. Không lưu websocket vào git. Không thêm headless.

```bash
openclaw mcp set playwright '{"command":"npx","args":["-y","@playwright/mcp@latest","--cdp-endpoint","<CDP_WS_ENDPOINT>"]}'
```

### Kiến trúc

1. Mọi skill đọc `core/account-safety` trước.
2. Skill / MCP / CLI chính thức của AdsPower mở đúng profile của shop (cửa sổ hiện) và trả CDP websocket.
3. `@playwright/mcp` gắn vào websocket đó và thao tác trên **một** tab.
4. `core/session-runner` đếm cap, canh nhịp, ghi captcha, kiểm tra CSV và độ dài tin nhắn.
5. Skill trong `platforms/` làm đúng việc của sàn.
6. Hết phiên: tab đứng ở trang chủ seller, không đăng xuất, không đóng profile.

Không tự viết lệnh HTTP tới Local API. Không dùng tool bấm trang của AdsPower cho việc shop.

### Nguyên tắc an toàn

Bản đầy đủ nằm ở `core/account-safety/SKILL.md`. Tóm tắt:

- Một profile cho một shop. Không đổi IP, UA, fingerprint. Không xóa cookie. Không đăng nhập shop ở profile khác.
- Một tab. Phiên cách nhau 2–3 giờ, mỗi phiên tối đa 30–40 phút, rồi để không ở trang chủ.
- Nhịp 3–8 giây giữa thao tác, 20–60 giây giữa mỗi sửa item, nghỉ 2–5 phút sau mỗi 10–15 thao tác. Gặp captcha thì nhân đôi nhịp.
- Trần mặc định mỗi phiên: 10 sửa listing, 30 lời mời affiliate (từng cụm nhỏ), 3 lần đổi ads, 10 tin chat. Chỉnh trong config riêng, không tự nâng lúc đang chạy.
- Ưu tiên export, công cụ hàng loạt, hoặc API seller chính thức. Không gọi endpoint nội bộ, không bắn request dồn dập.
- Không headless. Không dịch vụ giải captcha. Captcha: dừng, tối đa một lần kéo slider, không xong thì để nguyên màn hình, chụp ảnh, gọi người, nghỉ ít nhất 30 phút. Ghi CSV và xem lại trước phiên sau.
- Pop-up: đóng thông báo. Không nhận đăng ký gói hay thanh toán.
- Cần người đồng ý trước khi đụng ngân sách, nạp tiền, thanh toán, hoàn tiền, giảm giá mạnh, hoặc xóa.
- Số trong báo cáo lấy từ export chính thức và đối chiếu lần nữa. QC hai lần cho mọi sửa. Không tin tiêu đề sản phẩm để chọn size biến thể.

### Danh mục skill

| Skill | Vai trò |
| --- | --- |
| `account-safety` | Luật chung, đọc trước |
| `session-runner` | Cap, nhịp, log captcha, script |
| `shopee-affiliate-invite` | Đã kiểm chứng: mời Targeted Campaign |
| `shopee-listing-update` | Khung sửa listing |
| `shopee-stock-price-sync` | Khung đồng bộ tồn kho và giá |
| `shopee-vouchers-promotions` | Khung một voucher hoặc khuyến mãi |
| `shopee-ads-gmv-max` | Khung ads, không để ROAS dưới sàn |
| `shopee-customer-chat-reply` | Khung chat, không hứa hoàn tiền |
| `shopee-daily-report` | Khung báo cáo từ export |
| `tiktokshop-*` và `lazada-*` | Bản mẫu cùng nhóm việc, cần chỉnh |

### Cách nhân viên đóng góp

- Thêm việc mới tại `platforms/<sàn>/<tên-việc>/SKILL.md`.
- `name` trong frontmatter là chữ thường, gạch ngang, không trùng skill khác. `description` một dòng, ngắn hơn 160 ký tự.
- Dòng đầu của phần làm việc: đọc `core/account-safety` và `core/session-runner`. Đừng chép lại luật nhịp hay captcha.
- Chưa chạy có người giám sát thì ghi rõ skeleton hoặc template. Đừng bịa đường click cho xong.
- Không đưa khóa, host, cổng, profile id, tên shop, tên sản phẩm, handle, email vào git.
- Script mới để trong `core/session-runner/scripts/`, chỉ dùng thư viện có sẵn của Node, không gọi mạng.
- Gửi pull request. Người phụ trách sẽ tiếp tục chỉnh pack này.

## English

### Purpose

Staff use this pack to operate stores they are allowed to manage on Shopee, Lazada, and TikTok Shop. Each store has one AdsPower profile, and that profile keeps its proxy and fingerprint. The agent works in a visible window, at a human pace, with a cap on how much it changes per session. The proven skill invites affiliates to a Shopee Targeted Campaign. The other skills are skeletons or templates: a person should watch one run and correct menu labels before they are used on their own.

### Install for OpenClaw

Work on the computer where AdsPower is open and a person can see the window. Install official AdsPower tooling first ([AdsPower/adspower-browser](https://github.com/AdsPower/adspower-browser)):

```bash
npx clawhub@latest install adspower-browser --force
npm i -g adspower-browser
openclaw mcp set adspower-local-api '{"command":"npx","args":["-y","local-api-mcp-typescript"],"env":{"PORT":"<PORT>","API_KEY":"<API_KEY>"}}'
```

`<PORT>` is the port on **AdsPower > Automation > API**. Store that same address privately as `ADSPOWER_API_BASE` (placeholder `<ADSPOWER_API_BASE>`). `<API_KEY>` comes from `ADSPOWER_API_KEY`. Do not write a host, a port number, or a key into this repo.

Clone this pack. In `~/.openclaw/openclaw.json`, add the pack root to `skills.load.extraDirs` so OpenClaw loads every nested `SKILL.md` (the repo root is not itself a skill):

```json
{
  "skills": {
    "load": {
      "extraDirs": ["<PACK_ROOT>"]
    }
  }
}
```

Copy `core/session-runner/config.example.yaml` to `core/session-runner/config.yaml` and fill only the private copy. The Shopee invite skill also has `platforms/shopee/affiliate-invite/config.example.yaml`. Start a new OpenClaw session (`/new`, or restart the gateway).

Each session, after `open-browser` returns a CDP websocket, attach Playwright. Do not store the websocket in git. Do not add headless mode.

```bash
openclaw mcp set playwright '{"command":"npx","args":["-y","@playwright/mcp@latest","--cdp-endpoint","<CDP_WS_ENDPOINT>"]}'
```

### Architecture

1. Every skill reads `core/account-safety` first.
2. The official AdsPower skill, MCP, or CLI opens that store's profile in a visible window and returns a CDP websocket.
3. `@playwright/mcp` attaches to that websocket and works in **one** tab.
4. `core/session-runner` enforces caps, pacing, the captcha log, CSV dedupe, and message length.
5. A skill under `platforms/` does the marketplace task.
6. The session ends with the tab idle on seller home. Do not log out. Do not close the profile.

Do not hand-write Local API HTTP calls. Do not use AdsPower's page-click tools for store work.

### Safety principles

The full rules are in `core/account-safety/SKILL.md`. In short:

- One profile per store. Do not change IP, user agent, or fingerprint. Do not clear cookies. Do not log a store in on another profile.
- One tab. Sessions are 2–3 hours apart, last at most 30–40 minutes, then idle on home.
- Wait 3–8 seconds between actions, 20–60 seconds between item edits, and 2–5 minutes every 10–15 actions. After a captcha, double those waits.
- Default caps per session: 10 listing edits, 30 affiliate invites in small batches, 3 ads changes, 10 chat replies. Change them in private config. Do not raise them mid-run.
- Prefer official exports, bulk tools, or a documented seller API. Never call internal endpoints or flood requests.
- Never headless. Never a captcha-solver service. On captcha: stop, at most one human-paced slider attempt, otherwise freeze, screenshot, alert a person, and pause at least 30 minutes. Log captchas to CSV and review the pattern before the next session.
- Pop-ups: close notifications. Never accept a sign-up or a payment.
- A person must approve budget changes, top-ups, payments, refunds, big price cuts, and deletions.
- Report exact numbers from official exports, cross-checked. QC twice on every edit. Never trust a product title for a variant size.

### Skill index

| Skill | Role |
| --- | --- |
| `account-safety` | Shared rules, load first |
| `session-runner` | Caps, pace, captcha log, scripts |
| `shopee-affiliate-invite` | Proven Targeted Campaign invite |
| `shopee-listing-update` | Listing-edit skeleton |
| `shopee-stock-price-sync` | Stock and price skeleton |
| `shopee-vouchers-promotions` | One voucher or promotion |
| `shopee-ads-gmv-max` | Ads skeleton with a ROAS floor |
| `shopee-customer-chat-reply` | Chat skeleton, no refund promises |
| `shopee-daily-report` | Report from official exports |
| `tiktokshop-*` and `lazada-*` | Same job set, templates to refine |

TikTok Shop templates: creator outreach, listing update, stock and price sync, promotions, ads, chat, daily report.

Lazada templates: affiliate invite, listing update, stock and price sync, promotions, ads, chat, daily report.

### Contribution guide for staff

- Add a task at `platforms/<platform>/<task-name>/SKILL.md`.
- Frontmatter `name` is lowercase and hyphenated, and unique. `description` is one line under 160 characters.
- The working section starts by loading `core/account-safety` and `core/session-runner`. Do not copy the pace or captcha rules into the new file.
- Until a supervised run has confirmed the labels, mark the skill as a skeleton or a template. Do not invent a click-path to look finished.
- Do not put keys, hosts, ports, profile ids, shop names, product names, creator handles, or personal emails in git.
- New helpers belong in `core/session-runner/scripts/`. Use Node's built-in modules only. No network calls.
- Open a pull request. The owner will keep refining this pack.

## Layout

```text
README.md
LICENSE
.gitignore
core/account-safety/SKILL.md
core/session-runner/SKILL.md
core/session-runner/config.example.yaml
core/session-runner/scripts/
platforms/shopee/
platforms/tiktokshop/
platforms/lazada/
```

`.gitignore` covers `config.yaml`, env files, `data/`, invite CSVs, `captcha_log.csv`, `session-state.json`, and `screenshots/`.

## License

MIT. See [LICENSE](LICENSE).

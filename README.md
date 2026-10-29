# Automate Ecom Store

Skill library for staff OpenClaw agents that operate the company's own Shopee, TikTok Shop, and Lazada stores. Each skill is a folder with `SKILL.md` (YAML frontmatter `name` and `description`, plus the steps the agent follows) and, when needed, `scripts/` and templates.

This repository is public. It holds procedure and placeholders only. Shop secrets stay on the shop computer.

## Tiếng Việt

### Tổng quan

Nhân viên dùng các skill này trong OpenClaw để làm việc trên Seller Centre của shop mình được phép vận hành. Skill đầu tiên mời KOL vào chiến dịch **Targeted Campaign** của Shopee Affiliate: mở profile AdsPower (cửa sổ hiện), gắn Playwright MCP qua CDP, điền form, kiểm tra, rồi ghi các KOL vừa mời vào CSV riêng.

Người phụ trách sẽ tiếp tục bổ sung skill. Chưa có skill TikTok Shop hay Lazada trong repo này.

### Cấu trúc repo

```text
README.md
LICENSE
.gitignore
skills/shopee-affiliate-invite/
  SKILL.md
  config.example.yaml
  scripts/check-invited.mjs
  scripts/check-message-length.mjs
```

`config.yaml`, file `.env`, thư mục `data/`, `invited_kol.csv`, và `screenshots/` nằm trong `.gitignore`. Không commit chúng.

### Cài skill vào OpenClaw

Làm trên máy đang mở AdsPower, nơi có người nhìn thấy cửa sổ trình duyệt. Cài thư mục chứa `SKILL.md`, không cài gốc repo (gốc repo không có `SKILL.md`).

Công cụ AdsPower chính thức là điều kiện bắt buộc để mở và quản lý profile. Repo: https://github.com/AdsPower/adspower-browser

```bash
npx clawhub@latest install adspower-browser --force
npm i -g adspower-browser
openclaw mcp set adspower-local-api '{"command":"npx","args":["-y","local-api-mcp-typescript"],"env":{"PORT":"<PORT>","API_KEY":"<API_KEY>"}}'
```

- `<PORT>` là cổng trên màn **AdsPower > Automation > API**. Cùng địa chỉ đó được lưu riêng trong `ADSPOWER_API_BASE` (placeholder `<ADSPOWER_API_BASE>`). Không ghi host hoặc số cổng vào repo.
- `<API_KEY>` lấy từ biến môi trường `ADSPOWER_API_KEY`. Không dán khóa vào git.

```bash
openclaw skills install ./skills/shopee-affiliate-invite
```

Copy `skills/shopee-affiliate-invite/config.example.yaml` thành `config.yaml` cạnh `SKILL.md`, rồi điền file riêng đó. Mở phiên OpenClaw mới (`/new` hoặc restart gateway) để agent nhận skill.

Mỗi lần chạy chiến dịch, sau khi tool chính thức `open-browser` trả về CDP websocket, gắn Playwright MCP vào đúng websocket của lần đó. Không lưu websocket vào git. Không thêm chế độ headless.

```bash
openclaw mcp set playwright '{"command":"npx","args":["-y","@playwright/mcp@latest","--cdp-endpoint","<CDP_WS_ENDPOINT>"]}'
```

`<CDP_WS_ENDPOINT>` là chuỗi websocket trong kết quả `open-browser` của lần chạy đó.

**Không dùng headless cho việc shop.** Không bật headless của AdsPower, không truyền headless khi mở profile, không chạy Playwright headless. Cửa sổ phải hiện để người giám sát nhìn và để giảm captcha. Tài liệu AdsPower có chỗ hướng dẫn headless; skill shop này không dùng cách đó.

Agent mở profile bằng skill / MCP / CLI chính thức ở trên, lấy CDP endpoint, rồi mới dùng `@playwright/mcp` để bấm trên trang. Không tự viết lệnh HTTP tới Local API.

### Skill đầu tiên

`shopee-affiliate-invite` — mời KOL mới vào Targeted Campaign.

Agent đọc `SKILL.md` và làm lần lượt: kiểm tra config, mở profile, một tab, điền form từ trên xuống, sample đúng tên biến thể (ví dụ biến thể tên `100g`, không tin tiêu đề sản phẩm), bỏ qua handle đã có trong CSV, câu nhắn tối đa 200 ký tự, kiểm tra trước và sau khi tạo, ghi CSV, về trang chủ Seller Centre.

### Bảo mật

- Repo công khai. Chỉ để placeholder như `<PROFILE_ID>`, `My Shop`, `Product A`, biến thể `100g`.
- Khóa API, mật khẩu, địa chỉ Local API, cổng, profile id, tên shop thật, mã sản phẩm, handle KOL, email cá nhân: không đưa vào git, issue, hay mô tả pull request.
- `ADSPOWER_API_KEY` chỉ nằm trong môi trường. `ADSPOWER_API_BASE` chỉ nằm trong config riêng hoặc môi trường.
- Đóng pop-up bằng nút X / Close. Không đồng ý đăng ký gói, nạp tiền, hay thanh toán.
- Gặp captcha thì dừng, tối đa một lần kéo slider theo nhịp người (1–2 giây, không đều). Không dùng dịch vụ giải captcha.
- Không gọi API nội bộ của Shopee. Không lấy cookie hay token.
- CSV và ảnh chụp màn hình là dữ liệu vận hành, giữ ngoài git.

## English

### Overview

Staff run these skills in OpenClaw against Seller Centre for a store they are allowed to operate. The first skill invites KOLs to a Shopee Affiliate **Targeted Campaign**: open an AdsPower profile in a visible window, attach Playwright MCP over CDP, fill the form, check it, and append the invited KOLs to a private CSV.

The owner will keep adding skills. TikTok Shop and Lazada skills are not in this repository yet.

### Repository layout

```text
README.md
LICENSE
.gitignore
skills/shopee-affiliate-invite/
  SKILL.md
  config.example.yaml
  scripts/check-invited.mjs
  scripts/check-message-length.mjs
```

`.gitignore` covers `config.yaml`, `*.env`, `data/`, `invited_kol.csv`, and `screenshots/`. Do not commit them.

### Install skills into OpenClaw

Work on the computer where AdsPower is open and a person can see the window. Install the folder that contains `SKILL.md`. The repository root is not itself a skill.

Official AdsPower tooling is required for opening and managing profiles. Repository: https://github.com/AdsPower/adspower-browser

```bash
npx clawhub@latest install adspower-browser --force
npm i -g adspower-browser
openclaw mcp set adspower-local-api '{"command":"npx","args":["-y","local-api-mcp-typescript"],"env":{"PORT":"<PORT>","API_KEY":"<API_KEY>"}}'
```

- `<PORT>` is the port shown at **AdsPower > Automation > API**. Store that same address privately as `ADSPOWER_API_BASE` (placeholder `<ADSPOWER_API_BASE>`). Do not write a host or a port number into this repository.
- `<API_KEY>` comes from the environment variable `ADSPOWER_API_KEY`. Do not paste the key into git.

```bash
openclaw skills install ./skills/shopee-affiliate-invite
```

Copy `skills/shopee-affiliate-invite/config.example.yaml` to `config.yaml` next to `SKILL.md`, and fill only the private copy. Start a new OpenClaw session (`/new`, or restart the gateway) so the agent loads the skill.

On each campaign run, after the official `open-browser` tool returns a CDP websocket, attach Playwright MCP to that run's websocket. Do not store the websocket in git. Do not add headless mode.

```bash
openclaw mcp set playwright '{"command":"npx","args":["-y","@playwright/mcp@latest","--cdp-endpoint","<CDP_WS_ENDPOINT>"]}'
```

`<CDP_WS_ENDPOINT>` is the websocket string from that run's `open-browser` result.

**Never use AdsPower headless mode for store work.** Do not start the AdsPower client headless, do not pass headless when opening a profile, and do not run Playwright headless. The window stays visible so a person can watch it and so the run keeps a human pace. AdsPower docs mention a headless switch; this shop skill does not use it.

The agent uses the skill, MCP, or CLI above to start the profile and read the CDP endpoint, then uses `@playwright/mcp` for page actions. It does not hand-write Local API HTTP calls.

### First skill

`shopee-affiliate-invite` invites new KOLs to a Targeted Campaign.

The agent follows `SKILL.md` in order: read private config, open the profile, keep one tab, fill the form top to bottom, choose the free-sample variation by its real variation name (for example a variation named `100g`, never by the product title), skip handles already in the CSV, keep the message within 200 characters, check the form before submit and the detail page after, append the CSV, and leave the tab on Seller Centre home.

### Security

- This repository is public. Use placeholders such as `<PROFILE_ID>`, `My Shop`, `Product A`, and variation `100g`.
- Do not put API keys, passwords, the Local API address, ports, profile ids, real shop names, product ids, KOL handles, or personal emails in git, issues, or pull request text.
- `ADSPOWER_API_KEY` stays in the environment. `ADSPOWER_API_BASE` stays in private config or the environment.
- Close pop-ups with X or Close. Do not accept program sign-ups, top-ups, or payments.
- On captcha, stop. At most one human-paced slider drag (1–2 seconds, uneven speed). No solver service.
- Do not call Shopee private APIs, and do not collect cookies or tokens.
- The invited CSV and screenshots are operational data. Keep them out of git.

## License

MIT. See [LICENSE](LICENSE).

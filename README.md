# Automate Ecom Store

One OpenClaw skill for staff who operate their **own** Shopee, Lazada, and TikTok Shop stores. A visible AdsPower profile opens the store. Playwright MCP works in one tab, at a human pace, so the account is less likely to hit captchas, restrictions, or a ban.

This repository is public. Secrets stay on the shop computer in `~/.automate-ecom-store/config.yaml` (mode 600).

## Tiếng Việt

### Mục đích

Một skill duy nhất. Nhân viên nhắn việc cần làm (mời affiliate, sửa listing, tồn kho, khuyến mãi, ads, chat, báo cáo). Agent đọc luật an toàn trước, rồi mở đúng phần việc trong `modules/`.

### Cài vào OpenClaw

Trong bản clone của repo này:

```bash
openclaw skills install ./skills/automate-ecom-store
```

Lần đầu dùng skill, agent hỏi API key của AdsPower, địa chỉ Local API chỉ khi khác địa chỉ thường trong **AdsPower > Automation > API**, và profile nào gắn với sàn nào. Nó ghi vào `~/.automate-ecom-store/config.yaml`, không in lại. Nói "reset config" khi muốn nhập lại từ đầu.

### Kiến trúc

1. `SKILL.md` là lối vào và bảng chọn việc.
2. `account-safety.md` được đọc trước mọi thao tác trên seller centre.
3. Skill / MCP / CLI chính thức của AdsPower mở profile (cửa sổ hiện) và trả CDP websocket.
4. `@playwright/mcp` gắn websocket đó, một tab.
5. Script trong `scripts/` canh nhịp, cap, log captcha, và CSV.
6. File trong `modules/<sàn>/` là các bước của từng việc.

### An toàn

Luật đầy đủ nằm ở `skills/automate-ecom-store/account-safety.md`: một profile một shop, không đổi IP/UA/cookie, một tab, phiên 2–3 giờ một lần và tối đa 30–40 phút, nhịp người, trần số lần sửa, không headless, không giải captcha thuê, không endpoint nội bộ. Số liệu lấy từ export chính thức. QC hai lần. Không tin tiêu đề để chọn size biến thể.

### Đóng góp

Sửa module trong `skills/automate-ecom-store/modules/`. Không thêm `SKILL.md` thứ hai. Không đưa khóa, host, cổng, profile id, tên shop, tên sản phẩm, hay handle vào git.

## English

### Purpose

One skill. The marketer names the job (affiliate invite, listings, stock and price, promotions, ads, chat, or a daily report). The agent reads the safety rules first, then opens the matching file under `modules/`.

### Install for OpenClaw

From a clone of this repository:

```bash
openclaw skills install ./skills/automate-ecom-store
```

On first use the skill asks for the AdsPower API key, the Local API address only when it is not the usual one shown in **AdsPower > Automation > API**, and which profile maps to which store and platform. It saves that only in `~/.automate-ecom-store/config.yaml` with mode 600, and it does not print the values back. Say "reset config" to delete that file and answer the questions again.

### Architecture

1. `SKILL.md` is the entry point and the router.
2. `account-safety.md` is read before every seller-centre action.
3. The official AdsPower skill, MCP, or CLI opens the profile in a visible window and returns a CDP websocket.
4. `@playwright/mcp` attaches to that websocket and stays on one tab.
5. Scripts in `scripts/` handle pace, caps, the captcha log, and CSV checks.
6. Files in `modules/<platform>/` are the steps for each task.

### Safety

The full rules are in `skills/automate-ecom-store/account-safety.md`: one profile per store, no IP, user-agent, or cookie changes, one tab, sessions 2–3 hours apart and at most 30–40 minutes, human pacing, per-session caps, no headless mode, no captcha-solver service, no internal endpoints. Figures come from official exports. Every edit is checked twice. A product title is not a variant size.

### Contribution guide for staff

Edit a module under `skills/automate-ecom-store/modules/`. Do not add a second `SKILL.md`. Do not put keys, hosts, ports, profile ids, shop names, product names, or creator handles in git. The Shopee affiliate invite module is the proven path. Other Shopee modules are skeletons. TikTok Shop and Lazada modules are templates to refine after a supervised run.

## Layout

```text
skills/automate-ecom-store/SKILL.md
skills/automate-ecom-store/account-safety.md
skills/automate-ecom-store/session-runner.md
skills/automate-ecom-store/config.example.yaml
skills/automate-ecom-store/scripts/
skills/automate-ecom-store/modules/shopee/
skills/automate-ecom-store/modules/lazada/
skills/automate-ecom-store/modules/tiktokshop/
```

## License

MIT. See [LICENSE](LICENSE).

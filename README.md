# Automate Ecom Store

## Bắt đầu trong 5 bước

Dành cho người chạy shop, không cần biết lập trình.

1. **Cài.** Mở terminal và dán đúng một lệnh này:

```bash
git clone https://github.com/sonaecom/Automate-Ecom-Store.git && openclaw skills install ./Automate-Ecom-Store/skills/automate-ecom-store
```

2. **Mở AdsPower** như mọi khi. Cửa sổ trình duyệt phải hiện trên màn hình. Đừng bật chế độ ẩn.
3. **Chỉ dán API Key.** Nhắn agent, ví dụ "làm shop". Khi được hỏi, vào AdsPower → Automation → API, copy API Key và dán vào chat. Không cần gửi địa chỉ mạng hay mã profile.
4. **Chọn profile theo số.** Agent liệt kê profile và đoán sàn từ tên (Shopee, Lazada, TikTok Shop). Đúng thì trả lời `ok`. Sai thì sửa theo số, ví dụ `1 shopee, 2 tiktok`. Giới hạn an toàn mỗi phiên đã có sẵn (10 lần sửa listing, 30 lời mời, 3 lần đổi ads, 10 tin chat). Không cần điền.
5. **Nói việc cần làm.** Ví dụ: "mời affiliate Shopee" hoặc "đăng sản phẩm mới trên Shopee". Agent làm chậm, một tab, và dừng gọi bạn nếu gặp captcha.

Muốn nhập lại key từ đầu, nhắn `reset config`.

One OpenClaw skill for staff who operate their **own** Shopee, Lazada, and TikTok Shop stores. A visible AdsPower profile opens the store. Playwright MCP works in one tab, at a human pace, so the account is less likely to hit captchas, restrictions, or a ban.

This repository is public. The API key stays on the shop computer in `~/.automate-ecom-store/config.yaml` (mode 600). The first run asks for that key only.

## Tiếng Việt

### Mục đích

Một skill duy nhất. Nhân viên nhắn việc cần làm (mời affiliate, sửa listing, tồn kho, khuyến mãi, ads, chat, báo cáo). Agent đọc luật an toàn trước, rồi mở đúng phần việc trong `modules/`.

### Cài vào OpenClaw

Trong bản clone của repo này:

```bash
git clone https://github.com/sonaecom/Automate-Ecom-Store.git && openclaw skills install ./Automate-Ecom-Store/skills/automate-ecom-store
```

Lần đầu, agent chỉ hỏi API Key. Địa chỉ Local API chỉ được hỏi khi không kết nối được. Profile thì agent tự liệt kê để bạn chọn theo số. Giới hạn an toàn đã điền sẵn. Key được ghi trên máy, không in lại. Nhắn `reset config` khi muốn nhập lại key.

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
git clone https://github.com/sonaecom/Automate-Ecom-Store.git && openclaw skills install ./Automate-Ecom-Store/skills/automate-ecom-store
```

On first use the skill asks only for the AdsPower API key. It uses the official tool's usual Local API address, and asks for an address only if that connection fails. It lists AdsPower profiles and the marketer picks by number; platform is guessed from the profile name when the name is clear. Safety caps are already filled in. The key is stored in `~/.automate-ecom-store/config.yaml` with mode 600 and is not printed back. Say "reset config" to delete that file and paste the key again.

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

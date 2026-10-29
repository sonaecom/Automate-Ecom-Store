# Automate Ecom Store

## Bắt đầu trong 5 bước

Dành cho người chạy shop, không cần biết lập trình.

1. **Cài.** Mở terminal và dán đúng một lệnh này:

```bash
git clone https://github.com/sonaecom/Automate-Ecom-Store.git && openclaw skills install ./Automate-Ecom-Store/skills/automate-ecom-store
```

2. **Mở AdsPower** như mọi khi. Cửa sổ trình duyệt phải hiện trên màn hình. Đừng bật chế độ ẩn.
3. **Chỉ dán API Key.** Nhắn agent, ví dụ "làm shop". Khi được hỏi, vào AdsPower → Automation → API, copy API Key và dán vào chat. Không cần gửi địa chỉ mạng hay mã profile. Sau khi key đã lưu, agent hỏi hai câu, mỗi câu chỉ cần có hoặc không. Cả hai đều không bắt buộc. (1) Có muốn báo cáo trên Google Sheets không? (2) Đã có file theo dõi tồn kho thời gian thực trên Google Sheets chưa? Cả hai đều không thì bỏ qua Google: không kết nối Gmail, Drive, hay Sheets. Agent không tự trả lời email của khách.
4. **Chọn profile theo số.** Agent liệt kê profile và đoán sàn từ tên (Shopee, Lazada, TikTok Shop). Đúng thì trả lời `ok`. Sai thì sửa theo số, ví dụ `1 shopee, 2 tiktok`. Giới hạn an toàn mỗi phiên đã có sẵn (10 lần sửa listing, 30 lời mời, 3 lần đổi ads, 10 tin chat). Không cần điền. Sau đó là một phỏng vấn ngắn, trắc nghiệm, bỏ qua được: số cửa hàng, sàn, thị trường, và giai đoạn từng cửa hàng (mới / chưa đạt / đang ổn). Có thể nói thêm mục tiêu và số người trong đội. Chọn lộ trình theo tuần, tháng, hoặc quý. Nhắn `phỏng vấn lại` khi muốn làm lại.
5. **Nói việc cần làm.** Ví dụ: "mời affiliate Shopee", "đăng sản phẩm mới", hoặc "làm lại trang chủ shop". Agent làm chậm, một tab, và dừng gọi bạn nếu gặp captcha.

Muốn nhập lại key từ đầu, nhắn `reset config`.

One skill for staff who operate their **own** Shopee, Lazada, and TikTok Shop stores. The usual host is a Linux VPS with OpenClaw or Hermes Agent, and AdsPower, on that same machine. A headed AdsPower profile opens the store on a virtual display. Playwright MCP works in one tab, at a human pace, so the account is less likely to hit captchas, restrictions, or a ban. The VPS stays on. A seller session does not.

This repository is public. The API key stays on the shop computer in `~/.automate-ecom-store/config.yaml` (mode 600). The first run asks for that key, then a short skippable interview (store count, platforms, markets, and a stage per store) and two optional yes/no questions: Sheets reports, and an existing real-time inventory file on Google Sheets. If both Google answers are no, Google is skipped.

## Tiếng Việt

### Mục đích

Một skill duy nhất. Nhân viên nhắn việc cần làm (mời affiliate, sửa listing, tồn kho, khuyến mãi, ads, chat, báo cáo). Agent đọc luật an toàn trước, rồi mở đúng phần việc trong `modules/`.

### Cài vào OpenClaw

Trong bản clone của repo này:

```bash
git clone https://github.com/sonaecom/Automate-Ecom-Store.git && openclaw skills install ./Automate-Ecom-Store/skills/automate-ecom-store
```

Lần đầu, agent hỏi API Key, rồi một phỏng vấn ngắn có thể bỏ qua (số cửa hàng, sàn, thị trường, giai đoạn từng cửa hàng), rồi hai câu không bắt buộc: có muốn báo cáo trên Google Sheets không, và đã có file tồn kho thời gian thực trên Google Sheets chưa. Cả hai câu Google đều không thì bỏ qua Google. Địa chỉ Local API chỉ được hỏi khi không kết nối được. Profile thì agent tự liệt kê để bạn chọn theo số. Giới hạn an toàn đã điền sẵn. Key được ghi trên máy, không in lại. Nhắn `reset config` khi muốn nhập lại key.

### Kiến trúc

1. `SKILL.md` là lối vào và bảng chọn việc.
2. `account-safety.md` được đọc trước mọi thao tác trên seller centre.
3. Skill / MCP / CLI chính thức của AdsPower mở profile (cửa sổ hiện) và trả CDP websocket.
4. `@playwright/mcp` gắn websocket đó, một tab.
5. Script trong `scripts/` canh nhịp, cap, log captcha, và CSV.
6. File trong `modules/<sàn>/` là các bước của từng việc.
7. Báo cáo Google Sheets chỉ khi chủ shop đã trả lời có. Không thì giữ CSV trên máy. Muốn xem trên web: `cd dashboard/web && pnpm i && pnpm dev`. Dữ liệu trong `sample/` chỉ là ví dụ.
8. Cập nhật skill mà không đụng cấu hình trên máy: `node skills/automate-ecom-store/scripts/update.mjs`.

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

On first use the skill asks for the AdsPower API key, then a short skippable interview: how many stores, which platforms, which markets, and whether each store is new, underperforming, or stable. Optional goals and team size can be skipped. The owner then picks a week, month, or quarter roadmap. It also asks two optional yes/no questions: whether the owner wants reports on Google Sheets, and whether they already have a real-time inventory tracking file on Google Sheets. Neither Google question is required. If both answers are no, Gmail, Drive, and Sheets are not connected. It uses the official tool's usual Local API address, and asks for an address only if that connection fails. It lists AdsPower profiles and the marketer picks by number; platform is guessed from the profile name when the name is clear. Safety caps are already filled in. The key is stored in `~/.automate-ecom-store/config.yaml` with mode 600 and is not printed back. Say "reset config" to delete that file and paste the key again.

### Architecture

1. `SKILL.md` is the entry point and the router.
2. `account-safety.md` is read before every seller-centre action.
3. The official AdsPower skill, MCP, or CLI opens the profile in a visible window and returns a CDP websocket.
4. `@playwright/mcp` attaches to that websocket and stays on one tab.
5. Scripts in `scripts/` handle pace, caps, the captcha log, and CSV checks.
6. Files in `modules/<platform>/` are the steps for each task.
7. Google Sheets reports are used only when the owner said yes. Otherwise the CSV stays on the shop computer. The optional web app is `cd dashboard/web && pnpm i && pnpm dev`. Files in `sample/` are examples.
8. Update the skill without touching local config: `node skills/automate-ecom-store/scripts/update.mjs`.

### Safety

The full rules are in `skills/automate-ecom-store/account-safety.md`: one profile per store, no IP, user-agent, or cookie changes, one tab, sessions 2–3 hours apart and at most 30–40 minutes, human pacing, per-session caps, no headless mode, no captcha-solver service, no internal endpoints. Figures come from official exports. Every edit is checked twice. A product title is not a variant size.

### Contribution guide for staff

Edit a module under `skills/automate-ecom-store/modules/`. Do not add a second `SKILL.md`. Do not put keys, hosts, ports, profile ids, shop names, product names, or creator handles in git. The Shopee affiliate invite module is the proven path. Other Shopee modules are skeletons. TikTok Shop and Lazada modules are templates to refine after a supervised run.

## Local only

Internal test profiles, notes, and store-specific config stay on the shop computer. Put them in `local/` or in a `*.local` / `*.local.*` file. Those paths are gitignored. The public tree keeps placeholders and synthetic samples. Before a push, `.githooks/pre-push` rejects a tracked file that names an internal test store. Turn the hook on with `git config core.hooksPath .githooks`.

## Docs

| Read this | For |
| --- | --- |
| `skills/automate-ecom-store/docs/vps.md` | Linux VPS: headed AdsPower, OpenClaw, Hermes Agent, systemd, update |
| `skills/automate-ecom-store/SKILL.md` | Route from a job to one module |
| `skills/automate-ecom-store/account-safety.md` | Pace, caps, captcha, one visible tab |
| `skills/automate-ecom-store/policies/LAYER.md` | Policy gate, fee and chat blocks, weekly re-check gaps |
| `skills/automate-ecom-store/modules/selling/README.md` | Day-to-day selling map |
| `skills/automate-ecom-store/modules/fees/fee-cap.md` | Fee percent of GMV and join/leave proposals |
| `skills/automate-ecom-store/modules/fx/reporting.md` | Market or custom monthly rates into VND |
| `skills/automate-ecom-store/modules/orders/cancel-return.md` | Cancellation versus shipped-only returns |
| `skills/automate-ecom-store/CHANGELOG.md` | What each version changed |
| `dashboard/web/README.md` | Optional web dashboard, sample data, password |

## Layout

```text
README.md
skills/automate-ecom-store/SKILL.md
skills/automate-ecom-store/account-safety.md
skills/automate-ecom-store/session-runner.md
skills/automate-ecom-store/policies/          market notes and the rule list
skills/automate-ecom-store/modules/          one file per job
skills/automate-ecom-store/scripts/          checks, pace, caps, reconciles
skills/automate-ecom-store/templates/        synthetic samples
dashboard/web/                               optional Vietnamese dashboard
.githooks/pre-push                           secret scan and private-name check
```

## License

MIT. See [LICENSE](LICENSE).

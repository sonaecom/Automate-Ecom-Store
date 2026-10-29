# Bảng điều khiển cửa hàng

Giao diện tuỳ chọn cho chủ shop. Nhãn tiếng Việt. Dữ liệu mẫu trong `sample/` là ví dụ, không phải số cửa hàng thật.

Mặc định trong skill vẫn là Google Sheets. App này đọc cùng các cột đã chuẩn hoá.

## Chạy local

```bash
cd dashboard/web
pnpm i
pnpm dev
```

Mở địa chỉ mà lệnh `pnpm dev` in ra. Không cần biến môi trường cho dữ liệu ví dụ.

## Nguồn dữ liệu

Đặt trong `.env.local` (xem `env.example`).

| `DATA_SOURCE` | Đọc |
| --- | --- |
| `sample` | CSV ví dụ trong `sample/`. Mặc định. |
| `csv` | Cùng tên file trong `CSV_DIR`. |
| `sheets` | Google Sheets. Cần `GOOGLE_SHEETS_ID` và `GOOGLE_SHEETS_ACCESS_TOKEN`. |

Tab:

| Tab | Việc |
| --- | --- |
| `FxFacts` | Doanh thu, ads, ví đã quy đổi. Giữ nguyên số, tỷ giá, ngày hoặc tháng, chế độ. |
| `Settings/FX` | `month, currency, rate, mode`. |
| `MarketRates` | Tỷ giá thị trường theo ngày. |
| `AdsFacts` | Chi phí ads và nạp tiền. |
| `WalletFacts` | Số dư và lệnh rút. Chỉ 4 số cuối. |
| `Orders` | Đơn để khoan huỷ / hoàn. |
| `CancelFacts` | Dùng khi không có `Orders`. |
| `SkuPnl` | Lãi lỗ SKU. Ví dụ cho đến khi có export chính thức. |
| `Inventory` | Tồn kho. Ví dụ. |
| `Thresholds` | Ngưỡng cảnh báo. |
| `AiCost` | Chi phí AI theo phiên và cửa hàng. |

`GOOGLE_SHEETS_API_KEY` chỉ đọc được sheet công khai. Đừng để sheet cửa hàng thành công khai. Dùng access token và mật khẩu bên dưới.

Sửa tỷ giá trên trang Cài đặt chỉ tính lại các tháng trên màn hình. App không ghi đè tab `Settings/FX`.

## Mật khẩu

Để trống `DASHBOARD_PASSWORD` khi chỉ xem dữ liệu ví dụ trên máy mình.

Khi có số thật, đặt mật khẩu trong môi trường. Mọi trang trừ `/unlock` sẽ hỏi mật khẩu. Mật khẩu không được ghi vào git.

## Đưa lên Vercel

Số cửa hàng là dữ liệu riêng.

1. Import repo, root directory `dashboard/web`.
2. Đặt biến môi trường ở trên, gồm `DASHBOARD_PASSWORD`.
3. Trong project → Settings → Deployment Protection, bật [Password Protection](https://vercel.com/docs/deployment-protection/methods-to-protect-deployments/password-protection) hoặc Vercel Authentication. Đây là lớp chặn trước khi request vào app.
4. Không bật public sheet để “cho API key đọc được”.

```bash
cd dashboard/web
pnpm i
pnpm build
```

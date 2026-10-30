export function formatMoney(value: number | null, currency: string) {
  if (value === null || !Number.isFinite(value)) return "—"
  const digits = currency === "VND" || currency === "IDR" ? 0 : 2
  const formatted = new Intl.NumberFormat("vi-VN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)
  return `${formatted} ${currency}`
}

export function formatNumber(value: number | null, digits = 0) {
  if (value === null || !Number.isFinite(value)) return "—"
  return new Intl.NumberFormat("vi-VN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)
}

export function formatPercent(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "không xác định"
  return new Intl.NumberFormat("vi-VN", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value)
}

export function platformLabel(platform: string) {
  if (platform === "shopee") return "Shopee"
  if (platform === "lazada") return "Lazada"
  if (platform === "tiktokshop") return "TikTok Shop"
  return platform
}

export function fallbackLabel(fallback: string, mode: string) {
  if (fallback === "none") {
    if (mode === "identity") return "cùng tiền tệ"
    if (mode === "custom") return "tỷ giá riêng"
    if (mode === "market") return "tỷ giá thị trường"
  }
  if (fallback === "market_on_or_before") return "tỷ giá ngày gần nhất trước đó"
  if (fallback === "earlier_custom_month") return "tỷ giá riêng tháng trước"
  if (fallback === "market_for_missing_custom") return "thị trường vì chưa có tỷ giá riêng"
  if (fallback === "monthly_market") return "tỷ giá thị trường theo tháng"
  if (fallback === "rate_mismatch") return "hai nguồn không khớp"
  if (fallback === "no_rate") return "không có tỷ giá"
  return fallback || mode
}

import { formatMoney, formatPercent, fallbackLabel } from "@/lib/format"
import { convertAmount, type Quote } from "@/lib/fx"
import { classify, rollup, type Classified, type RateBucket } from "@/lib/returns"
import type {
  AdsFact,
  Bundle,
  CustomRate,
  Filters,
  FxFact,
  FeeRow,
  InventoryRow,
  SkuRow,
  WalletFact,
} from "@/lib/types"

export type MoneyView = {
  text: string
  hint: string
  amount: number | null
  currency: string
  preview: boolean
}

export type AlertItem = {
  id: string
  tone: "bad" | "warn"
  title: string
  detail: string
  platform: string
  market: string
}

export type GroupRow = {
  key: string
  sales: number | null
  adSpend: number | null
  orders: number
  cancelRate: number | null
  rtsRate: number | null
}

export type DashboardView = {
  fx: Array<FxFact & { shown: MoneyView }>
  ads: Array<AdsFact & { shownSpend: MoneyView; shownGmv: MoneyView }>
  wallet: Array<WalletFact & { shownAvailable: MoneyView }>
  sku: Array<SkuRow & { profitView: MoneyView; revenueView: MoneyView }>
  inventory: InventoryRow[]
  fees: FeeRow[]
  orders: Classified[]
  rates: Record<"market" | "platform" | "store" | "category" | "product" | "sku" | "staff", RateBucket[]>
  excluded: number
  trend: Array<{ date: string; sales: number }>
  groups: Record<"platform" | "market" | "store" | "staff", GroupRow[]>
  alerts: AlertItem[]
  qc: string[]
  sales: MoneyView
  adSpend: MoneyView
  walletAvailable: MoneyView
  roas: number | null
  cancelRate: number | null
  rtsRate: number | null
  orderCount: number
}

function inRange(date: string, filters: Filters) {
  const day = date.slice(0, 10)
  if (!day) return true
  return day >= filters.from && day <= filters.to
}

function dim(value: string, selected: string) {
  return selected === "all" || selected === "Tất cả" || value === selected
}

function matchPlace(row: { platform: string; market: string; store: string }, filters: Filters) {
  return dim(row.platform, filters.platform) && dim(row.market, filters.market) && dim(row.store, filters.store)
}

function sheetQuote(row: FxFact, filters: Filters): Quote {
  if (filters.fxMode === "market") {
    return {
      amount: row.amountMarket,
      rate: row.marketRate,
      rateDate: row.marketRateDate,
      rateMonth: row.marketRateMonth,
      mode: row.currency === row.baseCurrency ? "identity" : "market",
      fallback: row.marketFallback || "none",
    }
  }
  return {
    amount: row.amountCustom,
    rate: row.customRate,
    rateDate: row.customRateDate,
    rateMonth: row.customRateMonth,
    mode: row.currency === row.baseCurrency
      ? "identity"
      : ["market_for_missing_custom", "market_on_or_before", "monthly_market"].includes(row.customFallback)
        ? "market"
        : "custom",
    fallback: row.customFallback || "none",
  }
}

function moneyFromQuote(native: number, currency: string, base: string, quote: Quote, filters: Filters, preview: boolean): MoneyView {
  if (filters.currencyView === "native") {
    return { text: formatMoney(native, currency), hint: currency, amount: native, currency, preview: false }
  }
  const when = quote.rateDate || quote.rateMonth
  return {
    text: formatMoney(quote.amount, base),
    hint: quote.amount === null ? fallbackLabel(quote.fallback, quote.mode) : `${quote.rate} · ${fallbackLabel(quote.fallback, quote.mode)} · ${when}`,
    amount: quote.amount,
    currency: base,
    preview,
  }
}

function convertNative(
  native: number,
  currency: string,
  date: string,
  base: string,
  filters: Filters,
  bundle: Bundle,
  rates: CustomRate[],
) {
  const quote = convertAmount(native, currency, date, base, filters.fxMode, bundle.marketRates, rates)
  return moneyFromQuote(native, currency, base, quote, filters, filters.currencyView === "base")
}

function sumMoney(cells: MoneyView[], base: string, nativeLabel: string): MoneyView {
  const usable = cells.filter((cell) => cell.amount !== null)
  if (!usable.length) return { text: "—", hint: cells.length ? "không có tỷ giá" : "không có dòng", amount: null, currency: base, preview: false }
  const currencies = [...new Set(usable.map((cell) => cell.currency))]
  if (currencies.length > 1) {
    return {
      text: "nhiều tiền tệ",
      hint: nativeLabel,
      amount: null,
      currency: "",
      preview: false,
    }
  }
  const amount = usable.reduce((total, cell) => total + (cell.amount ?? 0), 0)
  const skipped = cells.length - usable.length
  const hint = skipped
    ? `${skipped} dòng không có tỷ giá, không cộng vào`
    : usable.some((cell) => cell.preview)
      ? "xem trước sau khi sửa tỷ giá"
      : usable.length > 1
        ? "mỗi dòng giữ tỷ giá và ngày hoặc tháng của nó"
        : usable[0]?.hint || ""
  return {
    text: formatMoney(amount, currencies[0] || base),
    hint,
    amount,
    currency: currencies[0] || base,
    preview: usable.some((cell) => cell.preview),
  }
}

function staffGroups(
  sku: DashboardView["sku"],
  orders: Classified[],
  rates: RateBucket[],
  filters: Filters,
): GroupRow[] {
  const map = new Map<string, GroupRow>()
  for (const row of sku) {
    const current = map.get(row.staff) ?? { key: row.staff, sales: 0, adSpend: 0, orders: 0, cancelRate: null, rtsRate: null }
    if (filters.currencyView === "base" && row.revenueView.amount !== null) current.sales = (current.sales ?? 0) + row.revenueView.amount
    map.set(row.staff, current)
  }
  for (const row of orders) {
    if (!row.inCancel) continue
    const current = map.get(row.staff) ?? { key: row.staff, sales: null, adSpend: null, orders: 0, cancelRate: null, rtsRate: null }
    current.orders += 1
    map.set(row.staff, current)
  }
  return [...map.values()].map((row) => {
    const rateRow = rates.find((item) => item.key === row.key)
    return { ...row, cancelRate: rateRow?.cancelRate ?? null, rtsRate: rateRow?.rtsRate ?? null }
  })
}

export function buildView(bundle: Bundle, filters: Filters, rates: CustomRate[], dirty: boolean): DashboardView {
  const base = bundle.baseCurrency
  const fx = bundle.fx.filter((row) => inRange(row.date, filters) && matchPlace(row, filters)).map((row) => {
    const quote = dirty || row.qc === "NO_RATE" || row.qc === "RATE_MISMATCH"
      ? convertAmount(row.nativeAmount, row.currency, row.date, base, filters.fxMode, bundle.marketRates, rates)
      : sheetQuote(row, filters)
    return { ...row, shown: moneyFromQuote(row.nativeAmount, row.currency, base, quote, filters, dirty && filters.currencyView === "base") }
  })
  const ads = bundle.ads.filter((row) => inRange(row.date, filters) && matchPlace(row, filters)).map((row) => ({
    ...row,
    shownSpend: convertNative(row.spend, row.currency, row.date, base, filters, bundle, rates),
    shownGmv: row.gmvAttributed === null
      ? { text: "—", hint: "", amount: null, currency: row.currency, preview: false }
      : convertNative(row.gmvAttributed, row.currency, row.date, base, filters, bundle, rates),
  }))
  const wallet = bundle.wallet.filter((row) => inRange(row.date, filters) && matchPlace(row, filters)).map((row) => ({
    ...row,
    shownAvailable: row.available === null
      ? { text: "—", hint: "", amount: null, currency: row.currency, preview: false }
      : convertNative(row.available, row.currency, row.date, base, filters, bundle, rates),
  }))
  const sku = bundle.sku.filter((row) => inRange(row.date, filters) && matchPlace(row, filters)).map((row) => {
    const profitNative = row.revenue - row.cogs - row.adsAllocated - row.fees - row.refunds
    return {
      ...row,
      revenueView: convertNative(row.revenue, row.currency, row.date, base, filters, bundle, rates),
      profitView: convertNative(profitNative, row.currency, row.date, base, filters, bundle, rates),
    }
  })
  const inventory = bundle.inventory.filter((row) => matchPlace(row, filters))
  const fees = bundle.fees.filter((row) => inRange(row.date, filters) && matchPlace(row, filters))
  const orders = bundle.orders
    .filter((row) => matchPlace(row, filters))
    .map((row) => classify(row, filters.from, filters.to))
    .filter((row) => row.inCancel || row.shipped || row.excluded)
  const levels = {
    market: rollup(orders, (row) => row.market),
    platform: rollup(orders, (row) => row.platform),
    store: rollup(orders, (row) => row.store),
    category: rollup(orders, (row) => row.category),
    product: rollup(orders, (row) => row.product),
    sku: rollup(orders, (row) => row.sku),
    staff: rollup(orders, (row) => row.staff),
  } as const
  const salesRows = fx.filter((row) => row.stream === "sales" && row.qc !== "NO_RATE" && row.qc !== "RATE_MISMATCH")
  const adRows = fx.filter((row) => row.stream === "ads" && row.qc === "OK")
  const walletRows = fx.filter((row) => row.stream === "wallet" && row.qc === "OK")
  const trendMap = new Map<string, number>()
  for (const row of salesRows) {
    if (row.shown.amount === null || filters.currencyView === "native") continue
    trendMap.set(row.date, (trendMap.get(row.date) || 0) + row.shown.amount)
  }
  const created = orders.filter((row) => row.inCancel).length
  const cancelled = orders.filter((row) => row.cancelled).length
  const shipped = orders.filter((row) => row.shipped).length
  const rts = orders.filter((row) => row.rts).length
  const spendBase = ads.reduce((total, row) => total + (row.shownSpend.amount ?? 0), 0)
  const gmvBase = ads.reduce((total, row) => total + (row.shownGmv.amount ?? 0), 0)
  const nativeCurrencies = new Set(ads.map((row) => row.currency))
  const nativeSpend = ads.reduce((total, row) => total + row.spend, 0)
  const nativeGmv = ads.reduce((total, row) => total + (row.gmvAttributed ?? 0), 0)
  const qc: string[] = []
  for (const row of fx) {
    if (row.qc && row.qc !== "OK") qc.push(`${row.date} ${row.currency} ${row.stream}: ${row.qc}`)
    if (!dirty && filters.currencyView === "base") {
      const again = convertAmount(row.nativeAmount, row.currency, row.date, base, filters.fxMode, bundle.marketRates, rates)
      const sheet = filters.fxMode === "market" ? row.amountMarket : row.amountCustom
      if (again.amount !== null && sheet !== null && Math.abs(again.amount - sheet) > 0.05) {
        qc.push(`${row.date} ${row.currency} lệch ${again.amount} và ${sheet}. Không lấy trung bình.`)
      }
    }
  }
  const alerts = buildAlerts(bundle, filters, ads, wallet, levels.store, levels.sku, inventory, fx, fees)
  const groupBy = (field: "platform" | "market" | "store") => {
    const map = new Map<string, GroupRow>()
    for (const row of fx) {
      const key = row[field]
      const current = map.get(key) ?? { key, sales: 0, adSpend: 0, orders: 0, cancelRate: null, rtsRate: null }
      if (filters.currencyView === "base" && row.shown.amount !== null && row.qc === "OK") {
        if (row.stream === "sales") current.sales = (current.sales ?? 0) + row.shown.amount
        if (row.stream === "ads") current.adSpend = (current.adSpend ?? 0) + row.shown.amount
      }
      map.set(key, current)
    }
    for (const row of orders.filter((item) => item.inCancel || item.shipped)) {
      const key = row[field]
      const current = map.get(key) ?? { key, sales: null, adSpend: null, orders: 0, cancelRate: null, rtsRate: null }
      current.orders += row.inCancel ? 1 : 0
      map.set(key, current)
    }
    return [...map.values()].map((row) => {
      const rateRow = levels.store.find((item) => item.key === row.key)
        || levels.platform.find((item) => item.key === row.key)
        || levels.market.find((item) => item.key === row.key)
        || levels.staff.find((item) => item.key === row.key)
      return { ...row, cancelRate: rateRow?.cancelRate ?? null, rtsRate: rateRow?.rtsRate ?? null }
    })
  }
  return {
    fx,
    ads,
    wallet,
    sku,
    inventory,
    fees,
    orders,
    rates: levels,
    excluded: orders.filter((row) => row.excluded).length,
    trend: [...trendMap.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, sales]) => ({ date, sales })),
    groups: {
      platform: groupBy("platform"),
      market: groupBy("market"),
      store: groupBy("store"),
      staff: staffGroups(sku, orders, levels.staff, filters),
    },
    alerts,
    qc,
    sales: sumMoney(salesRows.map((row) => row.shown), base, "Xem từng tiền tệ ở bảng bên dưới"),
    adSpend: sumMoney(adRows.map((row) => row.shown), base, "Chi phí ads theo tiền tệ gốc"),
    walletAvailable: sumMoney(walletRows.map((row) => row.shown), base, "Số dư theo tiền tệ gốc"),
    roas: filters.currencyView === "base"
      ? (spendBase > 0 ? gmvBase / spendBase : null)
      : (nativeCurrencies.size === 1 && nativeSpend > 0 ? nativeGmv / nativeSpend : null),
    cancelRate: created ? cancelled / created : null,
    rtsRate: shipped ? rts / shipped : null,
    orderCount: created,
  }
}

function buildAlerts(
  bundle: Bundle,
  filters: Filters,
  ads: DashboardView["ads"],
  wallet: DashboardView["wallet"],
  stores: RateBucket[],
  skus: RateBucket[],
  inventory: InventoryRow[],
  fx: DashboardView["fx"],
  fees: FeeRow[],
): AlertItem[] {
  const alerts: AlertItem[] = []
  const { thresholds } = bundle
  for (const row of ads) {
    if (thresholds.daysLeft !== null && row.daysLeft !== null && row.daysLeft < thresholds.daysLeft) {
      alerts.push({
        id: `days-${row.store}-${row.date}`,
        tone: "warn",
        title: "Số ngày ads còn lại dưới ngưỡng",
        detail: `${row.daysLeft} ngày, ngưỡng ví dụ ${thresholds.daysLeft}. Không nạp tiền từ bảng này.`,
        platform: row.platform,
        market: row.market,
      })
    }
    if (thresholds.roasFloor !== null && row.roas !== null && row.roas < thresholds.roasFloor) {
      alerts.push({
        id: `roas-${row.store}-${row.date}`,
        tone: "warn",
        title: "ROAS dưới sàn ví dụ",
        detail: `ROAS ${row.roas} so với sàn ${thresholds.roasFloor}.`,
        platform: row.platform,
        market: row.market,
      })
    }
    if (row.matchStatus && row.matchStatus !== "MATCH") {
      alerts.push({
        id: `ads-${row.matchStatus}-${row.store}-${row.date}`,
        tone: "bad",
        title: `Đối soát nạp tiền: ${row.matchStatus}`,
        detail: "Hai nguồn không được lấy trung bình.",
        platform: row.platform,
        market: row.market,
      })
    }
  }
  for (const row of wallet) {
    if (["MISSING", "PENDING_TOO_LONG", "AMOUNT_MISMATCH"].includes(row.matchStatus)) {
      alerts.push({
        id: `wallet-${row.matchStatus}-${row.store}`,
        tone: "bad",
        title: `Rút tiền ${row.matchStatus}`,
        detail: `4 số cuối ${row.bankLast4 || "—"}. Không tạo lệnh rút.`,
        platform: row.platform,
        market: row.market,
      })
    }
  }
  for (const row of stores) {
    if (thresholds.cancelRate !== null && row.cancelRate !== null && row.cancelRate > thresholds.cancelRate) {
      alerts.push({
        id: `cancel-${row.key}`,
        tone: "bad",
        title: "Tỷ lệ huỷ vượt ngưỡng ví dụ",
        detail: `${formatPercent(row.cancelRate)} so với ${formatPercent(thresholds.cancelRate)}. Không huỷ đơn để đổi tỷ lệ.`,
        platform: "",
        market: "",
      })
    }
    if (thresholds.rtsRate !== null && row.rtsRate !== null && row.rtsRate > thresholds.rtsRate) {
      alerts.push({
        id: `rts-${row.key}`,
        tone: "bad",
        title: "Tỷ lệ hoàn vượt ngưỡng ví dụ",
        detail: `${formatPercent(row.rtsRate)} trên đơn đã giao courier. Đơn chưa xuất kho không tính.`,
        platform: "",
        market: "",
      })
    }
  }
  for (const row of skus) {
    if (thresholds.rtsRate !== null && row.rtsRate !== null && row.rtsRate > thresholds.rtsRate) {
      alerts.push({
        id: `sku-rts-${row.key}`,
        tone: "warn",
        title: `SKU ${row.key} hoàn cao`,
        detail: `${formatPercent(row.rtsRate)} trên ${row.shippedOut} đơn đã giao courier.`,
        platform: "",
        market: "",
      })
    }
  }
  for (const row of inventory) {
    if (row.status === "stockout" || row.onHand <= 0) {
      alerts.push({
        id: `stock-${row.sku}`,
        tone: "bad",
        title: `${row.sku} hết hàng`,
        detail: `Tồn ${row.onHand}, điểm đặt lại ${row.reorderPoint}.`,
        platform: row.platform,
        market: row.market,
      })
    } else if (row.status === "low" || row.onHand <= row.reorderPoint) {
      alerts.push({
        id: `low-${row.sku}`,
        tone: "warn",
        title: `${row.sku} sắp hết`,
        detail: `Tồn ${row.onHand}, hàng đang về ${row.inbound}.`,
        platform: row.platform,
        market: row.market,
      })
    }
  }
  for (const row of fees) {
    if (row.result === "QC_FAIL") {
      alerts.push({
        id: `fee-qc-${row.level}-${row.key}`,
        tone: "bad",
        title: "Phí sàn hai nguồn không khớp",
        detail: `${row.key}: GMV và phí giữ nguyên từng nguồn. Không lấy trung bình. Không đổi giá.`,
        platform: row.platform,
        market: row.market,
      })
    }
    if ((row.level === "sku" || row.level === "store_day") && (row.result === "OVER" || row.result === "NEAR")) {
      alerts.push({
        id: `fee-${row.result}-${row.level}-${row.key}`,
        tone: row.result === "OVER" ? "bad" : "warn",
        title: row.result === "OVER" ? "Phí sàn vượt trần" : "Phí sàn sắp chạm trần",
        detail: `${row.feePct ?? "—"}% / trần ${row.cap ?? "—"}%. Khoản lớn nhất: ${row.topProgram || "—"}. Đề xuất: ${row.proposal || "chỉ theo dõi"}. Không tự tắt chương trình và không đổi giá.`,
        platform: row.platform,
        market: row.market,
      })
    }
  }
  for (const row of fx) {
    if (row.qc === "NO_RATE" || row.qc === "RATE_MISMATCH") {
      alerts.push({
        id: `fx-${row.qc}-${row.date}-${row.currency}`,
        tone: "bad",
        title: row.qc === "NO_RATE" ? "Thiếu tỷ giá" : "Tỷ giá hai nguồn không khớp",
        detail: `${row.nativeAmount} ${row.currency}. Không tự đặt tỷ giá và không lấy trung bình.`,
        platform: row.platform,
        market: row.market,
      })
    }
  }
  return alerts.filter((alert) => {
    if (!alert.platform && !alert.market) return true
    return dim(alert.platform, filters.platform) && dim(alert.market, filters.market)
  })
}

export function dateSpan(bundle: Bundle) {
  const dates = [
    ...bundle.fx.map((row) => row.date),
    ...bundle.ads.map((row) => row.date),
    ...bundle.orders.map((row) => row.createdDate),
    ...bundle.sku.map((row) => row.date),
    ...bundle.fees.map((row) => row.date),
  ].filter(Boolean).sort()
  return { from: dates[0] || "2026-01-01", to: dates[dates.length - 1] || "2026-12-31" }
}

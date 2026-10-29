import { readFileSync } from "node:fs"
import { join } from "node:path"

import { num, parseCsv } from "@/lib/csv"
import type {
  AdsFact,
  Bundle,
  CancelFact,
  CustomRate,
  FxFact,
  FxMode,
  FeeComponent,
  FeeRow,
  FeeWhatIf,
  InventoryRow,
  QueueTask,
  RoadmapStep,
  VideoFact,
  MarketRate,
  OrderRow,
  SkuRow,
  Thresholds,
  WalletFact,
} from "@/lib/types"

const SAMPLE = join(process.cwd(), "sample")

function readLocal(dir: string, name: string) {
  try {
    return readFileSync(join(dir, name), "utf8")
  } catch {
    return ""
  }
}

function mapFx(rows: Record<string, string>[]): FxFact[] {
  return rows.map((row) => ({
    date: row.date || "",
    store: row.store || "",
    platform: row.platform || "",
    market: row.market || "",
    stream: row.stream || "",
    nativeAmount: num(row.native_amount) ?? 0,
    currency: (row.currency || "").toUpperCase(),
    baseCurrency: (row.base_currency || "VND").toUpperCase(),
    marketRate: row.market_rate || "",
    marketRateDate: row.market_rate_date || "",
    marketRateMonth: row.market_rate_month || "",
    marketFallback: row.market_fallback || "",
    amountMarket: num(row.amount_market),
    customRate: row.custom_rate || "",
    customRateDate: row.custom_rate_date || "",
    customRateMonth: row.custom_rate_month || "",
    customFallback: row.custom_fallback || "",
    amountCustom: num(row.amount_custom),
    appliedMode: row.applied_mode || "",
    appliedRate: row.applied_rate || "",
    appliedRateDate: row.applied_rate_date || "",
    appliedRateMonth: row.applied_rate_month || "",
    appliedFallback: row.applied_fallback || "",
    amountBase: num(row.amount_base),
    qc: row.qc || "",
    source: row.source || "",
    readTime: row.read_time || "",
  }))
}

function mapOrders(rows: Record<string, string>[]): OrderRow[] {
  return rows.map((row) => ({
    orderId: row.order_id || "",
    createdDate: row.created_date || "",
    store: row.store || "",
    platform: row.platform || "",
    market: row.market || "",
    category: row.category || "",
    product: row.product || "",
    sku: row.sku || "",
    staff: row.staff || "",
    status: row.status || "",
    cancelledBy: row.cancelled_by || "",
    cancelReason: row.cancel_reason || "",
    courierPickupTime: row.courier_pickup_time || "",
    outcome: row.outcome || "",
    currency: (row.currency || "").toUpperCase(),
  }))
}

function mapAds(rows: Record<string, string>[]): AdsFact[] {
  return rows.map((row) => ({
    date: row.date || "",
    store: row.store || "",
    platform: row.platform || "",
    market: row.market || "",
    spend: num(row.spend) ?? 0,
    currency: (row.currency || "").toUpperCase(),
    gmvAttributed: num(row.gmv_attributed),
    roas: num(row.roas),
    spendPctGmv: num(row.spend_pct_gmv),
    balance: num(row.balance),
    daysLeft: num(row.days_left),
    topupAmount: num(row.topup_amount),
    matchStatus: row.match_status || "",
    source: row.source || "",
    readTime: row.read_time || "",
    timezone: row.timezone || "",
  }))
}

function mapWallet(rows: Record<string, string>[]): WalletFact[] {
  return rows.map((row) => ({
    date: row.date || "",
    store: row.store || "",
    platform: row.platform || "",
    market: row.market || "",
    available: num(row.available),
    pending: num(row.pending),
    incoming: num(row.incoming),
    currency: (row.currency || "").toUpperCase(),
    withdrawalAmount: num(row.withdrawal_amount),
    withdrawalFee: num(row.withdrawal_fee),
    withdrawalNet: num(row.withdrawal_net),
    bankLast4: row.bank_last4 || "",
    withdrawalStatus: row.withdrawal_status || "",
    matchStatus: row.match_status || "",
    source: row.source || "",
    readTime: row.read_time || "",
    timezone: row.timezone || "",
  }))
}

function mapSku(rows: Record<string, string>[]): SkuRow[] {
  return rows.map((row) => ({
    date: row.date || "",
    store: row.store || "",
    platform: row.platform || "",
    market: row.market || "",
    staff: row.staff || "",
    category: row.category || "",
    product: row.product || "",
    sku: row.sku || "",
    unitsSold: num(row.units_sold) ?? 0,
    revenue: num(row.revenue) ?? 0,
    cogs: num(row.cogs) ?? 0,
    adsAllocated: num(row.ads_allocated) ?? 0,
    fees: num(row.fees) ?? 0,
    refunds: num(row.refunds) ?? 0,
    currency: (row.currency || "").toUpperCase(),
    source: row.source || "",
  }))
}

function mapInventory(rows: Record<string, string>[]): InventoryRow[] {
  return rows.map((row) => ({
    sku: row.sku || "",
    product: row.product || "",
    category: row.category || "",
    store: row.store || "",
    platform: row.platform || "",
    market: row.market || "",
    onHand: num(row.on_hand) ?? 0,
    inbound: num(row.inbound) ?? 0,
    daysCover: num(row.days_cover),
    reorderPoint: num(row.reorder_point) ?? 0,
    status: row.status || "",
    unitCost: num(row.unit_cost),
    currency: (row.currency || "").toUpperCase(),
    source: row.source || "",
  }))
}

function mapAi(rows: Record<string, string>[]) {
  return rows.map((row) => ({
    loggedAt: row.logged_at || "",
    runId: row.run_id || "",
    store: row.store || "",
    platform: row.platform || "",
    market: row.market || "",
    staff: row.staff || "",
    module: row.module || "",
    model: row.model || "",
    inputTokens: num(row.input_tokens),
    outputTokens: num(row.output_tokens),
    cost: num(row.cost),
    currency: (row.currency || "").toUpperCase(),
    note: row.note || "",
  }))
}

function mapCancel(rows: Record<string, string>[]): CancelFact[] {
  return rows.map((row) => ({
    level: row.level || "",
    key: row.key || "",
    period: row.period || "",
    ordersCreated: num(row.orders_created) ?? 0,
    cancelled: num(row.cancelled) ?? 0,
    cancelRate: num(row.cancel_rate),
    cancelledBuyer: num(row.cancelled_buyer) ?? 0,
    cancelledSeller: num(row.cancelled_seller) ?? 0,
    cancelledSystem: num(row.cancelled_system) ?? 0,
    shippedOut: num(row.shipped_out) ?? 0,
    rts: num(row.rts) ?? 0,
    rtsRate: num(row.rts_rate),
  }))
}

function mapMarket(rows: Record<string, string>[]): MarketRate[] {
  return rows.flatMap((row) => {
    const rate = num(row.rate)
    if (rate === null) return []
    return [{
      date: row.date || "",
      currency: (row.currency || "").toUpperCase(),
      base: (row.base || "VND").toUpperCase(),
      rate,
      source: row.source || "",
    }]
  })
}

function mapCustom(rows: Record<string, string>[]): CustomRate[] {
  return rows.map((row) => ({
    month: row.month || "",
    currency: (row.currency || "").toUpperCase(),
    rate: num(row.rate),
    mode: (row.mode || "").toLowerCase(),
  }))
}

function bundleFrom(tables: Record<string, string>, sourceLabel: string, example: boolean): Bundle {
  const fx = mapFx(parseCsv(tables.fx || ""))
  const base = fx.find((row) => row.baseCurrency)?.baseCurrency || "VND"
  let thresholds: Thresholds = {
    cancelRate: null,
    rtsRate: null,
    roasFloor: null,
    daysLeft: null,
    label: "",
  }
  if (tables.thresholds.trim().startsWith("{")) {
    const parsed = JSON.parse(tables.thresholds) as {
      cancel_rate?: number
      rts_rate?: number
      roas_floor?: number
      days_left?: number
      label?: string
    }
    thresholds = {
      cancelRate: parsed.cancel_rate ?? null,
      rtsRate: parsed.rts_rate ?? null,
      roasFloor: parsed.roas_floor ?? null,
      daysLeft: parsed.days_left ?? null,
      label: parsed.label || "",
    }
  } else if (tables.thresholds.trim()) {
    const row = parseCsv(tables.thresholds)[0] || {}
    thresholds = {
      cancelRate: num(row.cancel_rate),
      rtsRate: num(row.rts_rate),
      roasFloor: num(row.roas_floor),
      daysLeft: num(row.days_left),
      label: row.label || "",
    }
  }
  const mode = (process.env.FX_MODE === "market" ? "market" : "custom") as FxMode
  return {
    example,
    sourceLabel,
    baseCurrency: base,
    defaultMode: mode,
    fx,
    marketRates: mapMarket(parseCsv(tables.market || "")),
    customRates: mapCustom(parseCsv(tables.custom || "")),
    orders: mapOrders(parseCsv(tables.orders || "")),
    cancelFacts: mapCancel(parseCsv(tables.cancel || "")),
    ads: mapAds(parseCsv(tables.ads || "")),
    wallet: mapWallet(parseCsv(tables.wallet || "")),
    sku: mapSku(parseCsv(tables.sku || "")),
    inventory: mapInventory(parseCsv(tables.inventory || "")),
    aiCosts: mapAi(parseCsv(tables.ai || "")),
    fees: [...mapFeeOrders(parseCsv(tables.feeOrders || "")), ...mapFeeRollups(parseCsv(tables.fees || ""))],
    feeComponents: mapFeeComponents(parseCsv(tables.feeComponents || "")),
    feeWhatIfs: mapFeeWhatIfs(parseCsv(tables.feeWhatIfs || "")),
    thresholds,
    roadmap: mapRoadmap(parseCsv(tables.roadmap || "")),
    queue: mapQueue(parseCsv(tables.queue || "")),
    videos: mapVideos(parseCsv(tables.videos || "")),
  }
}

function mapVideos(rows: Record<string, string>[]): VideoFact[] {
  return rows.map((row) => ({
    videoId: row.video_id || "",
    date: row.date || "",
    store: row.store || "",
    platform: row.platform || "",
    market: row.market || "",
    product: row.product || "",
    variation: row.variation || "",
    placement: row.placement || "",
    status: row.status || "",
    reason: row.reason || "",
    views: num(row.views),
    likes: num(row.likes),
    clicks: num(row.clicks),
    orders: num(row.orders),
    gmv: num(row.gmv),
    currency: (row.currency || "").toUpperCase(),
    qc: row.qc || "",
    viewsFloor: num(row.views_floor),
    readTime: row.read_time || "",
  }))
}

function mapQueue(rows: Record<string, string>[]): QueueTask[] {
  return rows.map((row) => ({
    store: row.store || "",
    platform: row.platform || "",
    level: row.level || "",
    pin: row.pin || "",
    action: row.action || "",
    target: row.target || "",
    status: row.status || "",
    chunk: row.chunk || "",
    chunks: row.chunks || "",
    minutes: row.minutes || "",
    gate: row.gate || "",
    day: row.day || "",
  }))
}

function mapRoadmap(rows: Record<string, string>[]): RoadmapStep[] {
  return rows.map((row) => ({
    period: row.period || "",
    cadence: row.cadence || "",
    stage: row.stage || "",
    store: row.store || "",
    platform: row.platform || "",
    market: row.market || "",
    module: row.module || "",
    milestone: row.milestone || "",
    kpi: row.kpi || "",
    status: row.status || "",
  }))
}

function mapFeeOrders(rows: Record<string, string>[]): FeeRow[] {
  return rows.map((row) => ({
    level: "order",
    key: row.order_id || "",
    sku: row.sku || "",
    period: row.date || "",
    date: row.date || "",
    store: row.store || "",
    platform: row.platform || "",
    market: row.market || "",
    gmv: num(row.gmv),
    fee: num(row.fee),
    feePct: num(row.fee_pct),
    cap: num(row.cap_percent),
    result: row.result || "",
    topProgram: row.top_program || "",
    proposal: row.proposal || "",
    currency: row.currency || "",
    qc: row.qc || "",
  }))
}

function mapFeeRollups(rows: Record<string, string>[]): FeeRow[] {
  return rows.map((row) => ({
    level: row.level || "",
    key: row.key || "",
    sku: row.level === "sku" ? (row.key || "").split("|").pop() || "" : "",
    period: row.period || "",
    date: row.date || "",
    store: row.store || "",
    platform: row.platform || "",
    market: row.market || "",
    gmv: num(row.gmv),
    fee: num(row.fee),
    feePct: num(row.fee_pct),
    cap: num(row.cap_percent),
    result: row.result || "",
    topProgram: row.top_program || "",
    proposal: row.proposal || "",
    currency: row.currency || "",
    qc: row.qc || "",
  }))
}

function mapFeeComponents(rows: Record<string, string>[]): FeeComponent[] {
  return rows.map((row) => ({
    level: row.level || "",
    key: row.key || "",
    date: row.date || "",
    store: row.store || "",
    platform: row.platform || "",
    market: row.market || "",
    component: row.component || "",
    amount: num(row.amount),
    pctGmv: num(row.pct_gmv),
    currency: row.currency || "",
  }))
}

function mapFeeWhatIfs(rows: Record<string, string>[]): FeeWhatIf[] {
  return rows.map((row) => ({
    action: row.action || "",
    level: row.level || "",
    key: row.key || "",
    program: row.program || "",
    currentPct: num(row.current_pct),
    nextPct: num(row.next_pct),
    cap: num(row.cap_percent),
    result: row.result || "",
    store: row.store || "",
    platform: row.platform || "",
    market: row.market || "",
    date: row.date || "",
    currency: row.currency || "",
    approval: row.approval || "",
    applied: row.applied || "",
  }))
}

async function sheetValues(spreadsheetId: string, tab: string) {
  const token = process.env.GOOGLE_SHEETS_ACCESS_TOKEN || ""
  const key = process.env.GOOGLE_SHEETS_API_KEY || ""
  const range = encodeURIComponent(`'${tab.replaceAll("'", "''")}'!A1:ZZ`)
  const url = new URL(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`)
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  else if (key) url.searchParams.set("key", key)
  else throw new Error("Thiếu GOOGLE_SHEETS_ACCESS_TOKEN hoặc GOOGLE_SHEETS_API_KEY.")
  const response = await fetch(url, { headers, cache: "no-store" })
  if (response.status === 400) return ""
  if (!response.ok) throw new Error(`Google Sheets trả về ${response.status} khi đọc ${tab}.`)
  const json = (await response.json()) as { values?: string[][] }
  const values = json.values || []
  if (!values.length) return ""
  return values.map((row) => row.map((cell) => {
    const text = String(cell ?? "")
    return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
  }).join(",")).join("\n")
}

export async function loadBundle(): Promise<Bundle> {
  const source = (process.env.DATA_SOURCE || "sample").toLowerCase()
  if (source === "sheets") {
    const id = process.env.GOOGLE_SHEETS_ID || ""
    if (!id) throw new Error("Thiếu GOOGLE_SHEETS_ID.")
    const [fx, market, custom, orders, cancel, ads, wallet, sku, inventory, thresholds, ai, fees, feeOrders, feeComponents, feeWhatIfs, roadmap, queue, videos] = await Promise.all([
      sheetValues(id, "FxFacts"),
      sheetValues(id, "MarketRates"),
      sheetValues(id, "Settings/FX"),
      sheetValues(id, "Orders"),
      sheetValues(id, "CancelFacts"),
      sheetValues(id, "AdsFacts"),
      sheetValues(id, "WalletFacts"),
      sheetValues(id, "SkuPnl"),
      sheetValues(id, "Inventory"),
      sheetValues(id, "Thresholds"),
      sheetValues(id, "AiCost"),
      sheetValues(id, "FeeFacts"),
      sheetValues(id, "FeeOrders"),
      sheetValues(id, "FeeComponents"),
      sheetValues(id, "FeeWhatIf"),
      sheetValues(id, "Roadmap"),
      sheetValues(id, "Queue"),
      sheetValues(id, "VideoFacts"),
    ])
    return bundleFrom({ fx, market, custom, orders, cancel, ads, wallet, sku, inventory, thresholds, ai, fees, feeOrders, feeComponents, feeWhatIfs, roadmap, queue, videos }, "Google Sheets", false)
  }
  const dir = source === "csv" ? (process.env.CSV_DIR || SAMPLE) : SAMPLE
  const tables = {
    fx: readLocal(dir, "fx-facts.csv"),
    market: readLocal(dir, "market-rates.csv"),
    custom: readLocal(dir, "settings-fx.csv"),
    orders: readLocal(dir, "orders.csv"),
    cancel: readLocal(dir, "cancel-facts.csv"),
    ads: readLocal(dir, "ads-facts.csv"),
    wallet: readLocal(dir, "wallet-facts.csv"),
    sku: readLocal(dir, "sku-pnl.csv"),
    inventory: readLocal(dir, "inventory.csv"),
    thresholds: readLocal(dir, "thresholds.json"),
    ai: readLocal(dir, "ai-cost.csv"),
    fees: readLocal(dir, "fee-rollups.csv"),
    feeOrders: readLocal(dir, "fee-orders.csv"),
    feeComponents: readLocal(dir, "fee-components.csv"),
    feeWhatIfs: readLocal(dir, "fee-whatif.csv"),
    roadmap: readLocal(dir, "roadmap.csv"),
    queue: readLocal(dir, "queue.csv"),
    videos: readLocal(dir, "video-performance.csv"),
  }
  if (!tables.fx && !tables.orders && !tables.ads) {
    throw new Error(`Không đọc được CSV trong ${dir}.`)
  }
  return bundleFrom(tables, source === "csv" ? dir : "sample", source !== "csv")
}

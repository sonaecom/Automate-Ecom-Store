export type FxMode = "market" | "custom"
export type CurrencyView = "native" | "base"

export type FxFact = {
  date: string
  store: string
  platform: string
  market: string
  stream: string
  nativeAmount: number
  currency: string
  baseCurrency: string
  marketRate: string
  marketRateDate: string
  marketRateMonth: string
  marketFallback: string
  amountMarket: number | null
  customRate: string
  customRateDate: string
  customRateMonth: string
  customFallback: string
  amountCustom: number | null
  appliedMode: string
  appliedRate: string
  appliedRateDate: string
  appliedRateMonth: string
  appliedFallback: string
  amountBase: number | null
  qc: string
  source: string
  readTime: string
}

export type MarketRate = {
  date: string
  currency: string
  base: string
  rate: number
  source: string
}

export type CustomRate = {
  month: string
  currency: string
  rate: number | null
  mode: string
}

export type OrderRow = {
  orderId: string
  createdDate: string
  store: string
  platform: string
  market: string
  category: string
  product: string
  sku: string
  staff: string
  status: string
  cancelledBy: string
  cancelReason: string
  courierPickupTime: string
  outcome: string
  currency: string
}

export type AdsFact = {
  date: string
  store: string
  platform: string
  market: string
  spend: number
  currency: string
  gmvAttributed: number | null
  roas: number | null
  spendPctGmv: number | null
  balance: number | null
  daysLeft: number | null
  topupAmount: number | null
  matchStatus: string
  source: string
  readTime: string
  timezone: string
}

export type WalletFact = {
  date: string
  store: string
  platform: string
  market: string
  available: number | null
  pending: number | null
  incoming: number | null
  currency: string
  withdrawalAmount: number | null
  withdrawalFee: number | null
  withdrawalNet: number | null
  bankLast4: string
  withdrawalStatus: string
  matchStatus: string
  source: string
  readTime: string
  timezone: string
}

export type SkuRow = {
  date: string
  store: string
  platform: string
  market: string
  staff: string
  category: string
  product: string
  sku: string
  unitsSold: number
  revenue: number
  cogs: number
  adsAllocated: number
  fees: number
  refunds: number
  currency: string
  source: string
}

export type InventoryRow = {
  sku: string
  product: string
  category: string
  store: string
  platform: string
  market: string
  onHand: number
  inbound: number
  daysCover: number | null
  reorderPoint: number
  status: string
  unitCost: number | null
  currency: string
  source: string
}

export type CancelFact = {
  level: string
  key: string
  period: string
  ordersCreated: number
  cancelled: number
  cancelRate: number | null
  cancelledBuyer: number
  cancelledSeller: number
  cancelledSystem: number
  shippedOut: number
  rts: number
  rtsRate: number | null
}

export type Thresholds = {
  cancelRate: number | null
  rtsRate: number | null
  roasFloor: number | null
  daysLeft: number | null
  label: string
}

export type AiCost = {
  loggedAt: string
  runId: string
  store: string
  platform: string
  market: string
  staff: string
  module: string
  model: string
  inputTokens: number | null
  outputTokens: number | null
  cost: number | null
  currency: string
  note: string
}

export type FeeRow = {
  level: string
  key: string
  sku: string
  period: string
  date: string
  store: string
  platform: string
  market: string
  gmv: number | null
  fee: number | null
  feePct: number | null
  cap: number | null
  result: string
  topProgram: string
  proposal: string
  currency: string
  qc: string
}

export type Bundle = {
  example: boolean
  sourceLabel: string
  baseCurrency: string
  defaultMode: FxMode
  fx: FxFact[]
  marketRates: MarketRate[]
  customRates: CustomRate[]
  orders: OrderRow[]
  cancelFacts: CancelFact[]
  ads: AdsFact[]
  wallet: WalletFact[]
  sku: SkuRow[]
  inventory: InventoryRow[]
  aiCosts: AiCost[]
  fees: FeeRow[]
  thresholds: Thresholds
}

export type Filters = {
  from: string
  to: string
  platform: string
  market: string
  store: string
  currencyView: CurrencyView
  fxMode: FxMode
}

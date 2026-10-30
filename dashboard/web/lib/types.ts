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

export type FeeComponent = {
  level: string
  key: string
  date: string
  store: string
  platform: string
  market: string
  component: string
  amount: number | null
  pctGmv: number | null
  currency: string
}

export type FeeWhatIf = {
  action: string
  level: string
  key: string
  program: string
  currentPct: number | null
  nextPct: number | null
  cap: number | null
  result: string
  store: string
  platform: string
  market: string
  date: string
  currency: string
  approval: string
  applied: string
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

export type RoadmapStep = {
  period: string
  cadence: string
  stage: string
  store: string
  platform: string
  market: string
  module: string
  milestone: string
  kpi: string
  status: string
}

export type VideoFact = {
  videoId: string
  date: string
  store: string
  platform: string
  market: string
  product: string
  variation: string
  placement: string
  status: string
  reason: string
  views: number | null
  likes: number | null
  clicks: number | null
  orders: number | null
  gmv: number | null
  currency: string
  qc: string
  viewsFloor: number | null
  readTime: string
}

export type QueueTask = {
  store: string
  platform: string
  level: string
  pin: string
  action: string
  target: string
  status: string
  chunk: string
  chunks: string
  minutes: string
  gate: string
  day: string
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
  feeComponents: FeeComponent[]
  feeWhatIfs: FeeWhatIf[]
  thresholds: Thresholds
  roadmap: RoadmapStep[]
  queue: QueueTask[]
  videos: VideoFact[]
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

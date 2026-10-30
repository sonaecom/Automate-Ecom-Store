import type { CustomRate, FxMode, MarketRate } from "@/lib/types"

export type Quote = {
  amount: number | null
  rate: string
  rateDate: string
  rateMonth: string
  mode: string
  fallback: string
}

const EMPTY: Quote = {
  amount: null,
  rate: "",
  rateDate: "",
  rateMonth: "",
  mode: "",
  fallback: "no_rate",
}

function formatRate(value: number) {
  return value.toFixed(8).replace(/(\.\d*?[1-9])0+$/, "$1").replace(/\.0+$/, "")
}

function formatAmount(value: number) {
  const rounded = Math.round(value * 10000) / 10000
  return rounded.toFixed(4).replace(/(\.\d*?[1-9])0+$/, "$1").replace(/\.0+$/, "")
}

function sameRate(a: number, b: number) {
  const scale = Math.max(1, Math.abs(a), Math.abs(b))
  return Math.abs(a - b) <= 1e-8 * scale
}

type Indexed = { rate: number; mismatch: boolean; date: string; month: string }

function indexDaily(rows: MarketRate[], base: string) {
  const map = new Map<string, Indexed>()
  for (const row of rows) {
    if (row.base !== base || row.rate <= 0) continue
    const key = `${row.date}|${row.currency}`
    const current = map.get(key)
    if (!current) map.set(key, { rate: row.rate, mismatch: false, date: row.date, month: "" })
    else if (!sameRate(current.rate, row.rate)) current.mismatch = true
  }
  return map
}

function indexCustom(rows: CustomRate[], mode: "custom" | "market") {
  const map = new Map<string, Indexed>()
  for (const row of rows) {
    if (row.mode !== mode || row.rate === null || row.rate <= 0) continue
    const key = `${row.month}|${row.currency}`
    const current = map.get(key)
    if (!current) map.set(key, { rate: row.rate, mismatch: false, date: "", month: row.month })
    else if (!sameRate(current.rate, row.rate)) current.mismatch = true
  }
  return map
}

function latest(map: Map<string, Indexed>, currency: string, end: string) {
  let best = ""
  for (const key of map.keys()) {
    const [stamp, code] = key.split("|")
    if (code !== currency || stamp >= end) continue
    if (stamp > best) best = stamp
  }
  return best ? map.get(`${best}|${currency}`) ?? null : null
}

function fromHit(native: number, hit: Indexed | null, fallback: string, mode: string): Quote {
  if (!hit) return EMPTY
  if (hit.mismatch) {
    return { ...EMPTY, fallback: "rate_mismatch", rateDate: hit.date, rateMonth: hit.month }
  }
  const stored = Number(formatRate(hit.rate))
  return {
    amount: Number(formatAmount(native * stored)),
    rate: formatRate(stored),
    rateDate: hit.date,
    rateMonth: hit.month,
    mode,
    fallback,
  }
}

export function convertAmount(
  native: number,
  currency: string,
  date: string,
  base: string,
  mode: FxMode,
  marketRates: MarketRate[],
  customRates: CustomRate[],
): Quote {
  const month = date.slice(0, 7)
  if (currency === base) {
    return {
      amount: Number(formatAmount(native)),
      rate: "1",
      rateDate: date,
      rateMonth: month,
      mode: "identity",
      fallback: "none",
    }
  }
  const daily = indexDaily(marketRates, base)
  const custom = indexCustom(customRates, "custom")
  const monthly = indexCustom(customRates, "market")
  const apply = (hit: Indexed | null, fallback: string, used: string) => fromHit(native, hit, fallback, used)

  if (mode === "market") {
    const exact = daily.get(`${date}|${currency}`)
    if (exact) return apply(exact, "none", "market")
    const prior = latest(daily, currency, date)
    if (prior) return apply(prior, "market_on_or_before", "market")
    const monthRate = monthly.get(`${month}|${currency}`)
    if (monthRate) return apply(monthRate, "monthly_market", "market")
    return EMPTY
  }

  const exactCustom = custom.get(`${month}|${currency}`)
  if (exactCustom) return apply(exactCustom, "none", "custom")
  const priorCustom = latest(custom, currency, month)
  if (priorCustom) return apply(priorCustom, "earlier_custom_month", "custom")
  const exactDaily = daily.get(`${date}|${currency}`)
  if (exactDaily) return apply(exactDaily, "market_for_missing_custom", "market")
  const priorDaily = latest(daily, currency, date)
  if (priorDaily) return apply(priorDaily, "market_on_or_before", "market")
  const monthRate = monthly.get(`${month}|${currency}`)
  if (monthRate) return apply(monthRate, "monthly_market", "market")
  return EMPTY
}

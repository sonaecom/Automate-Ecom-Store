"use client"

import { createContext, useContext, useMemo, useState, type ReactNode } from "react"

import { buildView, dateSpan, type DashboardView } from "@/lib/metrics"
import type { Bundle, CustomRate, Filters } from "@/lib/types"

type DashboardContextValue = {
  bundle: Bundle
  filters: Filters
  setFilters: (next: Filters) => void
  rates: CustomRate[]
  setRate: (month: string, currency: string, rate: number) => void
  resetRates: () => void
  dirty: boolean
  view: DashboardView
}

const DashboardContext = createContext<DashboardContextValue | null>(null)

export function DashboardProvider({
  bundle,
  children,
}: {
  bundle: Bundle
  children: ReactNode
}) {
  const span = dateSpan(bundle)
  const [filters, setFilters] = useState<Filters>({
    from: span.from,
    to: span.to,
    platform: "Tất cả",
    market: "Tất cả",
    store: "Tất cả",
    currencyView: "base",
    fxMode: bundle.defaultMode,
  })
  const [rates, setRates] = useState(bundle.customRates)
  const dirty = JSON.stringify(rates) !== JSON.stringify(bundle.customRates)
  const view = useMemo(
    () => buildView(bundle, filters, rates, dirty),
    [bundle, filters, rates, dirty],
  )

  const value = useMemo<DashboardContextValue>(() => ({
    bundle,
    filters,
    setFilters,
    rates,
    setRate: (month, currency, rate) => {
      setRates((current) => current.map((row) => (
        row.month === month && row.currency === currency ? { ...row, rate } : row
      )))
    },
    resetRates: () => setRates(bundle.customRates),
    dirty,
    view,
  }), [bundle, filters, rates, dirty, view])

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>
}

export function useDashboard() {
  const value = useContext(DashboardContext)
  if (!value) throw new Error("useDashboard phải nằm trong DashboardProvider")
  return value
}

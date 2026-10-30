"use client"

import { useDashboard } from "@/components/dashboard-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { platformLabel } from "@/lib/format"

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))].sort()
}

export function Filters() {
  const { bundle, filters, setFilters } = useDashboard()
  const platforms = unique([
    ...bundle.fx.map((row) => row.platform),
    ...bundle.orders.map((row) => row.platform),
  ])
  const markets = unique([
    ...bundle.fx.map((row) => row.market),
    ...bundle.orders.map((row) => row.market),
  ])
  const stores = unique([
    ...bundle.fx.map((row) => row.store),
    ...bundle.orders.map((row) => row.store),
  ])

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
      <label className="grid gap-1 text-xs">
        <Label>Từ ngày</Label>
        <Input
          type="date"
          value={filters.from}
          onChange={(event) => setFilters({ ...filters, from: event.target.value })}
        />
      </label>
      <label className="grid gap-1 text-xs">
        <Label>Đến ngày</Label>
        <Input
          type="date"
          value={filters.to}
          onChange={(event) => setFilters({ ...filters, to: event.target.value })}
        />
      </label>
      <Choice label="Sàn" value={filters.platform} options={platforms} display={platformLabel} onChange={(platform) => setFilters({ ...filters, platform })} />
      <Choice label="Thị trường" value={filters.market} options={markets} onChange={(market) => setFilters({ ...filters, market })} />
      <Choice label="Cửa hàng" value={filters.store} options={stores} onChange={(store) => setFilters({ ...filters, store })} />
      <div className="grid gap-1">
        <Label className="text-xs">Tiền tệ</Label>
        <div className="flex h-8 overflow-hidden rounded-lg border">
          <Button
            type="button"
            variant={filters.currencyView === "native" ? "default" : "ghost"}
            className="h-8 flex-1 rounded-none"
            onClick={() => setFilters({ ...filters, currencyView: "native" })}
          >
            Nguyên tệ
          </Button>
          <Button
            type="button"
            variant={filters.currencyView === "base" ? "default" : "ghost"}
            className="h-8 flex-1 rounded-none"
            onClick={() => setFilters({ ...filters, currencyView: "base" })}
          >
            {bundle.baseCurrency}
          </Button>
        </div>
      </div>
    </div>
  )
}

function Choice({
  label,
  value,
  options,
  display,
  onChange,
}: {
  label: string
  value: string
  options: string[]
  display?: (value: string) => string
  onChange: (value: string) => void
}) {
  return (
    <div className="grid gap-1">
      <Label className="text-xs">{label}</Label>
      <Select
        value={value}
        onValueChange={(next) => onChange(next || "Tất cả")}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Tất cả" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Tất cả">Tất cả</SelectItem>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {display ? display(option) : option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

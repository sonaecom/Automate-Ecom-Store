"use client"

import { useState } from "react"

import { DataTable } from "@/components/data-table"
import { useDashboard } from "@/components/dashboard-provider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatNumber, formatPercent, platformLabel } from "@/lib/format"

const tabs = [
  { id: "platform", label: "Sàn" },
  { id: "market", label: "Thị trường" },
  { id: "store", label: "Cửa hàng" },
  { id: "staff", label: "Nhân sự" },
] as const

export default function BreakdownPage() {
  const { view, filters, bundle } = useDashboard()
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("platform")
  const rows = view.groups[tab]
  return (
    <div className="grid gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Theo sàn, thị trường, cửa hàng, nhân sự</h1>
        <p className="text-sm text-muted-foreground">
          Doanh thu và ads ở tiền {filters.currencyView === "base" ? bundle.baseCurrency : "gốc, không cộng khác tiền tệ"}. Nhân sự lấy doanh thu từ bảng SKU.
        </p>
      </div>
      <Tabs value={tab} onValueChange={(value) => setTab(value as typeof tab)}>
        <TabsList className="flex h-auto w-full flex-wrap">
          {tabs.map((item) => (
            <TabsTrigger key={item.id} value={item.id}>{item.label}</TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((item) => (
          <TabsContent key={item.id} value={item.id}>
            <DataTable
              columns={[
                { key: "name", label: item.label },
                { key: "sales", label: "Doanh thu", align: "right" },
                { key: "ads", label: "Ads", align: "right" },
                { key: "orders", label: "Đơn tạo", align: "right" },
                { key: "cancel", label: "Huỷ", align: "right" },
                { key: "rts", label: "Hoàn", align: "right" },
              ]}
              rows={rows.map((row) => ({
                id: row.key,
                name: item.id === "platform" ? platformLabel(row.key) : row.key,
                sales: filters.currencyView === "base" ? formatNumber(row.sales) : "—",
                ads: item.id === "staff" ? "—" : (filters.currencyView === "base" ? formatNumber(row.adSpend) : "—"),
                orders: formatNumber(row.orders),
                cancel: formatPercent(row.cancelRate),
                rts: formatPercent(row.rtsRate),
              }))}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

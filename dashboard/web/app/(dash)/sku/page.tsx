"use client"

import { DataTable } from "@/components/data-table"
import { useDashboard } from "@/components/dashboard-provider"
import { platformLabel } from "@/lib/format"

export default function SkuPage() {
  const { view } = useDashboard()
  const profit = view.sku.reduce((total, row) => total + (row.profitView.amount ?? 0), 0)
  const oneCurrency = new Set(view.sku.map((row) => row.profitView.currency)).size <= 1
  return (
    <div className="grid gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Lãi lỗ SKU</h1>
        <p className="text-sm text-muted-foreground">
          Lãi = doanh thu − giá vốn − ads phân bổ − phí − hoàn tiền. Cột tỷ giá là mức đã dùng.
          {" "}
          {oneCurrency && view.sku[0]
            ? `Tổng lãi trong bộ lọc: ${profit.toLocaleString("vi-VN")} ${view.sku[0].profitView.currency}.`
            : "Nhiều tiền tệ, không cộng thành một số."}
        </p>
      </div>
      <DataTable
        columns={[
          { key: "sku", label: "SKU" },
          { key: "product", label: "Sản phẩm" },
          { key: "store", label: "Cửa hàng" },
          { key: "platform", label: "Sàn" },
          { key: "staff", label: "Nhân sự" },
          { key: "units", label: "SL", align: "right" },
          { key: "revenue", label: "Doanh thu", align: "right" },
          { key: "profit", label: "Lãi", align: "right" },
          { key: "rate", label: "Tỷ giá" },
        ]}
        rows={view.sku.map((row) => ({
          id: `${row.date}-${row.sku}-${row.store}`,
          sku: row.sku,
          product: row.product,
          store: row.store,
          platform: platformLabel(row.platform),
          staff: row.staff,
          units: row.unitsSold,
          revenue: row.revenueView.text,
          profit: row.profitView.text,
          rate: row.profitView.hint,
        }))}
      />
    </div>
  )
}

"use client"

import { DataTable } from "@/components/data-table"
import { useDashboard } from "@/components/dashboard-provider"
import { Badge } from "@/components/ui/badge"
import { formatNumber, platformLabel } from "@/lib/format"

const statusLabel: Record<string, string> = {
  ok: "Đủ hàng",
  low: "Sắp hết",
  stockout: "Hết hàng",
}

export default function InventoryPage() {
  const { view } = useDashboard()
  return (
    <div className="grid gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Tồn kho và đặt lại</h1>
        <p className="text-sm text-muted-foreground">Bảng ví dụ. Không tự đặt hàng. Hết hàng và dưới điểm đặt lại nằm ở trang cảnh báo.</p>
      </div>
      <DataTable
        columns={[
          { key: "sku", label: "SKU" },
          { key: "product", label: "Sản phẩm" },
          { key: "store", label: "Cửa hàng" },
          { key: "platform", label: "Sàn" },
          { key: "onHand", label: "Tồn", align: "right" },
          { key: "inbound", label: "Đang về", align: "right" },
          { key: "cover", label: "Ngày phủ", align: "right" },
          { key: "point", label: "Đặt lại", align: "right" },
          { key: "status", label: "Trạng thái" },
        ]}
        rows={view.inventory.map((row) => ({
          id: `${row.sku}-${row.store}`,
          sku: row.sku,
          product: row.product,
          store: row.store,
          platform: platformLabel(row.platform),
          onHand: formatNumber(row.onHand),
          inbound: formatNumber(row.inbound),
          cover: formatNumber(row.daysCover),
          point: formatNumber(row.reorderPoint),
          status: <Badge variant={row.status === "ok" ? "secondary" : "destructive"}>{statusLabel[row.status] || row.status}</Badge>,
        }))}
      />
    </div>
  )
}

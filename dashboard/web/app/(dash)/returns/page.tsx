"use client"

import { useState } from "react"

import { DataTable } from "@/components/data-table"
import { useDashboard } from "@/components/dashboard-provider"
import { Button } from "@/components/ui/button"
import { formatNumber, formatPercent } from "@/lib/format"
import { rollup } from "@/lib/returns"

const chain = [
  { id: "market", label: "Thị trường", field: "market" },
  { id: "platform", label: "Sàn", field: "platform" },
  { id: "store", label: "Cửa hàng", field: "store" },
  { id: "category", label: "Danh mục", field: "category" },
  { id: "product", label: "Sản phẩm", field: "product" },
  { id: "sku", label: "SKU", field: "sku" },
] as const

type LevelId = (typeof chain)[number]["id"]

export default function ReturnsPage() {
  const { view } = useDashboard()
  const [level, setLevel] = useState<LevelId>("market")
  const [path, setPath] = useState<Partial<Record<LevelId, string>>>({})
  const index = chain.findIndex((item) => item.id === level)
  const filtered = view.orders.filter((row) => chain.slice(0, index).every((item) => !path[item.id] || row[item.field] === path[item.id]))
  const rows = rollup(filtered, (row) => row[chain[index].field])
  const top = [...view.rates.sku].filter((row) => row.rtsRate !== null).sort((a, b) => (b.rtsRate ?? 0) - (a.rtsRate ?? 0)).slice(0, 5)

  function drill(key: string) {
    const next = chain[index + 1]
    setPath({ ...path, [level]: key })
    if (next) setLevel(next.id)
  }

  return (
    <div className="grid gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Huỷ và hoàn hàng</h1>
        <p className="text-sm text-muted-foreground">
          Huỷ = đơn huỷ / đơn tạo trong kỳ, kể cả huỷ trước khi giao. Hoàn = đơn đã giao courier rồi thất bại, hoàn, hoặc huỷ trên đường, chia cho đơn đã giao courier. Đơn chưa xuất kho không nằm ở tử số hay mẫu số.
        </p>
      </div>
      <p className="text-sm">Đơn bị loại vì trạng thái hoàn nhưng không có giờ lấy hàng: {formatNumber(view.excluded)}</p>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Button variant="ghost" size="sm" onClick={() => { setPath({}); setLevel("market") }}>Tất cả</Button>
        {chain.slice(0, index).map((item) => (
          <Button
            key={item.id}
            variant="outline"
            size="sm"
            onClick={() => {
              const nextPath = { ...path }
              chain.slice(chain.findIndex((entry) => entry.id === item.id) + 1).forEach((entry) => {
                delete nextPath[entry.id]
              })
              setPath(nextPath)
              setLevel(item.id)
            }}
          >
            {item.label}: {path[item.id]}
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {chain.map((item) => (
          <Button key={item.id} size="sm" variant={item.id === level ? "default" : "outline"} onClick={() => setLevel(item.id)}>
          {item.label}
        </Button>
        ))}
      </div>
      <DataTable
        columns={[
          { key: "name", label: chain[index].label },
          { key: "created", label: "Đơn tạo", align: "right" },
          { key: "cancelled", label: "Huỷ", align: "right" },
          { key: "buyer", label: "Người mua", align: "right" },
          { key: "seller", label: "Người bán", align: "right" },
          { key: "system", label: "Hệ thống", align: "right" },
          { key: "cancel", label: "Tỷ lệ huỷ", align: "right" },
          { key: "shipped", label: "Đã giao courier", align: "right" },
          { key: "rts", label: "Hoàn", align: "right" },
          { key: "rtsRate", label: "Tỷ lệ hoàn", align: "right" },
        ]}
        onRow={index < chain.length - 1 ? drill : undefined}
        rows={rows.map((row) => ({
          id: row.key,
          name: row.key,
          created: formatNumber(row.ordersCreated),
          cancelled: formatNumber(row.cancelled),
          buyer: formatNumber(row.buyer),
          seller: formatNumber(row.seller),
          system: formatNumber(row.system),
          cancel: formatPercent(row.cancelRate),
          shipped: formatNumber(row.shippedOut),
          rts: formatNumber(row.rts),
          rtsRate: formatPercent(row.rtsRate),
        }))}
      />
      <div>
        <h2 className="mb-2 text-lg font-medium">SKU hoàn cao nhất</h2>
        <DataTable
          columns={[
            { key: "name", label: "SKU" },
            { key: "rtsRate", label: "Tỷ lệ hoàn", align: "right" },
            { key: "cancel", label: "Tỷ lệ huỷ", align: "right" },
            { key: "shipped", label: "Đã giao courier", align: "right" },
          ]}
          rows={top.map((row) => ({
            id: row.key,
            name: row.key,
            rtsRate: formatPercent(row.rtsRate),
            cancel: formatPercent(row.cancelRate),
            shipped: formatNumber(row.shippedOut),
          }))}
        />
      </div>
      <StaffTable rows={view.rates.staff} />
    </div>
  )
}

function StaffTable({ rows }: { rows: ReturnType<typeof rollup> }) {
  return (
    <div>
      <h2 className="mb-2 text-lg font-medium">Theo nhân sự</h2>
      <DataTable
        columns={[
          { key: "name", label: "Nhân sự" },
          { key: "cancel", label: "Huỷ", align: "right" },
          { key: "rts", label: "Hoàn", align: "right" },
        ]}
        rows={rows.map((row) => ({
          id: row.key,
          name: row.key,
          cancel: formatPercent(row.cancelRate),
          rts: formatPercent(row.rtsRate),
        }))}
      />
    </div>
  )
}

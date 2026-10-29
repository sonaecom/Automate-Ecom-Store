"use client"

import { DataTable } from "@/components/data-table"
import { KpiCard } from "@/components/kpi-card"
import { useDashboard } from "@/components/dashboard-provider"
import { formatNumber, platformLabel } from "@/lib/format"

export default function AiCostPage() {
  const { bundle, filters } = useDashboard()
  const rows = bundle.aiCosts.filter((row) => {
    const day = row.loggedAt.slice(0, 10)
    const inDate = !day || (day >= filters.from && day <= filters.to)
    const platform = filters.platform === "Tất cả" || filters.platform === "all" || row.platform === filters.platform
    const market = filters.market === "Tất cả" || filters.market === "all" || row.market === filters.market
    const store = filters.store === "Tất cả" || filters.store === "all" || row.store === filters.store
    return inDate && platform && market && store
  })
  const currencies = [...new Set(rows.map((row) => row.currency).filter(Boolean))]
  const total = currencies.length === 1 && rows.every((row) => row.cost !== null)
    ? rows.reduce((sum, row) => sum + (row.cost ?? 0), 0)
    : null
  return (
    <div className="grid gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Chi phí AI theo phiên</h1>
        <p className="text-sm text-muted-foreground">
          Mỗi dòng là một lần chạy trên một cửa hàng. Ô trống nghĩa là chưa có số thật. Không tự điền giá.
        </p>
      </div>
      <KpiCard
        label="Tổng chi phí trong bộ lọc"
        value={total === null ? "không xác định" : `${formatNumber(total, 2)} ${currencies[0] || ""}`}
        hint={rows.some((row) => row.cost === null) ? "Có dòng chưa có chi phí" : "Cộng các dòng đã có số"}
      />
      <DataTable
        columns={[
          { key: "when", label: "Lúc" },
          { key: "run", label: "Phiên" },
          { key: "store", label: "Cửa hàng" },
          { key: "platform", label: "Sàn" },
          { key: "staff", label: "Nhân sự" },
          { key: "module", label: "Việc" },
          { key: "model", label: "Mô hình" },
          { key: "tokens", label: "Token vào / ra", align: "right" },
          { key: "cost", label: "Chi phí", align: "right" },
        ]}
        rows={rows.map((row) => ({
          id: `${row.runId}-${row.module}`,
          when: row.loggedAt.replace("T", " ").replace("Z", ""),
          run: row.runId,
          store: row.store,
          platform: platformLabel(row.platform),
          staff: row.staff,
          module: row.module,
          model: row.model,
          tokens: `${formatNumber(row.inputTokens)} / ${formatNumber(row.outputTokens)}`,
          cost: row.cost === null ? "—" : `${formatNumber(row.cost, 2)} ${row.currency}`,
        }))}
      />
    </div>
  )
}

"use client"

import { DataTable } from "@/components/data-table"
import { useDashboard } from "@/components/dashboard-provider"
import { Badge } from "@/components/ui/badge"
import { platformLabel } from "@/lib/format"

const STAGE = { A: "Mới", B: "Chưa đạt", C: "Ổn định" }
const CADENCE = { week: "tuần", month: "tháng", quarter: "quý" }

export default function RoadmapPage() {
  const { bundle, filters } = useDashboard()
  const rows = bundle.roadmap.filter((row) => {
    if (filters.store !== "Tất cả" && row.store !== filters.store) return false
    if (filters.platform !== "Tất cả" && row.platform !== filters.platform) return false
    if (filters.market !== "Tất cả" && row.market !== filters.market) return false
    return true
  })
  const cadence = CADENCE[rows[0]?.cadence as keyof typeof CADENCE] || rows[0]?.cadence || "chưa chọn"
  return (
    <div className="grid gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Lộ trình</h1>
        <p className="text-sm text-muted-foreground">
          Nhịp {cadence}. Chủ shop duyệt cuối mỗi kỳ. Đề xuất chưa thay lộ trình đang chạy.
          {bundle.example ? " Đây là dữ liệu ví dụ." : ""}
        </p>
      </div>
      {rows.length === 0 ? <p className="text-sm text-muted-foreground">Chưa có lộ trình trong bộ lọc này.</p> : null}
      <DataTable
        columns={[
          { key: "period", label: "Kỳ" },
          { key: "stage", label: "Nhóm" },
          { key: "store", label: "Cửa hàng" },
          { key: "platform", label: "Sàn" },
          { key: "module", label: "Việc" },
          { key: "milestone", label: "Mốc" },
          { key: "kpi", label: "KPI" },
          { key: "status", label: "Trạng thái" },
        ]}
        rows={rows.map((row, index) => ({
          id: `${row.period}-${row.store}-${row.module}-${index}`,
          period: row.period,
          stage: STAGE[row.stage as keyof typeof STAGE] || row.stage,
          store: row.store,
          platform: platformLabel(row.platform),
          module: row.module,
          milestone: row.milestone,
          kpi: row.kpi,
          status: <Badge variant={row.status === "repeat" || row.status === "suggest" ? "destructive" : "secondary"}>{row.status || "—"}</Badge>,
        }))}
      />
    </div>
  )
}

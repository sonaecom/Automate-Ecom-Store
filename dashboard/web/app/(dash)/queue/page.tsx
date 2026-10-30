"use client"

import { DataTable } from "@/components/data-table"
import { useDashboard } from "@/components/dashboard-provider"
import { Badge } from "@/components/ui/badge"
import { platformLabel } from "@/lib/format"

const DAY = { today: "Hôm nay", tomorrow: "Ngày mai", hold: "Chờ chủ shop", done: "Xong", pending: "Trong hàng" }

export default function QueuePage() {
  const { bundle, filters } = useDashboard()
  const rows = bundle.queue.filter((row) => {
    if (filters.store !== "Tất cả" && row.store !== filters.store) return false
    if (filters.platform !== "Tất cả" && row.platform !== filters.platform) return false
    return true
  })
  const today = rows.filter((row) => row.day === "today").length
  const tomorrow = rows.filter((row) => row.day === "tomorrow").length
  return (
    <div className="grid gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Hàng đợi</h1>
        <p className="text-sm text-muted-foreground">
          Một hồ sơ một phiên. Hôm nay {today}, ngày mai {tomorrow}. Việc ghim chạy trước P0.
          {bundle.example ? " Đây là dữ liệu ví dụ." : ""}
        </p>
      </div>
      {rows.length === 0 ? <p className="text-sm text-muted-foreground">Chưa có việc trong bộ lọc này.</p> : null}
      <DataTable
        columns={[
          { key: "day", label: "Ngày" },
          { key: "level", label: "Mức" },
          { key: "store", label: "Cửa hàng" },
          { key: "platform", label: "Sàn" },
          { key: "action", label: "Việc" },
          { key: "target", label: "Đích" },
          { key: "chunk", label: "Phần" },
          { key: "minutes", label: "Phút", align: "right" },
          { key: "status", label: "Trạng thái" },
        ]}
        rows={rows.map((row, index) => ({
          id: `${row.store}-${row.action}-${row.target}-${index}`,
          day: DAY[row.day as keyof typeof DAY] || row.day,
          level: row.pin && row.pin !== "0" ? `${row.level} ghim` : row.level,
          store: row.store,
          platform: platformLabel(row.platform),
          action: row.action,
          target: row.target,
          chunk: `${row.chunk}/${row.chunks}`,
          minutes: row.minutes,
          status: <Badge variant={row.status === "conflict" || row.status === "blocked" ? "destructive" : "secondary"}>{row.status || "—"}</Badge>,
        }))}
      />
    </div>
  )
}

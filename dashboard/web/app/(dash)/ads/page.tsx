"use client"

import { DataTable } from "@/components/data-table"
import { KpiCard } from "@/components/kpi-card"
import { useDashboard } from "@/components/dashboard-provider"
import { Badge } from "@/components/ui/badge"
import { formatNumber, platformLabel } from "@/lib/format"

export default function AdsPage() {
  const { view } = useDashboard()
  const unmatched = view.ads.filter((row) => row.matchStatus !== "MATCH").length
  return (
    <div className="grid gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Quảng cáo và nạp tiền</h1>
        <p className="text-sm text-muted-foreground">Chỉ đọc. Không nạp tiền, không rút tiền, không hiện đủ số thẻ.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard label="Chi phí" value={view.adSpend.text} hint={view.adSpend.hint} />
        <KpiCard label="ROAS" value={view.roas === null ? "không xác định" : formatNumber(view.roas, 2)} />
        <KpiCard label="Nạp chưa khớp" value={formatNumber(unmatched)} hint="MATCH là đã khớp sao kê" />
      </div>
      <DataTable
        columns={[
          { key: "date", label: "Ngày" },
          { key: "store", label: "Cửa hàng" },
          { key: "platform", label: "Sàn" },
          { key: "spend", label: "Chi phí", align: "right" },
          { key: "gmv", label: "GMV", align: "right" },
          { key: "roas", label: "ROAS", align: "right" },
          { key: "days", label: "Ngày còn", align: "right" },
          { key: "topup", label: "Nạp", align: "right" },
          { key: "status", label: "Đối soát" },
        ]}
        rows={view.ads.map((row) => ({
          id: `${row.date}-${row.store}`,
          date: row.date,
          store: row.store,
          platform: platformLabel(row.platform),
          spend: row.shownSpend.text,
          gmv: row.shownGmv.text,
          roas: row.roas === null ? "—" : formatNumber(row.roas, 2),
          days: row.daysLeft === null ? "—" : formatNumber(row.daysLeft),
          topup: row.topupAmount === null ? "—" : formatNumber(row.topupAmount),
          status: <Badge variant={row.matchStatus === "MATCH" ? "secondary" : "destructive"}>{row.matchStatus}</Badge>,
        }))}
      />
    </div>
  )
}

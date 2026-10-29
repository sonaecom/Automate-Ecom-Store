"use client"

import { DataTable } from "@/components/data-table"
import { KpiCard } from "@/components/kpi-card"
import { useDashboard } from "@/components/dashboard-provider"
import { Badge } from "@/components/ui/badge"
import { platformLabel } from "@/lib/format"

export default function WalletPage() {
  const { view } = useDashboard()
  return (
    <div className="grid gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Ví và lệnh rút</h1>
        <p className="text-sm text-muted-foreground">Chỉ đọc. Không tạo lệnh rút, không đổi tài khoản ngân hàng. Chỉ 4 số cuối.</p>
      </div>
      <KpiCard label="Khả dụng trong bộ lọc" value={view.walletAvailable.text} hint={view.walletAvailable.hint} />
      <DataTable
        columns={[
          { key: "date", label: "Ngày" },
          { key: "store", label: "Cửa hàng" },
          { key: "platform", label: "Sàn" },
          { key: "available", label: "Khả dụng", align: "right" },
          { key: "pending", label: "Chờ", align: "right" },
          { key: "incoming", label: "Sắp về", align: "right" },
          { key: "withdraw", label: "Rút", align: "right" },
          { key: "last4", label: "4 số cuối" },
          { key: "status", label: "Đối soát" },
        ]}
        rows={view.wallet.map((row) => ({
          id: `${row.date}-${row.store}`,
          date: row.date,
          store: row.store,
          platform: platformLabel(row.platform),
          available: row.shownAvailable.text,
          pending: row.pending ?? "—",
          incoming: row.incoming ?? "—",
          withdraw: row.withdrawalNet ?? "—",
          last4: row.bankLast4 || "—",
          status: <Badge variant={row.matchStatus === "MATCH" || row.matchStatus === "OK" ? "secondary" : "destructive"}>{row.matchStatus || "—"}</Badge>,
        }))}
      />
    </div>
  )
}

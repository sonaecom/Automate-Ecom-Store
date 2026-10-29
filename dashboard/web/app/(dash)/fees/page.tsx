"use client"

import { DataTable } from "@/components/data-table"
import { useDashboard } from "@/components/dashboard-provider"
import { Badge } from "@/components/ui/badge"
import { formatNumber, platformLabel } from "@/lib/format"

const resultLabel: Record<string, string> = {
  OK: "Trong trần",
  NEAR: "Sắp chạm",
  OVER: "Vượt trần",
  UNSET: "Chưa đặt trần",
  QC_FAIL: "Hai nguồn lệch",
  MISSING: "Thiếu số",
}

const levelLabel: Record<string, string> = {
  order: "Đơn",
  sku: "SKU",
  category: "Ngành",
  store_day: "Cửa hàng / ngày",
  store_month: "Cửa hàng / tháng",
}

export default function FeesPage() {
  const { view } = useDashboard()
  const orders = view.fees.filter((row) => row.level === "order")
  const rollups = view.fees.filter((row) => row.level !== "order")
  const components = view.feeComponents.filter((row) => ["order", "sku", "store", "platform", "market"].includes(row.level))
  const joins = view.feeWhatIfs.filter((row) => row.action === "join")
  return (
    <div className="grid gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Phí sàn trên GMV</h1>
        <p className="text-sm text-muted-foreground">
          Bảng ví dụ từ file xuất thanh toán. Mỗi khoản là % GMV. Mô phỏng tham gia hoặc rời chương trình không tự bật và không tự tắt. Chủ shop duyệt trước.
        </p>
      </div>
      <DataTable
        columns={[
          { key: "level", label: "Mức" },
          { key: "period", label: "Kỳ" },
          { key: "store", label: "Cửa hàng" },
          { key: "platform", label: "Sàn" },
          { key: "feePct", label: "% phí", align: "right" },
          { key: "cap", label: "Trần %", align: "right" },
          { key: "program", label: "Khoản lớn nhất" },
          { key: "proposal", label: "Đề xuất" },
          { key: "result", label: "Trạng thái" },
        ]}
        rows={rollups.map((row) => ({
          id: `${row.level}-${row.key}`,
          level: levelLabel[row.level] || row.level,
          period: row.period,
          store: row.store,
          platform: platformLabel(row.platform),
          feePct: row.feePct === null ? "—" : formatNumber(row.feePct, 2),
          cap: row.cap === null ? "—" : formatNumber(row.cap, 2),
          program: row.topProgram || "—",
          proposal: row.proposal || "—",
          result: <Badge variant={row.result === "OVER" || row.result === "QC_FAIL" ? "destructive" : "secondary"}>{resultLabel[row.result] || row.result}</Badge>,
        }))}
      />
      <div>
        <h2 className="text-lg font-semibold">Từng đơn</h2>
        <p className="text-sm text-muted-foreground">Đơn QC_FAIL không cộng vào tổng. Hai số lệch được giữ riêng, không lấy trung bình.</p>
      </div>
      <DataTable
        columns={[
          { key: "order", label: "Đơn" },
          { key: "date", label: "Ngày" },
          { key: "sku", label: "SKU" },
          { key: "gmv", label: "GMV", align: "right" },
          { key: "fee", label: "Phí", align: "right" },
          { key: "feePct", label: "% phí", align: "right" },
          { key: "result", label: "Trạng thái" },
        ]}
        rows={orders.map((row) => ({
          id: row.key,
          order: row.key,
          date: row.date,
          sku: row.sku || "—",
          gmv: row.gmv === null ? "—" : formatNumber(row.gmv),
          fee: row.fee === null ? "—" : formatNumber(row.fee),
          feePct: row.feePct === null ? "—" : formatNumber(row.feePct, 2),
          result: <Badge variant={row.result === "OVER" || row.result === "QC_FAIL" ? "destructive" : "secondary"}>{resultLabel[row.result] || row.result}</Badge>,
        }))}
      />
      <div>
        <h2 className="text-lg font-semibold">Từng khoản trên GMV</h2>
        <p className="text-sm text-muted-foreground">Hoa hồng liên kết, freeship, voucher sàn, voucher shop, xu, mega sale, flash sale, hoa hồng sàn, phí thanh toán, và phí dịch vụ khác.</p>
      </div>
      <DataTable
        columns={[
          { key: "level", label: "Mức" },
          { key: "key", label: "Khóa" },
          { key: "component", label: "Khoản" },
          { key: "amount", label: "Số tiền", align: "right" },
          { key: "pct", label: "% GMV", align: "right" },
        ]}
        rows={components.map((row, index) => ({
          id: `${row.level}-${row.key}-${row.component}-${index}`,
          level: levelLabel[row.level] || row.level,
          key: row.key,
          component: row.component,
          amount: row.amount === null ? "—" : formatNumber(row.amount),
          pct: row.pctGmv === null ? "—" : formatNumber(row.pctGmv, 2),
        }))}
      />
      <div>
        <h2 className="text-lg font-semibold">Nếu tham gia hoặc rời chương trình</h2>
        <p className="text-sm text-muted-foreground">JOIN_BREACH nghĩa là tham gia sẽ vượt trần. Chưa có thao tác nào được ghi lên sàn.</p>
      </div>
      <DataTable
        columns={[
          { key: "action", label: "Hướng" },
          { key: "program", label: "Chương trình" },
          { key: "level", label: "Mức" },
          { key: "current", label: "% hiện tại", align: "right" },
          { key: "next", label: "% sau", align: "right" },
          { key: "cap", label: "Trần %", align: "right" },
          { key: "result", label: "Kết quả" },
        ]}
        rows={joins.map((row) => ({
          id: `${row.action}-${row.level}-${row.key}-${row.program}`,
          action: row.action,
          program: row.program,
          level: levelLabel[row.level] || row.level,
          current: row.currentPct === null ? "—" : formatNumber(row.currentPct, 2),
          next: row.nextPct === null ? "—" : formatNumber(row.nextPct, 2),
          cap: row.cap === null ? "—" : formatNumber(row.cap, 2),
          result: <Badge variant={row.result === "JOIN_BREACH" ? "destructive" : "secondary"}>{row.result}</Badge>,
        }))}
      />
    </div>
  )
}

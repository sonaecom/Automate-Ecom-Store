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
  return (
    <div className="grid gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Phí sàn trên GMV</h1>
        <p className="text-sm text-muted-foreground">
          Bảng ví dụ từ file xuất thanh toán. Đề xuất chỉ để chủ shop duyệt. Trang này không tắt chương trình, không đổi giá, không dừng khuyến mãi.
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
    </div>
  )
}

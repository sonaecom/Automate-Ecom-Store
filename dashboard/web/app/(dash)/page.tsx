"use client"

import { DataTable } from "@/components/data-table"
import { KpiCard } from "@/components/kpi-card"
import { TrendChart } from "@/components/trend-chart"
import { useDashboard } from "@/components/dashboard-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatNumber, formatPercent, platformLabel } from "@/lib/format"

export default function OverviewPage() {
  const { bundle, view, filters } = useDashboard()
  return (
    <div className="grid gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Tổng quan</h1>
        <p className="text-sm text-muted-foreground">
          Doanh thu, ads và ví lấy từ FxFacts. Tỷ lệ huỷ và hoàn tính từ đơn, không tính đơn chưa giao courier.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Doanh thu" value={view.sales.text} hint={view.sales.hint} />
        <KpiCard label="Chi phí ads" value={view.adSpend.text} hint={view.adSpend.hint} />
        <KpiCard label="ROAS" value={view.roas === null ? "không xác định" : formatNumber(view.roas, 2)} hint="GMV ghi nhận / chi phí" />
        <KpiCard label="Số dư ví" value={view.walletAvailable.text} hint={view.walletAvailable.hint} />
        <KpiCard label="Đơn tạo" value={formatNumber(view.orderCount)} hint="Theo ngày tạo trong kỳ" />
        <KpiCard label="Tỷ lệ huỷ" value={formatPercent(view.cancelRate)} hint="Kể cả huỷ trước khi giao" />
        <KpiCard label="Tỷ lệ hoàn / RTS" value={formatPercent(view.rtsRate)} hint={`${view.excluded} đơn loại vì chưa xuất kho`} />
        <KpiCard label="Cảnh báo" value={formatNumber(view.alerts.length)} hint={bundle.thresholds.label === "example" ? "Ngưỡng trong file là ví dụ" : "Theo ngưỡng đã cấu hình"} />
      </div>
      <TrendChart
        title="Xu hướng doanh thu"
        description={filters.currencyView === "base" ? `Theo ${bundle.baseCurrency}, tỷ giá ${filters.fxMode === "custom" ? "riêng" : "thị trường"}` : "Chỉ hiện khi đang xem tiền gốc"}
        data={view.trend}
        currency={bundle.baseCurrency}
      />
      <Card>
        <CardHeader>
          <CardTitle>Theo sàn</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={[
              { key: "name", label: "Sàn" },
              { key: "sales", label: "Doanh thu", align: "right" },
              { key: "ads", label: "Ads", align: "right" },
              { key: "orders", label: "Đơn", align: "right" },
              { key: "cancel", label: "Huỷ", align: "right" },
              { key: "rts", label: "Hoàn", align: "right" },
            ]}
            rows={view.groups.platform.map((row) => ({
              id: row.key,
              name: platformLabel(row.key),
              sales: filters.currencyView === "base" ? formatNumber(row.sales) : "—",
              ads: filters.currencyView === "base" ? formatNumber(row.adSpend) : "—",
              orders: formatNumber(row.orders),
              cancel: formatPercent(row.cancelRate),
              rts: formatPercent(row.rtsRate),
            }))}
          />
        </CardContent>
      </Card>
      {view.qc.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>QC từng dòng</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-1 text-sm">
            {view.qc.map((line) => <p key={line}>{line}</p>)}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}

"use client"

import { useDashboard } from "@/components/dashboard-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function SettingsPage() {
  const { bundle, filters, setFilters, rates, setRate, resetRates, dirty } = useDashboard()
  return (
    <div className="grid gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Cài đặt tỷ giá</h1>
        <p className="text-sm text-muted-foreground">
          Tiền gốc mặc định là VND. Sửa tỷ giá ở đây chỉ để xem lại các tháng cũ trên bảng. Nguồn giữ số là tab Google Sheets Settings/FX. Bảng không ghi đè sheet.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Chế độ tỷ giá</CardTitle>
          <CardDescription>1 đơn vị nguyên tệ = bao nhiêu {bundle.baseCurrency}. Ví dụ 1 PHP = 430 VND.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-1">
            <Label>Tiền gốc</Label>
            <p className="text-lg font-medium">{bundle.baseCurrency}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filters.fxMode === "market" ? "default" : "outline"}
              onClick={() => setFilters({ ...filters, fxMode: "market" })}
            >
              Thị trường theo ngày
            </Button>
            <Button
              variant={filters.fxMode === "custom" ? "default" : "outline"}
              onClick={() => setFilters({ ...filters, fxMode: "custom" })}
            >
              Tỷ giá riêng theo tháng
            </Button>
          </div>
          <ul className="grid gap-1 text-sm text-muted-foreground">
            <li>Thị trường: đúng ngày, không có thì ngày gần nhất trước đó, rồi tỷ giá tháng kiểu market.</li>
            <li>Riêng: đúng tháng, không có thì tháng custom trước đó, rồi tỷ giá thị trường.</li>
            <li>Không dùng ngày tương lai, không tự đặt tỷ giá, không lấy trung bình hai nguồn lệch nhau.</li>
          </ul>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Settings/FX</CardTitle>
          <CardDescription>{dirty ? "Đang xem trước. Các tháng dùng tỷ giá này được tính lại." : "Đúng bảng tỷ giá đã nạp."}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {rates.map((row) => (
            <div key={`${row.month}-${row.currency}`} className="grid grid-cols-2 items-end gap-3 sm:grid-cols-4">
              <div>
                <Label>Tháng</Label>
                <p>{row.month}</p>
              </div>
              <div>
                <Label>Tiền</Label>
                <p>{row.currency}</p>
              </div>
              <div>
                <Label>Chế độ</Label>
                <p>{row.mode === "custom" ? "Riêng" : "Thị trường"}</p>
              </div>
              <label className="grid gap-1">
                <Label>Tỷ giá</Label>
                <Input
                  inputMode="decimal"
                  disabled={row.mode !== "custom"}
                  value={row.rate ?? ""}
                  onChange={(event) => {
                    const next = Number(event.target.value)
                    if (Number.isFinite(next)) setRate(row.month, row.currency, next)
                  }}
                />
              </label>
            </div>
          ))}
          <Button variant="outline" disabled={!dirty} onClick={resetRates}>Khôi phục tỷ giá đã nạp</Button>
        </CardContent>
      </Card>
    </div>
  )
}

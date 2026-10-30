"use client"

import { useDashboard } from "@/components/dashboard-provider"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { platformLabel } from "@/lib/format"

export default function AlertsPage() {
  const { view, bundle } = useDashboard()
  return (
    <div className="grid gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Cảnh báo</h1>
        <p className="text-sm text-muted-foreground">
          Ngưỡng huỷ {bundle.thresholds.cancelRate ?? "chưa đặt"}, hoàn {bundle.thresholds.rtsRate ?? "chưa đặt"}, ROAS {bundle.thresholds.roasFloor ?? "chưa đặt"}, số ngày ads {bundle.thresholds.daysLeft ?? "chưa đặt"}.
          {bundle.thresholds.label === "example" ? " Đây là ngưỡng ví dụ." : ""}
        </p>
      </div>
      {view.alerts.length === 0 ? <p className="text-sm text-muted-foreground">Không có cảnh báo trong bộ lọc này.</p> : null}
      <div className="grid gap-3">
        {view.alerts.map((alert) => (
          <Card key={alert.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Badge variant={alert.tone === "bad" ? "destructive" : "outline"}>{alert.tone === "bad" ? "Cần xem" : "Theo dõi"}</Badge>
                {alert.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>{alert.detail}</p>
              <p className="mt-1">{[alert.platform ? platformLabel(alert.platform) : "", alert.market].filter(Boolean).join(" · ")}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

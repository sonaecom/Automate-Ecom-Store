"use client"

import { DataTable } from "@/components/data-table"
import { useDashboard } from "@/components/dashboard-provider"
import { Badge } from "@/components/ui/badge"
import { formatNumber, platformLabel } from "@/lib/format"

const statusLabel: Record<string, string> = {
  processing: "Đang xử lý",
  live: "Đang hiện",
  rejected: "Bị từ chối",
}

export default function VideosPage() {
  const { view } = useDashboard()
  return (
    <div className="grid gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Video</h1>
        <p className="text-sm text-muted-foreground">
          Số liệu ví dụ đọc từ trang video của sàn. Hai nguồn lệch thì giữ cả hai, không lấy trung bình. Livestream chưa làm. Không tạo video bằng AI từ trang này.
        </p>
      </div>
      <DataTable
        columns={[
          { key: "video", label: "Video" },
          { key: "date", label: "Ngày" },
          { key: "store", label: "Cửa hàng" },
          { key: "platform", label: "Sàn" },
          { key: "product", label: "Sản phẩm" },
          { key: "variation", label: "Phân loại" },
          { key: "placement", label: "Vị trí" },
          { key: "views", label: "Xem", align: "right" },
          { key: "likes", label: "Thích", align: "right" },
          { key: "clicks", label: "Bấm", align: "right" },
          { key: "orders", label: "Đơn", align: "right" },
          { key: "gmv", label: "GMV", align: "right" },
          { key: "status", label: "Trạng thái" },
          { key: "qc", label: "QC" },
        ]}
        rows={view.videos.map((row) => ({
          id: row.videoId,
          video: row.videoId,
          date: row.date,
          store: row.store,
          platform: platformLabel(row.platform),
          product: row.product,
          variation: row.variation,
          placement: row.placement,
          views: row.views === null ? "—" : formatNumber(row.views, 0),
          likes: row.likes === null ? "—" : formatNumber(row.likes, 0),
          clicks: row.clicks === null ? "—" : formatNumber(row.clicks, 0),
          orders: row.orders === null ? "—" : formatNumber(row.orders, 0),
          gmv: row.gmv === null ? "—" : formatNumber(row.gmv, 0),
          status: <Badge variant={row.status === "rejected" || row.qc === "QC_FAIL" ? "destructive" : "secondary"}>{statusLabel[row.status] || row.status}</Badge>,
          qc: row.qc === "QC_FAIL" ? row.reason || "Hai nguồn lệch" : row.qc,
        }))}
      />
    </div>
  )
}

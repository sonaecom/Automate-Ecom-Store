"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { useTheme } from "next-themes"
import {
  Bell,
  Boxes,
  LayoutDashboard,
  Megaphone,
  Menu,
  Package,
  Percent,
  Receipt,
  Settings,
  Store,
  Undo2,
  Wallet,
} from "lucide-react"

import { useDashboard } from "@/components/dashboard-provider"
import { Filters } from "@/components/filters"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

const links = [
  { href: "/", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/breakdown", label: "Sàn & cửa hàng", icon: Store },
  { href: "/sku", label: "Lãi lỗ SKU", icon: Package },
  { href: "/ads", label: "Quảng cáo", icon: Megaphone },
  { href: "/wallet", label: "Ví & rút tiền", icon: Wallet },
  { href: "/returns", label: "Huỷ & hoàn", icon: Undo2 },
  { href: "/inventory", label: "Tồn kho", icon: Boxes },
  { href: "/fees", label: "Phí sàn", icon: Percent },
  { href: "/alerts", label: "Cảnh báo", icon: Bell },
  { href: "/ai-cost", label: "Chi phí AI", icon: Receipt },
  { href: "/settings", label: "Cài đặt", icon: Settings },
]

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { bundle, view } = useDashboard()
  const { setTheme, resolvedTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const nav = (
    <nav className="grid gap-1">
      {links.map((link) => {
        const active = pathname === link.href
        const Icon = link.icon
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
              active ? "bg-primary text-primary-foreground" : "hover:bg-muted",
            )}
          >
            <Icon className="size-4" />
            <span className="flex-1">{link.label}</span>
            {link.href === "/alerts" && view.alerts.length > 0 ? (
              <span className={cn("rounded-full px-1.5 text-xs", active ? "bg-primary-foreground/20" : "bg-destructive/15 text-destructive")}>
                {view.alerts.length}
              </span>
            ) : null}
          </Link>
        )
      })}
    </nav>
  )

  return (
    <div className="min-h-svh bg-background md:grid md:grid-cols-[240px_1fr]">
      <aside className="hidden border-r bg-sidebar px-3 py-5 md:block">
        <div className="mb-6 px-3">
          <p className="text-xs tracking-wide text-muted-foreground uppercase">Cửa hàng</p>
          <p className="font-heading text-lg font-semibold">Bảng điều khiển</p>
        </div>
        {nav}
      </aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-30 border-b bg-background/90 px-4 py-3 backdrop-blur md:px-6">
          <div className="mb-3 flex items-center gap-2">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger
                render={<Button variant="outline" size="icon" className="md:hidden" aria-label="Mở menu" />}
              >
                <Menu />
              </SheetTrigger>
              <SheetContent side="left" className="w-72">
                <SheetHeader>
                  <SheetTitle>Bảng điều khiển</SheetTitle>
                </SheetHeader>
                {nav}
              </SheetContent>
            </Sheet>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">Nguồn: {bundle.sourceLabel}</p>
              <p className="truncate text-xs text-muted-foreground">Tiền gốc {bundle.baseCurrency}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            >
              Đổi nền
            </Button>
          </div>
          {bundle.example ? (
            <p className="mb-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm">
              Dữ liệu ví dụ. Các mã như {`<STORE_A>`} không phải số của cửa hàng thật.
            </p>
          ) : null}
          <Filters />
        </header>
        <main className="px-4 py-5 md:px-6">{children}</main>
      </div>
    </div>
  )
}

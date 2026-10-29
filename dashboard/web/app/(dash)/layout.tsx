import { DashboardProvider } from "@/components/dashboard-provider"
import { Shell } from "@/components/shell"
import { loadBundle } from "@/lib/load"

export const dynamic = "force-dynamic"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let bundle
  try {
    bundle = await loadBundle()
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không đọc được dữ liệu."
    return (
      <main className="mx-auto max-w-lg px-6 py-16">
        <h1 className="text-xl font-semibold">Chưa đọc được dữ liệu</h1>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      </main>
    )
  }
  return (
    <DashboardProvider bundle={bundle}>
      <Shell>{children}</Shell>
    </DashboardProvider>
  )
}

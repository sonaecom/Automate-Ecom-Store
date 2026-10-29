export default async function UnlockPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const query = await searchParams
  return (
    <main className="mx-auto flex min-h-svh max-w-sm flex-col justify-center px-6">
      <h1 className="text-2xl font-semibold">Bảng riêng của chủ shop</h1>
      <p className="mt-2 text-sm text-muted-foreground">Nhập mật khẩu đã đặt trong môi trường. Mật khẩu không nằm trong mã nguồn.</p>
      <form action="/api/unlock" method="post" className="mt-6 grid gap-3">
        <label className="grid gap-1 text-sm">
          Mật khẩu
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="h-9 rounded-lg border bg-background px-3"
          />
        </label>
        {query.error ? <p className="text-sm text-destructive">Mật khẩu không đúng.</p> : null}
        <button type="submit" className="h-9 rounded-lg bg-primary text-sm text-primary-foreground">
          Vào bảng
        </button>
      </form>
    </main>
  )
}

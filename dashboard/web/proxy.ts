import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { sessionToken } from "@/lib/session"

export async function proxy(request: NextRequest) {
  const password = process.env.DASHBOARD_PASSWORD || ""
  if (!password) return NextResponse.next()
  const { pathname } = request.nextUrl
  if (pathname === "/unlock" || pathname === "/api/unlock") return NextResponse.next()
  const expected = await sessionToken(password)
  if (request.cookies.get("dashboard_session")?.value === expected) return NextResponse.next()
  const url = request.nextUrl.clone()
  url.pathname = "/unlock"
  url.search = ""
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}

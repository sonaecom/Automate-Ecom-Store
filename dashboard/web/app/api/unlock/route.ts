import { NextResponse } from "next/server"

import { passwordMatches, sessionToken } from "@/lib/session"

export async function POST(request: Request) {
  const expected = process.env.DASHBOARD_PASSWORD || ""
  const form = await request.formData()
  const given = String(form.get("password") || "")
  const ok = expected !== "" && await passwordMatches(given, expected)
  if (!ok) {
    return NextResponse.redirect(new URL("/unlock?error=1", request.url))
  }
  const response = NextResponse.redirect(new URL("/", request.url))
  response.cookies.set("dashboard_session", await sessionToken(expected), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  })
  return response
}

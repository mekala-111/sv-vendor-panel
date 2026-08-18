import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const authed = request.cookies.has("vendor_session");
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/vendor") && !authed) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if ((pathname === "/login" || pathname === "/") && authed) {
    return NextResponse.redirect(new URL("/vendor/dashboard", request.url));
  }
}

export const config = {
  matcher: ["/", "/login", "/vendor/:path*"],
};

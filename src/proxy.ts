import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { vendorAbsoluteUrl } from "@/lib/vendor-origin";

export function proxy(request: NextRequest) {
  const access = request.cookies.get("sv_vendor_access")?.value;
  const refresh = request.cookies.get("sv_vendor_refresh")?.value;
  const legacy = request.cookies.has("vendor_session");
  const authed = Boolean(access || refresh || legacy);
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/vendor") && !authed) {
    return NextResponse.redirect(vendorAbsoluteUrl("/login", request));
  }
  if ((pathname === "/login" || pathname === "/") && authed) {
    return NextResponse.redirect(vendorAbsoluteUrl("/vendor/dashboard", request));
  }
}

export const config = {
  matcher: ["/", "/login", "/vendor/:path*"],
};

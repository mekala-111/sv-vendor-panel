import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { vendorAbsoluteUrl } from "@/lib/vendor-origin";
import { attachRefreshedSessionCookies } from "@/lib/session-cookies";

const VENDOR_BASE =
  process.env.NEXT_PUBLIC_VENDOR_PANEL_URL ||
  process.env.VENDOR_PANEL_URL ||
  process.env.VENDOR_BASE_URL ||
  "";

export async function proxy(request: NextRequest) {
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

  const res = NextResponse.next();
  if (refresh) {
    return attachRefreshedSessionCookies(
      request,
      res,
      {
        access: "sv_vendor_access",
        refresh: "sv_vendor_refresh",
        legacy: "vendor_session",
      },
      VENDOR_BASE
    );
  }
  return res;
}

export const config = {
  matcher: ["/", "/login", "/vendor/:path*"],
};

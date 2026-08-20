import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ACCESS_TOKEN_COOKIE = "vendor_access_token";
const REFRESH_TOKEN_COOKIE = "vendor_refresh_token";

export function proxy(request: NextRequest) {
  // Check if user has valid JWT tokens
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  const hasValidAuth = !!accessToken && !!refreshToken;

  const { pathname } = request.nextUrl;

  // Redirect unauthenticated users accessing /vendor/* to login
  if (pathname.startsWith("/vendor") && !hasValidAuth) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect authenticated users accessing /login or / to vendor dashboard
  if ((pathname === "/login" || pathname === "/") && hasValidAuth) {
    return NextResponse.redirect(new URL("/vendor/dashboard", request.url));
  }
}

export const config = {
  matcher: ["/", "/login", "/vendor/:path*"],
};


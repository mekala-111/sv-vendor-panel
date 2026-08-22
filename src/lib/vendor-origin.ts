import type { NextRequest } from "next/server";

/**
 * Absolute public origin for redirects (proxy guards).
 * Prefer NEXT_PUBLIC_VENDOR_PANEL_URL so reverse-proxy internal hosts
 * never leak into Location headers.
 */
export function vendorPublicOrigin(req?: NextRequest): string {
  const configured = (
    process.env.NEXT_PUBLIC_VENDOR_PANEL_URL ||
    process.env.VENDOR_PANEL_URL ||
    process.env.VENDOR_BASE_URL ||
    ""
  ).replace(/\/$/, "");
  if (configured) return configured;

  if (req) {
    const proto = req.headers.get("x-forwarded-proto");
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    if (host) {
      const scheme =
        proto || (host.includes("localhost") || host.startsWith("127.") ? "http" : "https");
      return `${scheme}://${host}`;
    }
    try {
      return new URL(req.url).origin;
    } catch {
      /* fall through */
    }
  }

  return "http://localhost:3001";
}

export function vendorAbsoluteUrl(path: string, req?: NextRequest): URL {
  const origin = vendorPublicOrigin(req);
  return new URL(path.startsWith("/") ? path : `/${path}`, origin);
}

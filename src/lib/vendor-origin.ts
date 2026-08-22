import type { NextRequest } from "next/server";
import { absolutePublicUrl, resolvePublicOrigin } from "@/lib/session-cookies";

const configuredBase = () =>
  process.env.NEXT_PUBLIC_VENDOR_PANEL_URL ||
  process.env.VENDOR_PANEL_URL ||
  process.env.VENDOR_BASE_URL ||
  "";

/**
 * Absolute public origin for redirects (proxy guards).
 * Uses the browser-facing host when available so Set-Cookie stays on the same domain.
 */
export function vendorPublicOrigin(req?: NextRequest): string {
  if (req) return resolvePublicOrigin(req, configuredBase());
  const configured = configuredBase().replace(/\/$/, "");
  return configured || "http://localhost:3001";
}

export function vendorAbsoluteUrl(path: string, req?: NextRequest): URL {
  if (req) return absolutePublicUrl(path, req, configuredBase());
  return new URL(path.startsWith("/") ? path : `/${path}`, vendorPublicOrigin());
}

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

/** Local/dev hosts may stay on http; any real domain is served over https behind the proxy. */
function isLocalHost(hostname: string) {
  return hostname === "localhost" || /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname) || hostname.endsWith(".local");
}

/**
 * The panel is HTTPS-only in production. If the proxy headers or VENDOR_PANEL_URL still say http,
 * an http:// redirect gets blocked as mixed content ("Failed to fetch") — so upgrade it.
 */
function forceHttpsForDomains(url: URL): URL {
  if (url.protocol === "http:" && !isLocalHost(url.hostname) && process.env.ALLOW_HTTP_ORIGIN !== "true") {
    url.protocol = "https:";
  }
  return url;
}

export function vendorAbsoluteUrl(path: string, req?: NextRequest): URL {
  if (req) return forceHttpsForDomains(absolutePublicUrl(path, req, configuredBase()));
  return forceHttpsForDomains(new URL(path.startsWith("/") ? path : `/${path}`, vendorPublicOrigin()));
}

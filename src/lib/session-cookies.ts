import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

function isLoopbackHost(host: string) {
  const h = host.split(":")[0]?.toLowerCase() ?? "";
  return h === "localhost" || h === "127.0.0.1" || h === "0.0.0.0" || h === "::1";
}

/**
 * Public origin for redirects. Prefer the browser-facing host (so Set-Cookie
 * and Location stay on the same domain). Only use a configured base URL when
 * the request host is loopback (typical behind a reverse proxy to Node).
 */
export function resolvePublicOrigin(
  req: NextRequest,
  configuredBase?: string | null
): string {
  const configured = (configuredBase || "").replace(/\/$/, "");
  const forwardedHost = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  const forwardedProto = req.headers.get("x-forwarded-proto");

  if (forwardedHost && !isLoopbackHost(forwardedHost)) {
    const scheme =
      forwardedProto ||
      (forwardedHost.includes("localhost") || forwardedHost.startsWith("127.") ? "http" : "https");
    return `${scheme}://${forwardedHost}`;
  }

  try {
    const fromUrl = new URL(req.url);
    if (!isLoopbackHost(fromUrl.host)) return fromUrl.origin;
  } catch {
    /* ignore */
  }

  if (configured) return configured;

  if (forwardedHost) {
    const scheme = forwardedProto || "http";
    return `${scheme}://${forwardedHost}`;
  }

  try {
    return new URL(req.url).origin;
  } catch {
    return "http://localhost:3000";
  }
}

export function absolutePublicUrl(
  path: string,
  req: NextRequest,
  configuredBase?: string | null
): URL {
  const origin = resolvePublicOrigin(req, configuredBase);
  return new URL(path.startsWith("/") ? path : `/${path}`, origin);
}

/** Prefer Secure cookies when the public site is HTTPS. */
export function cookieSecureFlag(configuredBase?: string | null): boolean {
  if (process.env.COOKIE_SECURE === "true") return true;
  if (process.env.COOKIE_SECURE === "false") return false;
  const base = (configuredBase || "").toLowerCase();
  if (base.startsWith("https://")) return true;
  return process.env.NODE_ENV === "production";
}

export type SessionCookieNames = {
  access: string;
  refresh: string;
  legacy?: string;
};

function decodeJwtPayload(token: string): { exp?: number } | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2 || !parts[1]) return null;
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
    const json =
      typeof atob === "function"
        ? atob(b64 + pad)
        : Buffer.from(b64 + pad, "base64").toString("utf8");
    return JSON.parse(json) as { exp?: number };
  } catch {
    return null;
  }
}

function isJwtExpiredOrExpiring(token: string, skewSeconds: number): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return true;
  return payload.exp * 1000 <= Date.now() + skewSeconds * 1000;
}

/**
 * If access cookie is missing/expired but refresh exists, mint a new access
 * token and attach Set-Cookie on the response. Also rewrites the request
 * Cookie header so the current RSC render sees the fresh token.
 */
export async function attachRefreshedSessionCookies(
  request: NextRequest,
  response: NextResponse,
  names: SessionCookieNames,
  configuredBase?: string | null
): Promise<NextResponse> {
  const access = request.cookies.get(names.access)?.value;
  const refresh = request.cookies.get(names.refresh)?.value;
  if (!refresh) return response;

  if (access && !isJwtExpiredOrExpiring(access, 60)) {
    return response;
  }

  const apiUrl = (
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:4000/api"
  ).replace(/\/$/, "");

  try {
    const res = await fetch(`${apiUrl}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: refresh }),
      cache: "no-store",
    });
    const json = (await res.json().catch(() => ({}))) as {
      success?: boolean;
      data?: { accessToken?: string; refreshToken?: string };
    };
    if (!res.ok || !json.data?.accessToken) {
      response.cookies.delete(names.access);
      response.cookies.delete(names.refresh);
      if (names.legacy) response.cookies.delete(names.legacy);
      return response;
    }

    const secure = cookieSecureFlag(configuredBase);
    const opts = {
      httpOnly: true,
      sameSite: "lax" as const,
      path: "/",
      secure,
      maxAge: 60 * 60 * 24 * 30,
    };

    const nextAccess = json.data.accessToken;
    const nextRefresh = json.data.refreshToken || refresh;

    // Forward refreshed cookies into this same request for Server Components.
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(
      "cookie",
      mergeCookieHeader(request.headers.get("cookie"), {
        [names.access]: nextAccess,
        [names.refresh]: nextRefresh,
      })
    );

    const next = NextResponse.next({
      request: { headers: requestHeaders },
    });

    // Preserve any cookies already queued on `response`, then set session.
    response.cookies.getAll().forEach((c) => {
      next.cookies.set(c.name, c.value);
    });
    next.cookies.set(names.access, nextAccess, opts);
    next.cookies.set(names.refresh, nextRefresh, opts);
    return next;
  } catch {
    /* leave existing cookies; page may still redirect to login */
  }

  return response;
}

function mergeCookieHeader(
  existing: string | null,
  updates: Record<string, string>
): string {
  const map = new Map<string, string>();
  if (existing) {
    for (const part of existing.split(";")) {
      const idx = part.indexOf("=");
      if (idx === -1) continue;
      const k = part.slice(0, idx).trim();
      const v = part.slice(idx + 1).trim();
      if (k) map.set(k, v);
    }
  }
  for (const [k, v] of Object.entries(updates)) {
    map.set(k, v);
  }
  return Array.from(map.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cookieSecureFlag } from "@/lib/session-cookies";

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "http://localhost:4000/api";
const VENDOR_BASE =
  process.env.NEXT_PUBLIC_VENDOR_PANEL_URL ||
  process.env.VENDOR_PANEL_URL ||
  process.env.VENDOR_BASE_URL ||
  "";

export const AUTH_COOKIE = "sv_vendor_access";
export const REFRESH_COOKIE = "sv_vendor_refresh";

/** Reuse refreshed access token across chained server-action API calls in the same process. */
let cachedAccessToken: string | null = null;
let cachedAccessTokenAt = 0;
const ACCESS_TOKEN_CACHE_MS = 120_000;

function rememberAccessToken(token: string) {
  cachedAccessToken = token;
  cachedAccessTokenAt = Date.now();
}

/** Call after login so the first server-action API chain uses the new JWT. */
export function seedAccessTokenCache(token: string) {
  rememberAccessToken(token);
}

async function resolveAccessToken(override?: string): Promise<string | null> {
  if (override) return override;
  if (cachedAccessToken && Date.now() - cachedAccessTokenAt < ACCESS_TOKEN_CACHE_MS) {
    return cachedAccessToken;
  }
  const token = await getAccessToken();
  if (token) rememberAccessToken(token);
  return token;
}

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  meta?: Record<string, unknown>;
  error?: { code: string; message: string };
};

export async function getAccessToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(AUTH_COOKIE)?.value ?? null;
}

function sessionCookieOpts(maxAge = 60 * 60 * 24 * 30) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: cookieSecureFlag(VENDOR_BASE),
    maxAge,
  };
}

async function refreshAccessToken(): Promise<string | null> {
  const store = await cookies();
  const refreshToken = store.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) return null;

  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as ApiEnvelope<{
    accessToken: string;
    refreshToken?: string;
  }>;
  if (!res.ok || json.success === false || !json.data?.accessToken) {
    try {
      store.delete(AUTH_COOKIE);
      store.delete(REFRESH_COOKIE);
      store.delete("vendor_session");
    } catch {
      /* RSC may not allow cookie mutation */
    }
    return null;
  }

  try {
    const opts = sessionCookieOpts();
    store.set(AUTH_COOKIE, json.data.accessToken, opts);
    if (json.data.refreshToken) {
      store.set(REFRESH_COOKIE, json.data.refreshToken, opts);
    }
  } catch {
    /* proxy/middleware will persist on next navigation */
  }
  rememberAccessToken(json.data.accessToken);
  return json.data.accessToken;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & {
    auth?: boolean;
    _retried?: boolean;
    /** Used after refresh when cookies() cannot be mutated in RSC. */
    accessTokenOverride?: string;
  } = {}
): Promise<{ data: T; meta?: Record<string, unknown> }> {
  const { auth = true, headers, _retried, accessTokenOverride, ...rest } = options;
  const h = new Headers(headers);
  h.set("Content-Type", "application/json");

  if (auth) {
    const token = await resolveAccessToken(accessTokenOverride);
    if (token) h.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_URL}${path.startsWith("/") ? path : `/${path}`}`, {
    ...rest,
    headers: h,
    cache: "no-store",
  });

  if (auth && res.status === 401 && !_retried) {
    const nextToken = await refreshAccessToken();
    if (nextToken) {
      return apiFetch<T>(path, { ...options, _retried: true, accessTokenOverride: nextToken });
    }
    redirect("/login?error=session");
  }

  const json = (await res.json().catch(() => ({}))) as ApiEnvelope<T>;
  if (!res.ok || json.success === false) {
    throw new Error(json.error?.message || `API ${res.status}: ${path}`);
  }
  return { data: json.data, meta: json.meta };
}

export async function apiLogin(email: string, password: string) {
  return apiFetch<{
    user: { id: string; name: string; email: string; role: string };
    accessToken: string;
    refreshToken: string;
  }>("/auth/login", {
    method: "POST",
    auth: false,
    body: JSON.stringify({ email, password }),
  });
}

export function formatINR(amount: number | string | null | undefined) {
  const n = typeof amount === "string" ? Number(amount) : amount ?? 0;
  if (Number.isNaN(n)) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function mapEventStatus(s?: string): "Live" | "Upcoming" | "Completed" {
  if (s === "LIVE") return "Live";
  if (s === "COMPLETED") return "Completed";
  return "Upcoming";
}

export function fmtDate(d?: string | Date | null) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

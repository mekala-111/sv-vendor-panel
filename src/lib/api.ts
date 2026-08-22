import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "http://localhost:4000/api";

export const AUTH_COOKIE = "sv_vendor_access";
export const REFRESH_COOKIE = "sv_vendor_refresh";

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
    store.delete(AUTH_COOKIE);
    store.delete(REFRESH_COOKIE);
    store.delete("vendor_session");
    return null;
  }

  store.set(AUTH_COOKIE, json.data.accessToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
  if (json.data.refreshToken) {
    store.set(REFRESH_COOKIE, json.data.refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
    });
  }
  return json.data.accessToken;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { auth?: boolean; _retried?: boolean } = {}
): Promise<{ data: T; meta?: Record<string, unknown> }> {
  const { auth = true, headers, _retried, ...rest } = options;
  const h = new Headers(headers);
  h.set("Content-Type", "application/json");

  if (auth) {
    const token = await getAccessToken();
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
      return apiFetch<T>(path, { ...options, _retried: true });
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

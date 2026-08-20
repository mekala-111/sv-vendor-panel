/**
 * HTTP client for backend API calls with JWT token handling.
 * Server-only: reads the access token from the httpOnly cookie (via next/headers) and
 * attaches it as `Authorization: Bearer <token>`, since the backend only ever reads that
 * header — it does not authenticate via cookies.
 */

import { cookies } from "next/headers";
import { ACCESS_TOKEN_COOKIE } from "./cookies";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
}

const getApiUrl = () => {
  // Use public URL if available, fallback to private
  const base = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "http://localhost:4000/api";
  // Must end with a trailing slash: `new URL(path, base)` drops the base's own
  // path segment (e.g. "/api") whenever `path` starts with "/", unless base ends in "/".
  return base.endsWith("/") ? base : `${base}/`;
};

/** Envelope shape every sv-live-backend response is wrapped in: { success, data, meta } or { success: false, error }. */
interface ApiEnvelope {
  success: boolean;
  data?: unknown;
  meta?: Record<string, unknown>;
  error?: { code: string; message: string };
}

function isEnvelope(data: unknown): data is ApiEnvelope {
  return !!data && typeof data === "object" && "success" in data;
}

/**
 * Fetch wrapper that handles JWT tokens via httpOnly cookies.
 * Tokens are automatically included by the browser/middleware.
 * Unwraps the backend's { success, data, meta } envelope and throws ApiError on failure.
 */
async function rawApiCall(
  path: string,
  options: FetchOptions = {}
): Promise<{ data: unknown; meta?: Record<string, unknown> }> {
  // A leading "/" makes the URL constructor treat `path` as absolute (replacing the
  // base's own path, e.g. "/api"), so it must be stripped for the base to apply.
  const url = new URL(path.replace(/^\/+/, ""), getApiUrl());

  // Append query params if provided
  if (options.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });
  }

  const store = await cookies();
  const accessToken = store.get(ACCESS_TOKEN_COOKIE)?.value;

  const response = await fetch(url.toString(), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
  });

  const contentType = response.headers.get("content-type");
  const isJson = contentType?.includes("application/json");

  let data: unknown;
  if (isJson) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok || (isEnvelope(data) && data.success === false)) {
    const message = isEnvelope(data)
      ? data.error?.message ?? `API Error: ${response.statusText}`
      : `API Error: ${response.statusText}`;
    throw new ApiError(message, response.status, data);
  }

  if (isEnvelope(data)) {
    return { data: data.data, meta: data.meta };
  }
  return { data };
}

export async function apiCall<T = unknown>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { data } = await rawApiCall(path, options);
  return data as T;
}

/** Like apiCall, but also returns the backend's pagination meta (page/limit/total/totalPages) for list endpoints. */
export async function apiCallList<T = unknown>(
  path: string,
  options: FetchOptions = {}
): Promise<{ items: T[]; meta: { page: number; limit: number; total: number; totalPages: number } }> {
  const { data, meta } = await rawApiCall(path, options);
  return {
    items: (data as T[]) ?? [],
    meta: {
      page: Number(meta?.page ?? 1),
      limit: Number(meta?.limit ?? 20),
      total: Number(meta?.total ?? 0),
      totalPages: Number(meta?.totalPages ?? 1),
    },
  };
}

// Type-safe API methods
export const api = {
  get: <T = unknown>(path: string, options?: FetchOptions) =>
    apiCall<T>(path, { ...options, method: "GET" }),

  getList: <T = unknown>(path: string, options?: FetchOptions) =>
    apiCallList<T>(path, { ...options, method: "GET" }),

  post: <T = unknown>(path: string, body?: unknown, options?: FetchOptions) =>
    apiCall<T>(path, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T = unknown>(path: string, body?: unknown, options?: FetchOptions) =>
    apiCall<T>(path, {
      ...options,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T = unknown>(path: string, body?: unknown, options?: FetchOptions) =>
    apiCall<T>(path, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T = unknown>(path: string, options?: FetchOptions) =>
    apiCall<T>(path, { ...options, method: "DELETE" }),
};

// Type-safe response types from backend
export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: "SUPER_ADMIN" | "ADMIN" | "VENDOR" | "CUSTOMER";
  };
  accessToken: string;
  refreshToken: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

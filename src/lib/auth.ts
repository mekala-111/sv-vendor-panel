"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { api, type AuthResponse } from "./api";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "./cookies";

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const remember = formData.get("remember") === "on";

  // Validate input
  if (!email.includes("@") || !password) {
    redirect("/login?error=1");
  }

  // `redirect()` interrupts execution by throwing — it must never be called inside
  // this try block, or the catch below would swallow a successful login as an error.
  let response: AuthResponse;
  try {
    response = await api.post<AuthResponse>("/auth/login", { email, password });

    if (!response.accessToken || !response.refreshToken) {
      throw new Error("Backend did not return tokens");
    }
    if (response.user.role !== "VENDOR") {
      throw new Error("Not a vendor account");
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Login failed. Please try again.";
    console.error("Login error:", errorMessage);

    // Redirect with error indicator
    redirect("/login?error=1");
  }

  // Store JWT tokens in httpOnly cookies
  const store = await cookies();
  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    ...(remember ? { maxAge: 60 * 60 * 24 * 30 } : {}),
  };

  store.set(ACCESS_TOKEN_COOKIE, response.accessToken, cookieOptions);
  store.set(REFRESH_TOKEN_COOKIE, response.refreshToken, cookieOptions);

  // Store user info in a non-httpOnly cookie for client-side access if needed
  store.set(
    "vendor_user",
    JSON.stringify({
      id: response.user.id,
      name: response.user.name,
      email: response.user.email,
      role: response.user.role,
    }),
    {
      httpOnly: false, // Accessible to client-side
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      ...(remember ? { maxAge: 60 * 60 * 24 * 30 } : {}),
    }
  );

  redirect("/vendor/dashboard");
}

export async function logout() {
  const store = await cookies();

  // Optionally call backend logout to invalidate refresh token
  try {
    const refreshToken = store.get(REFRESH_TOKEN_COOKIE)?.value;
    if (refreshToken) {
      await api.post("/auth/logout", { refreshToken });
    }
  } catch (error) {
    console.error("Logout API call failed:", error);
    // Continue with client-side logout even if backend call fails
  }

  // Clear all auth cookies
  store.delete(ACCESS_TOKEN_COOKIE);
  store.delete(REFRESH_TOKEN_COOKIE);
  store.delete("vendor_user");

  redirect("/login");
}

/**
 * Get current vendor user from cookie (client-side safe)
 * This is useful for components that need user info
 */
export async function getVendorUser() {
  const store = await cookies();
  const userCookie = store.get("vendor_user")?.value;

  if (!userCookie) {
    return null;
  }

  try {
    return JSON.parse(userCookie);
  } catch {
    return null;
  }
}

/**
 * Refresh access token using refresh token
 * Called by middleware or before API calls if token is expired
 */
export async function refreshAccessToken() {
  const store = await cookies();
  const refreshToken = store.get(REFRESH_TOKEN_COOKIE)?.value;

  if (!refreshToken) {
    redirect("/login");
  }

  try {
    const response = await api.post<AuthResponse>("/auth/refresh", {
      refreshToken,
    });

    // Update access token
    store.set(ACCESS_TOKEN_COOKIE, response.accessToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
    });

    return response.accessToken;
  } catch (error) {
    console.error("Token refresh failed:", error);
    // Clear cookies and redirect to login
    store.delete(ACCESS_TOKEN_COOKIE);
    store.delete(REFRESH_TOKEN_COOKIE);
    store.delete("vendor_user");
    redirect("/login");
  }
}

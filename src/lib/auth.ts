"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { apiFetch, apiLogin, AUTH_COOKIE, REFRESH_COOKIE } from "./api";

function rethrowRedirect(err: unknown) {
  if (
    typeof err === "object" &&
    err !== null &&
    "digest" in err &&
    typeof (err as { digest?: string }).digest === "string" &&
    (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  ) {
    throw err;
  }
}

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const remember = formData.get("remember") === "on";

  if (!email.includes("@") || !password) {
    redirect("/login?error=1");
  }

  try {
    const { data } = await apiLogin(email, password);
    if (data.user.role !== "VENDOR") {
      redirect("/login?error=role");
    }
    const store = await cookies();
    const maxAge = remember ? 60 * 60 * 24 * 30 : undefined;
    store.set(AUTH_COOKIE, data.accessToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      ...(maxAge ? { maxAge } : {}),
    });
    store.set(REFRESH_COOKIE, data.refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      ...(maxAge ? { maxAge } : {}),
    });
    // legacy cookie name kept so old proxy matcher still works during transition
    store.set("vendor_session", data.user.email, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      ...(maxAge ? { maxAge } : {}),
    });
  } catch (err) {
    rethrowRedirect(err);
    redirect("/login?error=1");
  }
  redirect("/vendor/dashboard");
}

export async function logout() {
  const store = await cookies();
  const refresh = store.get(REFRESH_COOKIE)?.value;
  if (refresh) {
    try {
      await apiFetch("/auth/logout", {
        method: "POST",
        auth: false,
        body: JSON.stringify({ refreshToken: refresh }),
      });
    } catch {
      /* ignore */
    }
  }
  store.delete(AUTH_COOKIE);
  store.delete(REFRESH_COOKIE);
  store.delete("vendor_session");
  redirect("/login");
}

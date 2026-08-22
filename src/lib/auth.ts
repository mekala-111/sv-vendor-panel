"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { apiFetch, apiLogin, AUTH_COOKIE, REFRESH_COOKIE } from "./api";
import { cookieSecureFlag } from "./session-cookies";

const VENDOR_BASE =
  process.env.NEXT_PUBLIC_VENDOR_PANEL_URL ||
  process.env.VENDOR_PANEL_URL ||
  process.env.VENDOR_BASE_URL ||
  "";

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
    // Always persist session cookies so refresh can renew the 15m access JWT.
    const maxAge = remember ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7;
    const cookieOpts = {
      httpOnly: true,
      sameSite: "lax" as const,
      path: "/",
      secure: cookieSecureFlag(VENDOR_BASE),
      maxAge,
    };
    store.set(AUTH_COOKIE, data.accessToken, cookieOpts);
    store.set(REFRESH_COOKIE, data.refreshToken, cookieOpts);
    // legacy cookie name kept so old proxy matcher still works during transition
    store.set("vendor_session", data.user.email, cookieOpts);
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

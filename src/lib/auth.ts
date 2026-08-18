"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE = "vendor_session";

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const remember = formData.get("remember") === "on";

  // ponytail: cookie flag only, swap for vendor auth API when backend exists
  if (!email.includes("@") || !password) {
    redirect("/login?error=1");
  }

  const store = await cookies();
  store.set(COOKIE, email, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    ...(remember ? { maxAge: 60 * 60 * 24 * 30 } : {}),
  });
  redirect("/vendor/dashboard");
}

export async function logout() {
  const store = await cookies();
  store.delete(COOKIE);
  redirect("/login");
}

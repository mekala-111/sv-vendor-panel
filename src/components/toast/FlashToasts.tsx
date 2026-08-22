"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "@/components/toast/ToastProvider";

const FLASH_KEYS = [
  "saved",
  "error",
  "created",
  "connected",
  "disconnected",
  "assigned",
  "reset",
  "toast",
  "success",
] as const;

function messageFor(key: string, value: string): { text: string; kind: "success" | "error" | "info" } | null {
  const v = value.trim();
  if (!v) return null;

  if (key === "error") {
    if (v === "1" || v === "true") return { text: "Something went wrong. Please try again.", kind: "error" };
    if (v === "session") return { text: "Session expired. Please sign in again.", kind: "error" };
    if (v === "role") return { text: "You do not have access to this panel.", kind: "error" };
    if (v === "missing") return { text: "Missing required information.", kind: "error" };
    if (v === "suspend") return { text: "Could not suspend vendor.", kind: "error" };
    if (v === "activate") return { text: "Could not activate vendor.", kind: "error" };
    if (v === "approve") return { text: "Could not approve payment.", kind: "error" };
    if (v === "reject") return { text: "Could not reject payment.", kind: "error" };
    try {
      return { text: decodeURIComponent(v), kind: "error" };
    } catch {
      return { text: v, kind: "error" };
    }
  }

  if (key === "saved") {
    return { text: "Saved successfully.", kind: "success" };
  }
  if (key === "success") {
    if (v === "1" || v === "true") return { text: "Saved successfully.", kind: "success" };
    try {
      return { text: decodeURIComponent(v), kind: "success" };
    } catch {
      return { text: v, kind: "success" };
    }
  }
  if (key === "created") return { text: "Created successfully.", kind: "success" };
  if (key === "connected") return { text: "Connected successfully.", kind: "success" };
  if (key === "disconnected") return { text: "Disconnected successfully.", kind: "success" };
  if (key === "assigned") return { text: "Assigned successfully.", kind: "success" };
  if (key === "reset") return { text: "Password reset successfully.", kind: "success" };

  if (key === "toast") {
    try {
      return { text: decodeURIComponent(v), kind: "info" };
    } catch {
      return { text: v, kind: "info" };
    }
  }

  return null;
}

/** Shows toasts from URL flash query params, then strips them from the address bar. */
export function FlashToasts() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const shown: string[] = [];
    for (const key of FLASH_KEYS) {
      const raw = searchParams.get(key);
      if (!raw) continue;
      const mapped = messageFor(key, raw);
      if (!mapped) continue;
      if (mapped.kind === "success") toast.success(mapped.text);
      else if (mapped.kind === "error") toast.error(mapped.text);
      else toast.info(mapped.text);
      shown.push(key);
    }
    if (!shown.length) return;

    const next = new URLSearchParams(searchParams.toString());
    for (const key of shown) next.delete(key);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  return null;
}

"use server";

import { redirect } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { setEventThemeAction, updateEventAction } from "@/lib/server-data";

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

export async function saveEventAccessAction(formData: FormData) {
  const eventId = String(formData.get("eventId") ?? "").trim();
  const accessType = String(formData.get("accessType") ?? "PUBLIC").trim().toUpperCase();
  const password = String(formData.get("password") ?? "").trim();
  const isEnabled = formData.get("isEnabled") === "on";

  if (!eventId) redirect("/vendor/events");

  try {
    await apiFetch(`/events/${eventId}/access`, {
      method: "PUT",
      body: JSON.stringify({
        accessType: accessType === "PRIVATE" ? "PRIVATE" : "PUBLIC",
        isEnabled,
        ...(accessType === "PRIVATE" && password ? { password } : {}),
      }),
    });
  } catch (err) {
    rethrowRedirect(err);
    redirect(`/vendor/events/${eventId}?tab=Settings&error=1`);
  }
  redirect(`/vendor/events/${eventId}?tab=Settings&saved=1`);
}

export async function assignEventThemeAction(formData: FormData) {
  const eventId = String(formData.get("eventId") ?? "").trim();
  const themeId = String(formData.get("themeId") ?? "").trim();
  if (!eventId) redirect("/vendor/events");

  try {
    if (themeId) {
      await setEventThemeAction(eventId, { themeId });
      await updateEventAction(eventId, { themeId });
    }
  } catch (err) {
    rethrowRedirect(err);
    redirect(`/vendor/events/${eventId}?tab=Theme&error=1`);
  }
  redirect(`/vendor/events/${eventId}?tab=Theme&saved=1`);
}

export async function saveEventPageAction(formData: FormData) {
  const eventId = String(formData.get("eventId") ?? "").trim();
  const eventSlug = String(formData.get("eventSlug") ?? "").trim().toLowerCase();
  const pageTitle = String(formData.get("pageTitle") ?? "").trim();
  if (!eventId) redirect("/vendor/events");

  try {
    await updateEventAction(eventId, {
      ...(eventSlug ? { eventSlug } : {}),
      ...(pageTitle ? { pageTitle } : {}),
    });
  } catch (err) {
    rethrowRedirect(err);
    redirect(`/vendor/events/${eventId}?tab=Event%20Page&error=1`);
  }
  redirect(`/vendor/events/${eventId}?tab=Event%20Page&saved=1`);
}

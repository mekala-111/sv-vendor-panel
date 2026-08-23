"use server";

import { redirect } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { fetchEvent, setEventThemeAction, updateEventAction } from "@/lib/server-data";
import { buildThemeContentPayload, extraThemeFields } from "@/lib/theme-content-payload";

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

async function persistSectionToggles(
  eventId: string,
  payload: Record<string, unknown>,
  extras: Record<string, unknown> = {}
) {
  const patch = {
    ...(payload.showSubEvents !== undefined ? { showSubEvents: payload.showSubEvents } : {}),
    ...(payload.showInvitationCard !== undefined
      ? { showInvitationCard: payload.showInvitationCard }
      : {}),
    ...extras,
  };
  if (!Object.keys(patch).length) {
    return;
  }
  const event = await fetchEvent(eventId);
  const raw = (event?.raw ?? {}) as Record<string, unknown>;
  const themeConfig =
    raw.themeConfig && typeof raw.themeConfig === "object"
      ? (raw.themeConfig as Record<string, unknown>)
      : null;
  const themeId = String(themeConfig?.themeId || raw.themeId || "").trim();
  if (!themeId) return;

  const prevCustom =
    themeConfig?.customConfig && typeof themeConfig.customConfig === "object"
      ? (themeConfig.customConfig as Record<string, unknown>)
      : {};

  await setEventThemeAction(eventId, {
    themeId,
    customConfig: {
      ...prevCustom,
      ...patch,
    },
  });
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

export async function saveThemeContentAction(formData: FormData) {
  const eventId = String(formData.get("eventId") ?? "").trim();
  if (!eventId) redirect("/vendor/events");

  try {
    const payload = buildThemeContentPayload(formData, "live");
    await updateEventAction(eventId, payload);
    await persistSectionToggles(eventId, payload, extraThemeFields(formData));
  } catch (err) {
    rethrowRedirect(err);
    redirect(`/vendor/events/${eventId}?tab=Theme%20Content&error=1`);
  }
  redirect(`/vendor/events/${eventId}?tab=Theme%20Content&saved=1`);
}

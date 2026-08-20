"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { api, ApiError } from "./api";
import { fetchShareInfo, type Event, type ShareInfo } from "./hooks/useEvents";

function errorRedirect(to: string, message: string): never {
  redirect(`${to}?error=${encodeURIComponent(message)}`);
}

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

/** Combines a date input ("2026-05-24") and a time input ("19:00") into an ISO datetime the backend can coerce. */
function combineDateTime(date: string, time: string): string | undefined {
  if (!date) return undefined;
  return time ? `${date}T${time}:00` : `${date}T00:00:00`;
}

export interface CreateEventResult {
  ok: boolean;
  error?: string;
  event?: Event;
  shareInfo?: ShareInfo | null;
}

/**
 * Called directly from the client wizard (not via <form action>) with a hand-built FormData,
 * since the wizard's steps unmount and a native multi-step form can't collect every field at
 * final submit. Bundles create -> theme-config -> youtube-stream -> publish -> share info into
 * one call and returns a result object so the wizard can render the real success card in place.
 */
export async function createEventAction(formData: FormData): Promise<CreateEventResult> {
  const eventName = str(formData, "eventName");
  if (eventName.length < 2) return { ok: false, error: "Event name must be at least 2 characters." };

  const customerId = str(formData, "customerId");
  const eventType = str(formData, "eventType");
  const eventDate = str(formData, "eventDate");
  const startTime = str(formData, "startTime");
  const location = str(formData, "location");
  const pageTitle = str(formData, "pageTitle");
  const description = str(formData, "description");
  const coverImage = str(formData, "coverImage");
  const liveTiming = str(formData, "liveTiming");
  const themeId = str(formData, "themeId");
  const youtubeChannelId = str(formData, "youtubeChannelId");
  const youtubeVideoId = str(formData, "youtubeVideoId");
  const youtubeLiveUrl = str(formData, "youtubeLiveUrl");

  let event: Event;
  try {
    event = await api.post<Event>("/events", {
      eventName,
      ...(customerId ? { customerId } : {}),
      ...(eventType ? { eventType } : {}),
      ...(description ? { description } : {}),
      ...(eventDate ? { eventDate } : {}),
      ...(eventDate && startTime ? { startTime: combineDateTime(eventDate, startTime) } : {}),
      ...(location ? { location } : {}),
      ...(pageTitle ? { pageTitle } : {}),
      ...(coverImage ? { coverImage } : {}),
      ...(liveTiming ? { liveTiming } : {}),
      ...(themeId ? { themeId } : {}),
    });
  } catch (error) {
    return { ok: false, error: error instanceof ApiError ? error.message : "Failed to create event." };
  }

  if (themeId) {
    try {
      await api.put(`/events/${event.id}/theme-config`, { themeId });
    } catch (error) {
      return {
        ok: false,
        error: `Event created, but applying the theme failed: ${error instanceof ApiError ? error.message : "unknown error"}. You can set it from the event page.`,
        event,
      };
    }
  }

  if (youtubeChannelId) {
    try {
      await api.post("/youtube/streams", {
        eventId: event.id,
        youtubeChannelId,
        ...(youtubeVideoId ? { youtubeVideoId } : {}),
        ...(youtubeLiveUrl ? { youtubeLiveUrl } : {}),
      });
    } catch (error) {
      return {
        ok: false,
        error: `Event created, but linking YouTube failed: ${error instanceof ApiError ? error.message : "unknown error"}. You can link it from the event page.`,
        event,
      };
    }
  }

  let published: Event;
  try {
    published = await api.post<Event>(`/events/${event.id}/publish`);
  } catch (error) {
    return {
      ok: false,
      error: `Event created, but publishing failed: ${error instanceof ApiError ? error.message : "unknown error"}. You can publish it from the event page.`,
      event,
    };
  }

  const shareInfo = await fetchShareInfo(published.eventSlug);

  revalidatePath("/vendor/events");
  return { ok: true, event: published, shareInfo };
}

export async function updateEventAction(id: string, formData: FormData) {
  const eventName = str(formData, "eventName");
  if (eventName.length < 2) errorRedirect(`/vendor/events/${id}/edit`, "Event name must be at least 2 characters.");

  const eventType = str(formData, "eventType");
  const eventDate = str(formData, "eventDate");
  const location = str(formData, "location");
  const pageTitle = str(formData, "pageTitle");
  const description = str(formData, "description");
  const coverImage = str(formData, "coverImage");

  try {
    await api.patch(`/events/${id}`, {
      eventName,
      eventType: eventType || undefined,
      eventDate: eventDate || undefined,
      location: location || undefined,
      pageTitle: pageTitle || undefined,
      description: description || undefined,
      coverImage: coverImage || undefined,
    });
  } catch (error) {
    const message = error instanceof ApiError ? error.message : "Failed to update event.";
    errorRedirect(`/vendor/events/${id}/edit`, message);
  }

  revalidatePath("/vendor/events");
  revalidatePath(`/vendor/events/${id}`);
  redirect(`/vendor/events/${id}`);
}

export async function publishEventAction(id: string, formData: FormData) {
  void formData;
  try {
    await api.post(`/events/${id}/publish`);
  } catch (error) {
    const message = error instanceof ApiError ? error.message : "Failed to publish event.";
    errorRedirect(`/vendor/events/${id}`, message);
  }
  revalidatePath("/vendor/events");
  revalidatePath(`/vendor/events/${id}`);
  redirect(`/vendor/events/${id}`);
}

export async function unpublishEventAction(id: string, formData: FormData) {
  void formData;
  try {
    await api.post(`/events/${id}/unpublish`);
  } catch (error) {
    const message = error instanceof ApiError ? error.message : "Failed to unpublish event.";
    errorRedirect(`/vendor/events/${id}`, message);
  }
  revalidatePath("/vendor/events");
  revalidatePath(`/vendor/events/${id}`);
  redirect(`/vendor/events/${id}`);
}

export async function cancelEventAction(id: string, formData: FormData) {
  void formData;
  try {
    await api.delete(`/events/${id}`);
  } catch (error) {
    const message = error instanceof ApiError ? error.message : "Failed to cancel event.";
    errorRedirect(`/vendor/events/${id}`, message);
  }
  revalidatePath("/vendor/events");
  revalidatePath(`/vendor/events/${id}`);
  redirect(`/vendor/events/${id}`);
}

export async function setEventAccessAction(id: string, formData: FormData) {
  const accessType = str(formData, "accessType") as "PUBLIC" | "PRIVATE";
  const password = str(formData, "password");

  if (accessType === "PRIVATE" && !password) {
    errorRedirect(`/vendor/events/${id}?tab=Access`, "A password is required for private events.");
  }

  try {
    await api.put(`/events/${id}/access`, {
      accessType,
      ...(password ? { password } : {}),
    });
  } catch (error) {
    const message = error instanceof ApiError ? error.message : "Failed to update access settings.";
    errorRedirect(`/vendor/events/${id}?tab=Access`, message);
  }

  revalidatePath(`/vendor/events/${id}`);
  redirect(`/vendor/events/${id}?tab=Access`);
}

export async function setEventThemeConfigAction(id: string, formData: FormData) {
  const themeId = str(formData, "themeId");
  if (!themeId) errorRedirect(`/vendor/events/${id}?tab=Theme`, "Select a theme first.");

  const primaryColor = str(formData, "primaryColor");
  const secondaryColor = str(formData, "secondaryColor");
  const accentColor = str(formData, "accentColor");
  const logo = str(formData, "logo");

  try {
    await api.put(`/events/${id}/theme-config`, {
      themeId,
      ...(primaryColor ? { primaryColor } : {}),
      ...(secondaryColor ? { secondaryColor } : {}),
      ...(accentColor ? { accentColor } : {}),
      ...(logo ? { logo } : {}),
    });
  } catch (error) {
    const message = error instanceof ApiError ? error.message : "Failed to update theme.";
    errorRedirect(`/vendor/events/${id}?tab=Theme`, message);
  }

  revalidatePath(`/vendor/events/${id}`);
  redirect(`/vendor/events/${id}?tab=Theme`);
}

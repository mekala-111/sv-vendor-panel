"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { api, ApiError } from "./api";

function errorRedirect(to: string, message: string): never {
  redirect(`${to}?error=${encodeURIComponent(message)}`);
}

/** Kicks off the Google OAuth consent flow — redirects the browser to Google, not a Next.js route. */
export async function connectYoutubeAction() {
  let authUrl: string;
  try {
    const result = await api.post<{ authUrl: string }>("/youtube/connect");
    authUrl = result.authUrl;
  } catch (error) {
    const message = error instanceof ApiError ? error.message : "Failed to start YouTube connection.";
    errorRedirect("/vendor/youtube", message);
  }
  redirect(authUrl);
}

export async function disconnectYoutubeAction(channelId: string, formData: FormData) {
  void formData;
  try {
    await api.post(`/youtube/disconnect/${channelId}`);
  } catch (error) {
    const message = error instanceof ApiError ? error.message : "Failed to disconnect channel.";
    errorRedirect("/vendor/youtube", message);
  }
  revalidatePath("/vendor/youtube");
  redirect("/vendor/youtube");
}

export async function createYoutubeStreamAction(eventId: string, formData: FormData) {
  const youtubeChannelId = String(formData.get("youtubeChannelId") ?? "").trim();
  const youtubeVideoId = String(formData.get("youtubeVideoId") ?? "").trim();
  const youtubeLiveUrl = String(formData.get("youtubeLiveUrl") ?? "").trim();

  if (!youtubeChannelId) errorRedirect(`/vendor/events/${eventId}?tab=YouTube`, "Select a channel first.");

  try {
    await api.post("/youtube/streams", {
      eventId,
      youtubeChannelId,
      ...(youtubeVideoId ? { youtubeVideoId } : {}),
      ...(youtubeLiveUrl ? { youtubeLiveUrl } : {}),
    });
  } catch (error) {
    const message = error instanceof ApiError ? error.message : "Failed to link YouTube stream.";
    errorRedirect(`/vendor/events/${eventId}?tab=YouTube`, message);
  }

  revalidatePath(`/vendor/events/${eventId}`);
  redirect(`/vendor/events/${eventId}?tab=YouTube`);
}

export async function syncYoutubeAction(eventId: string, formData: FormData) {
  void formData;
  try {
    await api.post("/youtube/sync", undefined, { params: { eventId } });
  } catch (error) {
    const message = error instanceof ApiError ? error.message : "Failed to refresh stream status.";
    errorRedirect(`/vendor/events/${eventId}?tab=YouTube`, message);
  }
  revalidatePath(`/vendor/events/${eventId}`);
  redirect(`/vendor/events/${eventId}?tab=YouTube`);
}

"use server";

import { redirect } from "next/navigation";
import {
  createEventAction,
  createYoutubeStreamAction,
  setEventThemeAction,
  updateEventAction,
} from "./server-data";

function q(path: string, params: Record<string, string | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) sp.set(k, v);
  }
  const qs = sp.toString();
  return qs ? `${path}?${qs}` : path;
}

/** Next.js `redirect()` throws; must not be swallowed by try/catch. */
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

function extractYouTubeId(url: string): string | undefined {
  const m = url.match(/(?:youtu\.be\/|v=|\/live\/|\/embed\/|\/shorts\/)([A-Za-z0-9_-]{6,})/);
  return m?.[1];
}

function optionalStr(formData: FormData, key: string) {
  const v = String(formData.get(key) ?? "").trim();
  return v || undefined;
}

function parseGallery(raw: string | undefined): string[] | undefined {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return undefined;
    return parsed.filter((x): x is string => typeof x === "string" && x.length > 0).slice(0, 20);
  } catch {
    return undefined;
  }
}

function parseSubEvents(raw: string | undefined):
  | { title: string; date?: string | null; time?: string | null; place?: string | null }[]
  | undefined {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return undefined;
    return parsed
      .map((row) => ({
        title: String(row?.title ?? "").trim(),
        date: String(row?.date ?? "").trim() || null,
        time: String(row?.time ?? "").trim() || null,
        place: String(row?.place ?? "").trim() || null,
      }))
      .filter((row) => row.title.length > 0)
      .slice(0, 20);
  } catch {
    return undefined;
  }
}

export async function submitEventDetails(formData: FormData) {
  const eventName = String(formData.get("eventName") ?? "").trim();
  const eventType = optionalStr(formData, "eventType");
  const eventDate = optionalStr(formData, "eventDate");
  const liveTiming = optionalStr(formData, "liveTiming");
  const location = optionalStr(formData, "location");
  const pageTitle = optionalStr(formData, "pageTitle");
  const coverImage = optionalStr(formData, "coverImage");
  const customerId = optionalStr(formData, "customerId");
  const eventId = optionalStr(formData, "eventId");

  if (eventName.length < 2) {
    redirect(q("/vendor/events/new", { step: "1", eventId, error: "1" }));
  }

  try {
    const payload: Record<string, unknown> = {
      eventName,
      ...(eventType ? { eventType } : {}),
      ...(eventDate ? { eventDate } : {}),
      ...(liveTiming ? { liveTiming } : {}),
      ...(location ? { location } : {}),
      ...(pageTitle ? { pageTitle } : {}),
      ...(coverImage ? { coverImage } : {}),
      ...(customerId ? { customerId } : {}),
    };

    if (eventId) {
      await updateEventAction(eventId, payload);
      redirect(q("/vendor/events/new", { step: "2", eventId }));
    }

    // Draft only — Razorpay fee + publish happen on the Payment step.
    const created = await createEventAction(payload);
    redirect(q("/vendor/events/new", { step: "2", eventId: created.id }));
  } catch (err) {
    rethrowRedirect(err);
    const message = err instanceof Error ? err.message : "";
    if (/unauthorized|session|token/i.test(message)) {
      redirect("/login?error=session");
    }
    redirect(q("/vendor/events/new", { step: "1", eventId, error: "1" }));
  }
}

export async function submitYoutubeStep(formData: FormData) {
  const eventId = String(formData.get("eventId") ?? "").trim();
  const youtubeChannelId = optionalStr(formData, "youtubeChannelId");
  const youtubeLiveUrl = optionalStr(formData, "youtubeLiveUrl");
  const youtubeLiveKey = optionalStr(formData, "youtubeLiveKey");
  const teaserUrl = optionalStr(formData, "teaserVideo");
  const scrollMessage = optionalStr(formData, "scrollMessage");

  if (!eventId) redirect("/vendor/events/new?step=1&error=1");

  try {
    const videoId =
      (teaserUrl ? extractYouTubeId(teaserUrl) : undefined) ||
      (youtubeLiveUrl ? extractYouTubeId(youtubeLiveUrl) : undefined);

    await updateEventAction(eventId, {
      ...(youtubeChannelId ? { youtubeChannelId } : {}),
      ...(youtubeLiveUrl ? { youtubeLiveUrl } : {}),
      ...(videoId ? { youtubeVideoId: videoId } : {}),
      ...(teaserUrl ? { teaserUrl } : {}),
      ...(scrollMessage ? { scrollMessage } : {}),
    });

    if (youtubeChannelId) {
      try {
        await createYoutubeStreamAction({
          eventId,
          youtubeChannelId,
          ...(videoId ? { youtubeVideoId: videoId } : {}),
          ...(youtubeLiveUrl ? { youtubeLiveUrl } : {}),
          ...(youtubeLiveKey ? { youtubeLiveKey } : {}),
        });
      } catch (err) {
        rethrowRedirect(err);
      }
    }
  } catch (err) {
    rethrowRedirect(err);
    redirect(q("/vendor/events/new", { step: "2", eventId, error: "1" }));
  }

  redirect(q("/vendor/events/new", { step: "3", eventId }));
}

export async function submitThemeStep(formData: FormData) {
  const eventId = String(formData.get("eventId") ?? "").trim();
  const themeId = optionalStr(formData, "themeId");

  if (!eventId) redirect("/vendor/events/new?step=1&error=1");

  try {
    if (themeId) {
      await setEventThemeAction(eventId, { themeId });
      await updateEventAction(eventId, { themeId });
    }
  } catch (err) {
    rethrowRedirect(err);
    redirect(q("/vendor/events/new", { step: "3", eventId, error: "1" }));
  }

  redirect(q("/vendor/events/new", { step: "4", eventId }));
}

export async function submitThemeContentStep(formData: FormData) {
  const eventId = String(formData.get("eventId") ?? "").trim();
  const brideName = optionalStr(formData, "brideName");
  const groomName = optionalStr(formData, "groomName");
  const brideImage = optionalStr(formData, "brideImage");
  const groomImage = optionalStr(formData, "groomImage");
  const eventDate = optionalStr(formData, "eventDate");
  const eventTime = optionalStr(formData, "eventTime");
  const eventPlace = optionalStr(formData, "eventPlace");
  const invitationCard = optionalStr(formData, "invitationCard");
  const galleryImages = parseGallery(optionalStr(formData, "galleryImages"));
  const subEvents = parseSubEvents(optionalStr(formData, "subEvents"));

  if (!eventId) redirect("/vendor/events/new?step=1&error=1");

  try {
    await updateEventAction(eventId, {
      ...(brideName ? { brideName } : {}),
      ...(groomName ? { groomName } : {}),
      ...(brideImage ? { brideImage } : {}),
      ...(groomImage ? { groomImage } : {}),
      ...(eventDate ? { eventDate } : {}),
      ...(eventTime ? { eventTime } : {}),
      ...(eventPlace ? { eventPlace, location: eventPlace } : {}),
      ...(invitationCard ? { invitationCard } : {}),
      ...(galleryImages ? { galleryImages } : {}),
      ...(subEvents ? { subEvents } : {}),
    });
  } catch (err) {
    rethrowRedirect(err);
    redirect(q("/vendor/events/new", { step: "4", eventId, error: "1" }));
  }

  redirect(q("/vendor/events/new", { step: "5", eventId }));
}

export async function submitEventPageStep(formData: FormData) {
  const eventId = String(formData.get("eventId") ?? "").trim();
  const eventSlug = String(formData.get("eventSlug") ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "")
    .replace(/^-+|-+$/g, "");

  if (!eventId) redirect("/vendor/events/new?step=1&error=1");
  if (!eventSlug) {
    redirect(q("/vendor/events/new", { step: "5", eventId, error: "1" }));
  }

  try {
    await updateEventAction(eventId, { eventSlug });
  } catch (err) {
    rethrowRedirect(err);
    redirect(q("/vendor/events/new", { step: "5", eventId, error: "1" }));
  }

  redirect(q("/vendor/events/new", { step: "6", eventId }));
}

export async function submitPublishStep(formData: FormData) {
  const eventId = String(formData.get("eventId") ?? "").trim();
  if (!eventId) redirect("/vendor/events/new?step=1&error=1");

  try {
    const { publishEventAction } = await import("./server-data");
    await publishEventAction(eventId);
  } catch (err) {
    rethrowRedirect(err);
    redirect(q("/vendor/events/new", { step: "6", eventId, error: "pay" }));
  }

  redirect(`/vendor/events/${eventId}`);
}

export async function fetchEventCreationPaymentConfig() {
  const { fetchEventCreationPaymentConfigAction } = await import("./server-data");
  return fetchEventCreationPaymentConfigAction();
}

export async function submitQrEventPayment(payload: {
  eventId: string;
  utrNumber: string;
  paymentImage: string;
}) {
  const { submitEventCreationPaymentAction } = await import("./server-data");
  return submitEventCreationPaymentAction(payload);
}

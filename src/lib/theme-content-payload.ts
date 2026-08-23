import type { EventWizardKind } from "./event-wizard";

function optionalStr(formData: FormData, key: string) {
  const v = String(formData.get(key) ?? "").trim();
  return v || undefined;
}

function extractYouTubeId(url: string): string | undefined {
  const m = url.match(/(?:youtu\.be\/|v=|\/live\/|\/embed\/|\/shorts\/)([A-Za-z0-9_-]{6,})/);
  return m?.[1];
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
  | {
      title: string;
      date?: string | null;
      time?: string | null;
      place?: string | null;
      image?: string | null;
    }[]
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
        image: String(row?.image ?? "").trim() || null,
      }))
      .filter((row) => row.title.length > 0)
      .slice(0, 20);
  } catch {
    return undefined;
  }
}

const EVENT_CONTENT_KEYS = [
  "brideName",
  "groomName",
  "brideImage",
  "groomImage",
  "eventDate",
  "eventTime",
  "eventPlace",
  "invitationCard",
  "scrollMessage",
  "pageTitle",
  "coverImage",
  "description",
  "remarks1",
  "remarks2",
  "logoImage",
  "customImage",
  "youtubeLiveUrl",
  "youtubeLiveKey",
  "teaserUrl",
] as const;

export function buildThemeContentPayload(
  formData: FormData,
  kind: EventWizardKind = "invitation"
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const key of EVENT_CONTENT_KEYS) {
    const v = optionalStr(formData, key);
    if (v) payload[key] = v;
  }
  const galleryImages = parseGallery(optionalStr(formData, "galleryImages"));
  if (galleryImages) payload.galleryImages = galleryImages;
  const subEvents = parseSubEvents(optionalStr(formData, "subEvents"));
  if (subEvents) payload.subEvents = subEvents;

  // Explicit string flags from hidden inputs ("true" / "false").
  if (formData.has("showSubEvents")) {
    payload.showSubEvents = String(formData.get("showSubEvents")).toLowerCase() === "true";
  }
  if (formData.has("showInvitationCard")) {
    payload.showInvitationCard = String(formData.get("showInvitationCard")).toLowerCase() === "true";
  }

  if (payload.eventPlace) payload.location = payload.eventPlace;

  if (kind === "live") {
    const youtubeLiveUrl = optionalStr(formData, "youtubeLiveUrl");
    const teaserUrl = optionalStr(formData, "teaserUrl");
    // Prefer the live stream ID — teaser is only a fallback (wrong ID causes
    // "Video unavailable" on the public page while preview still looks fine).
    const videoId =
      (youtubeLiveUrl ? extractYouTubeId(youtubeLiveUrl) : undefined) ||
      (teaserUrl ? extractYouTubeId(teaserUrl) : undefined);
    if (youtubeLiveUrl) payload.youtubeLiveUrl = youtubeLiveUrl;
    if (teaserUrl) payload.teaserUrl = teaserUrl;
    if (videoId) payload.youtubeVideoId = videoId;
  }

  return payload;
}

const RESERVED_THEME_KEYS = new Set<string>([
  ...EVENT_CONTENT_KEYS,
  "galleryImages",
  "subEvents",
  "showSubEvents",
  "showInvitationCard",
  "eventId",
  "invitationId",
  "themeId",
  "wizardKind",
  "kind",
  "eventSlug",
  "location",
  "youtubeVideoId",
]);

export function extraThemeFields(formData: FormData): Record<string, unknown> {
  const extras: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (RESERVED_THEME_KEYS.has(key)) continue;
    if (typeof value !== "string") continue;
    extras[key] = value.trim();
  }
  return extras;
}

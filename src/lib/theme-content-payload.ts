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
  const showSubEvents = String(formData.get("showSubEvents") ?? "true");
  payload.showSubEvents = showSubEvents !== "false";
  if (payload.eventPlace) payload.location = payload.eventPlace;

  if (kind === "live") {
    const youtubeLiveUrl = optionalStr(formData, "youtubeLiveUrl");
    const teaserUrl = optionalStr(formData, "teaserUrl");
    const videoId =
      (teaserUrl ? extractYouTubeId(teaserUrl) : undefined) ||
      (youtubeLiveUrl ? extractYouTubeId(youtubeLiveUrl) : undefined);
    if (videoId) payload.youtubeVideoId = videoId;
  }

  return payload;
}

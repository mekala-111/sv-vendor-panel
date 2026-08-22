import { resolveThemeSections } from "./theme-config";
import { resolveThemePreviewUrl } from "./theme-preview";

function adminAssetUrl(path: string): string {
  if (!path.startsWith("/")) return path;
  const adminBase = (
    process.env.NEXT_PUBLIC_ADMIN_PANEL_URL ||
    process.env.ADMIN_PANEL_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
  return `${adminBase}${path}`;
}

function resolveEventImage(value: string | null): string | null {
  if (!value) return null;
  if (value.startsWith("data:") || value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }
  const apiOrigin = (
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.API_URL ||
    "http://localhost:4000/api"
  )
    .replace(/\/api\/?$/, "")
    .replace(/\/$/, "");
  if (value.startsWith("/")) return `${apiOrigin}${value}`;
  return value;
}

export type VendorThemePreview = {
  _id: string;
  slug: string;
  name: string;
  layout?: string;
  previewImage?: string | null;
  primary?: string;
  secondary?: string;
  accent?: string;
  config?: {
    layout?: string;
    colors?: {
      primary?: string;
      secondary?: string;
      accent?: string;
      background?: string;
      text?: string;
    };
    fontFamily?: string;
    sections?: Record<string, boolean>;
    fields?: unknown[];
    defaults?: Record<string, string>;
    assetPath?: string;
  };
};

const SAMPLE_WEDDING = {
  brideName: "Priya",
  groomName: "Rahul",
  pageTitle: "Priya & Rahul Wedding",
  eventDate: "2026-12-15",
  startTime: "2026-12-15T18:00:00.000Z",
  eventTime: "6:00 PM IST",
  eventPlace: "Grand Convention Hall, Hyderabad",
  scrollMessage: "Welcome to our celebration",
  description: "With the blessings of our families, we invite you to celebrate with us.",
  remarks1: "Your presence is our greatest gift.",
  remarks2: "Grandparents: With love and blessings\nUncles & Aunts: We welcome you with open hearts",
  subEvents: [
    { title: "Haldi", date: "14 Dec 2026", time: "10:00 AM", place: "Family Home" },
    { title: "Mehendi", date: "14 Dec 2026", time: "4:00 PM", place: "Courtyard" },
    { title: "Wedding Ceremony", date: "15 Dec 2026", time: "6:00 PM", place: "Grand Convention Hall" },
  ],
};

const SAMPLE_LIVE = {
  pageTitle: "Live Celebration",
  eventDate: "2026-11-20",
  startTime: "2026-11-20T19:00:00.000Z",
  eventTime: "7:00 PM IST",
  eventPlace: "City Auditorium",
  scrollMessage: "Welcome — stream begins shortly",
  description: "Join us for an unforgettable live experience.",
};

function sampleForLayout(layout: string, themeName: string) {
  const isWedding =
    layout.includes("wedding") ||
    layout.includes("floral") ||
    layout === "traditional" ||
    layout === "the-sacred-garden" ||
    layout.includes("sacred-garden");
  return {
    ...(isWedding ? SAMPLE_WEDDING : SAMPLE_LIVE),
    pageTitle: themeName,
  };
}

function normalizeConfig(theme: VendorThemePreview) {
  const layout = theme.config?.layout || theme.layout || theme.slug || "cinematic";
  const colors = theme.config?.colors ?? {};
  const assetPath =
    theme.config?.assetPath ??
    (layout === "traditional-streaming"
      ? "/themes/traditional-streaming"
      : layout.includes("wedding")
        ? "/themes/wedding-theme-traditional"
        : undefined);
  return {
    layout,
    assetPath,
    colors: {
      primary: colors.primary ?? theme.primary ?? "#C77B3E",
      secondary: colors.secondary ?? theme.secondary ?? "#F3D9C0",
      accent: colors.accent ?? theme.accent ?? colors.primary ?? "#8A5A2E",
      background: colors.background ?? (layout.includes("cinematic") ? "#0B0908" : "#FBF6EC"),
      text: colors.text ?? (layout.includes("cinematic") ? "#F7F1E6" : "#5A4A2E"),
    },
    fontFamily: theme.config?.fontFamily ?? "Georgia, serif",
    sections: resolveThemeSections(theme),
    fields: theme.config?.fields ?? [],
    defaults: theme.config?.defaults ?? {},
  };
}

export function buildVendorThemePreviewPayload(theme: VendorThemePreview) {
  const config = normalizeConfig(theme);
  const sample = {
    ...sampleForLayout(config.layout, theme.name),
    scrollMessage:
      theme.config?.defaults?.scrollMessage ??
      sampleForLayout(config.layout, theme.name).scrollMessage,
    remarks1: theme.config?.defaults?.remarks1 ?? SAMPLE_WEDDING.remarks1,
  };
  const previewImage = resolveThemePreviewUrl(theme.previewImage);
  const sections = resolveThemeSections(theme);
  const galleryUrls = config.layout.includes("wedding")
    ? [
        adminAssetUrl("/themes/wedding-theme-traditional/assets/gallery-1.jpg"),
        adminAssetUrl("/themes/wedding-theme-traditional/assets/gallery-2.jpg"),
        adminAssetUrl("/themes/wedding-theme-traditional/assets/gallery-3.jpg"),
      ]
    : [];

  return {
    event: {
      eventName: sample.pageTitle,
      pageTitle: sample.pageTitle,
      eventType: config.layout.includes("wedding") ? "Wedding" : "Live Event",
      eventDate: sample.eventDate,
      startTime: sample.startTime,
      eventTime: sample.eventTime,
      eventPlace: sample.eventPlace,
      location: sample.eventPlace,
      description: sample.description,
      remarks1: sample.remarks1,
      remarks2: "remarks2" in sample ? sample.remarks2 : null,
      scrollMessage: sample.scrollMessage,
      brideName: "brideName" in sample ? sample.brideName : null,
      groomName: "groomName" in sample ? sample.groomName : null,
      coverImage: previewImage,
      subEvents: "subEvents" in sample ? sample.subEvents : [],
      status: "UPCOMING",
      showWatchLive: sections.showLivePlayer !== false,
      showSocialShare: false,
      showSubEvents: sections.showSubEvents !== false,
    },
    theme: {
      name: theme.name,
      slug: theme.slug,
      config,
    },
    branding: { companyName: "SV Live" },
    youtube:
      sections.showLivePlayer !== false
        ? { videoId: null, liveUrl: null, status: "SCHEDULED" }
        : null,
    media: galleryUrls.map((fileUrl, index) => ({
      id: `gallery-${index}`,
      fileUrl,
      thumbnailUrl: fileUrl,
      type: "IMAGE",
    })),
    publicPath: "/event/draft",
  };
}

export function buildEventThemePreviewPayload(
  theme: VendorThemePreview | null | undefined,
  content: Record<string, unknown>,
  opts?: {
    eventName?: string | null;
    pageTitle?: string | null;
    coverImage?: string | null;
    scrollMessage?: string | null;
  }
) {
  if (!theme) return null;

  const base = buildVendorThemePreviewPayload(theme);
  const event = { ...base.event } as Record<string, unknown>;

  const str = (key: string) => {
    const v = content[key];
    return typeof v === "string" && v.trim() ? v.trim() : null;
  };

  for (const key of [
    "brideName",
    "groomName",
    "eventDate",
    "eventTime",
    "eventPlace",
    "pageTitle",
    "scrollMessage",
    "description",
    "remarks1",
    "remarks2",
    "invitationCard",
    "brideImage",
    "groomImage",
    "coverImage",
    "logoImage",
    "customImage",
  ]) {
    const v = str(key) ?? (typeof content[key] === "string" ? content[key] : null);
    if (v) {
      event[key] =
        key.endsWith("Image") || key === "invitationCard" || key === "coverImage"
          ? resolveEventImage(v) ?? resolveThemePreviewUrl(v) ?? v
          : v;
    }
  }

  if (opts?.eventName) event.eventName = opts.eventName;
  if (opts?.pageTitle || str("pageTitle")) {
    event.pageTitle = str("pageTitle") || opts?.pageTitle || opts?.eventName || event.pageTitle;
    event.eventName = event.pageTitle;
  }
  if (opts?.coverImage && !event.coverImage) {
    event.coverImage = resolveEventImage(opts.coverImage) ?? resolveThemePreviewUrl(opts.coverImage);
  }
  if (opts?.scrollMessage && !event.scrollMessage) event.scrollMessage = opts.scrollMessage;

  const eventDate = str("eventDate");
  const eventTime = str("eventTime");
  if (eventDate) {
    event.eventDate = eventDate;
    // Prefer vendor-entered time so stream countdown matches Theme Content fields.
    const timePart = (() => {
      if (!eventTime) return "18:00:00";
      const m = eventTime.trim().match(/^(\d{1,2}):(\d{2})(?:\s*([AaPp][Mm]))?/);
      if (!m) return "18:00:00";
      let h = Number(m[1]);
      const min = Number(m[2]);
      const ampm = m[3]?.toUpperCase();
      if (ampm === "PM" && h < 12) h += 12;
      if (ampm === "AM" && h === 12) h = 0;
      if (!ampm && h <= 23) {
        /* already 24h from <input type="time"> */
      }
      return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}:00`;
    })();
    event.startTime = `${eventDate}T${timePart}`;
  }

  const place = str("eventPlace");
  if (place) {
    event.eventPlace = place;
    event.location = place;
  }

  const subEvents = Array.isArray(content.subEvents)
    ? content.subEvents.filter((s) => s && typeof s === "object" && String((s as { title?: string }).title ?? "").trim())
    : [];
  if (subEvents.length) event.subEvents = subEvents;

  if (content.showSubEvents === false) {
    event.showSubEvents = false;
  } else if (content.showSubEvents === true || subEvents.length) {
    event.showSubEvents = true;
  }

  const galleryImages = Array.isArray(content.galleryImages)
    ? (content.galleryImages as string[]).filter((u) => typeof u === "string" && u.length > 0)
    : [];
  const media =
    galleryImages.length > 0
      ? galleryImages.map((fileUrl, index) => ({
          id: `gallery-${index}`,
          fileUrl,
          thumbnailUrl: fileUrl,
          type: "IMAGE",
        }))
      : base.media;

  const youtubeLiveUrl = str("youtubeLiveUrl") || str("teaserUrl");
  const youtube = youtubeLiveUrl
    ? {
        ...(typeof base.youtube === "object" && base.youtube ? base.youtube : {}),
        liveUrl: youtubeLiveUrl,
        videoId: null,
        status: "SCHEDULED",
      }
    : base.youtube;

  return {
    ...base,
    event,
    media,
    youtube,
    publicPath: "/event/draft",
  };
}

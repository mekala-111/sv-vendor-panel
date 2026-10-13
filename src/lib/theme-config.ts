export type ThemeFieldType =
  | "text"
  | "date"
  | "time"
  | "textarea"
  | "image"
  | "subEvents"
  | "gallery"
  | "streamKey";

export type ThemeFieldDef = {
  key: string;
  label: string;
  type: ThemeFieldType;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  maxItems?: number;
};

export type ThemeSections = {
  showCountdown: boolean;
  showGallery: boolean;
  showSubEvents: boolean;
  showLivePlayer: boolean;
  showInvitationCard: boolean;
  showCouplePhotos: boolean;
};

export const WEDDING_FIELDS: ThemeFieldDef[] = [
  { key: "brideName", label: "Bride name", type: "text", required: true, placeholder: "Priya" },
  { key: "groomName", label: "Groom name", type: "text", required: true, placeholder: "Rahul" },
  { key: "brideImage", label: "Bride image", type: "image", hint: "Any size · JPEG/PNG/WebP" },
  { key: "groomImage", label: "Groom image", type: "image", hint: "Any size · JPEG/PNG/WebP" },
  { key: "eventDate", label: "Event date", type: "date" },
  { key: "eventTime", label: "Event time", type: "time" },
  { key: "eventPlace", label: "Event place", type: "text", placeholder: "Venue name, city" },
  { key: "subEvents", label: "Sub events", type: "subEvents" },
  {
    key: "invitationCard",
    label: "Invitation card",
    type: "image",
    hint: "Any size · full invitation image",
  },
  { key: "galleryImages", label: "Gallery images", type: "gallery", maxItems: 20 },
  { key: "description", label: "Blessing message", type: "textarea", placeholder: "Divine blessings text" },
  { key: "remarks1", label: "Hosts", type: "textarea", placeholder: "Host names on first line, place on second line" },
  { key: "remarks2", label: "Family members", type: "textarea", placeholder: "One paragraph per line" },
  { key: "logoImage", label: "Host photo 1", type: "image", hint: "Any size · JPEG/PNG/WebP" },
  { key: "customImage", label: "Host photo 2", type: "image", hint: "Any size · JPEG/PNG/WebP" },
];

export const LIVE_EVENT_FIELDS: ThemeFieldDef[] = [
  { key: "pageTitle", label: "Page headline", type: "text", placeholder: "Live event title" },
  { key: "eventDate", label: "Event date", type: "date" },
  { key: "eventTime", label: "Event time", type: "time" },
  { key: "eventPlace", label: "Venue", type: "text", placeholder: "City or venue" },
  { key: "coverImage", label: "Cover image", type: "image", hint: "Any size · JPEG/PNG/WebP" },
  { key: "scrollMessage", label: "Ticker message", type: "textarea", placeholder: "Welcome message" },
  { key: "galleryImages", label: "Gallery images", type: "gallery", maxItems: 10 },
  { key: "logoImage", label: "Logo", type: "image", hint: "Max 500KB · JPEG/PNG" },
  { key: "customImage", label: "Custom image", type: "image", hint: "Height 800px · under 500KB" },
];

/** Showcase live-stream cards: the cover image is the framed photo. */
export const SHOWCASE_FIELDS: ThemeFieldDef[] = [
  { key: "pageTitle", label: "Names / title (shown above LIVE STREAM)", type: "text", placeholder: "Ravi weds Rani" },
  { key: "eventDate", label: "Event date", type: "date" },
  { key: "eventTime", label: "Event time", type: "time" },
  { key: "eventPlace", label: "Venue", type: "text", placeholder: "City or venue" },
  { key: "coverImage", label: "Main photo (shown in the frame)", type: "image", hint: "Couple / host photo · JPEG/PNG/WebP" },
  { key: "customImage", label: "Player poster", type: "image", hint: "Shown on the player before it starts" },
  { key: "remarks1", label: "Thank-you message", type: "textarea", placeholder: "Thank you for being a part of our special day." },
  { key: "scrollMessage", label: "Ticker message", type: "textarea", placeholder: "Welcome message" },
  { key: "galleryImages", label: "Gallery images", type: "gallery", maxItems: 12 },
  { key: "logoImage", label: "Logo", type: "image", hint: "JPEG/PNG" },
];

/** Appended to theme content for live events (wizard + event detail). */
export const LIVE_YOUTUBE_FIELDS: ThemeFieldDef[] = [
  {
    key: "youtubeLiveUrl",
    label: "Live stream URL",
    type: "text",
    placeholder: "https://youtube.com/live/_eZppUQh9kU",
  },
  { key: "youtubeLiveKey", label: "YouTube live key", type: "streamKey", placeholder: "rt56-t6dt-1kga-kc8a-bkf7" },
  {
    key: "teaserUrl",
    label: "Teaser video URL",
    type: "text",
    placeholder: "https://youtu.be/LsVQ3F3LCcE",
  },
];

const DEFAULT_SECTIONS: ThemeSections = {
  showCountdown: true,
  showGallery: true,
  showSubEvents: true,
  showLivePlayer: true,
  showInvitationCard: true,
  showCouplePhotos: true,
};

const LIVE_SECTIONS: ThemeSections = {
  showCountdown: true,
  showGallery: true,
  showSubEvents: false,
  showLivePlayer: true,
  showInvitationCard: false,
  showCouplePhotos: false,
};

const LAYOUT_FIELDS: Record<string, ThemeFieldDef[]> = {
  "wedding-theme-traditional": WEDDING_FIELDS,
  traditional: WEDDING_FIELDS.filter((f) => f.key !== "invitationCard"),
  floral: WEDDING_FIELDS,
  "the-sacred-garden": WEDDING_FIELDS,
  cinematic: LIVE_EVENT_FIELDS,
  classic: LIVE_EVENT_FIELDS,
  "traditional-streaming": LIVE_EVENT_FIELDS,
  "event-banner": LIVE_EVENT_FIELDS,
  showcase: SHOWCASE_FIELDS,
};

const LAYOUT_SECTIONS: Record<string, ThemeSections> = {
  "wedding-theme-traditional": DEFAULT_SECTIONS,
  traditional: { ...DEFAULT_SECTIONS, showInvitationCard: false },
  floral: DEFAULT_SECTIONS,
  "the-sacred-garden": DEFAULT_SECTIONS,
  cinematic: LIVE_SECTIONS,
  classic: LIVE_SECTIONS,
  "traditional-streaming": LIVE_SECTIONS,
  "event-banner": LIVE_SECTIONS,
  showcase: LIVE_SECTIONS,
};

export function resolveThemeFields(theme?: {
  config?: { layout?: string; fields?: unknown[] };
  layout?: string;
} | null): ThemeFieldDef[] {
  const config = theme?.config;
  const layout = config?.layout || theme?.layout || "wedding-theme-traditional";
  const raw = (config?.fields?.length ? config.fields : LAYOUT_FIELDS[layout] ?? WEDDING_FIELDS) as ThemeFieldDef[];
  // Drop legacy size caps from theme DB configs (e.g. maxBytes / "Max 2MB" hints).
  return raw.map((field) => {
    const next = { ...field } as ThemeFieldDef & { maxBytes?: number; maxWidth?: number; maxHeight?: number };
    delete next.maxBytes;
    delete next.maxWidth;
    delete next.maxHeight;
    if (typeof next.hint === "string") {
      const cleaned = next.hint
        .replace(/\bmax\s*\d+(\.\d+)?\s*(mb|kb|bytes?)\b/gi, "")
        .replace(/\bmax\s*(width|height|dimension)s?\b[^·|]*/gi, "")
        .replace(/\s*[·|]\s*[·|]\s*/g, " · ")
        .replace(/^\s*[·|]\s*|\s*[·|]\s*$/g, "")
        .replace(/\s{2,}/g, " ")
        .trim();
      next.hint = cleaned || (field.type === "image" ? "Any size · JPEG/PNG/WebP" : undefined);
    } else if (field.type === "image" && !next.hint) {
      next.hint = "Any size · JPEG/PNG/WebP";
    }
    return next;
  });
}

/** Theme content fields for the wizard / editor — includes YouTube fields for live events. */
export function resolveWizardThemeFields(
  theme?: { config?: { layout?: string; fields?: unknown[] }; layout?: string } | null,
  kind: "live" | "invitation" = "invitation"
): ThemeFieldDef[] {
  const fields = resolveThemeFields(theme);
  if (kind !== "live") return fields;
  const keys = new Set(fields.map((f) => f.key));
  const youtubeFields = LIVE_YOUTUBE_FIELDS.filter((f) => !keys.has(f.key));
  if (!youtubeFields.length) return fields;
  return [...fields, ...youtubeFields];
}

export function resolveThemeSections(theme?: {
  config?: { layout?: string; sections?: Partial<ThemeSections> };
  layout?: string;
} | null): ThemeSections {
  const config = theme?.config;
  const layout = config?.layout || theme?.layout || "wedding-theme-traditional";
  const base = LAYOUT_SECTIONS[layout] ?? DEFAULT_SECTIONS;
  return { ...base, ...(config?.sections ?? {}) };
}

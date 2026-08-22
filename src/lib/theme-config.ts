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
  maxBytes?: number;
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
  { key: "brideImage", label: "Bride image", type: "image", hint: "Max 2MB", maxBytes: 2 * 1024 * 1024 },
  { key: "groomImage", label: "Groom image", type: "image", hint: "Max 2MB", maxBytes: 2 * 1024 * 1024 },
  { key: "eventDate", label: "Event date", type: "date" },
  { key: "eventTime", label: "Event time", type: "time" },
  { key: "eventPlace", label: "Event place", type: "text", placeholder: "Venue name, city" },
  { key: "subEvents", label: "Sub events", type: "subEvents" },
  {
    key: "invitationCard",
    label: "Invitation card",
    type: "image",
    hint: "Full invitation image · max 4MB",
    maxBytes: 4 * 1024 * 1024,
  },
  { key: "galleryImages", label: "Gallery images", type: "gallery", maxItems: 20 },
  { key: "description", label: "Blessing message", type: "textarea", placeholder: "Divine blessings text" },
  { key: "remarks1", label: "Hosts", type: "textarea", placeholder: "Host names on first line, place on second line" },
  { key: "remarks2", label: "Family members", type: "textarea", placeholder: "One paragraph per line" },
  { key: "logoImage", label: "Host photo 1", type: "image", hint: "Max 2MB", maxBytes: 2 * 1024 * 1024 },
  { key: "customImage", label: "Host photo 2", type: "image", hint: "Max 2MB", maxBytes: 2 * 1024 * 1024 },
];

export const LIVE_EVENT_FIELDS: ThemeFieldDef[] = [
  { key: "pageTitle", label: "Page headline", type: "text", placeholder: "Live event title" },
  { key: "eventDate", label: "Event date", type: "date" },
  { key: "eventTime", label: "Event time", type: "time" },
  { key: "eventPlace", label: "Venue", type: "text", placeholder: "City or venue" },
  { key: "coverImage", label: "Cover image", type: "image", hint: "Max 4MB", maxBytes: 4 * 1024 * 1024 },
  { key: "scrollMessage", label: "Ticker message", type: "textarea", placeholder: "Welcome message" },
  { key: "galleryImages", label: "Gallery images", type: "gallery", maxItems: 12 },
];

/** Appended to theme content for live events (wizard + event detail). */
export const LIVE_YOUTUBE_FIELDS: ThemeFieldDef[] = [
  {
    key: "youtubeLiveUrl",
    label: "Live stream URL",
    type: "text",
    placeholder: "https://youtube.com/live/…",
  },
  { key: "youtubeLiveKey", label: "Stream key", type: "streamKey" },
  {
    key: "teaserUrl",
    label: "Teaser video URL",
    type: "text",
    placeholder: "https://youtube.com/watch?v=…",
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
};

const LAYOUT_SECTIONS: Record<string, ThemeSections> = {
  "wedding-theme-traditional": DEFAULT_SECTIONS,
  traditional: { ...DEFAULT_SECTIONS, showInvitationCard: false },
  floral: DEFAULT_SECTIONS,
  "the-sacred-garden": DEFAULT_SECTIONS,
  cinematic: LIVE_SECTIONS,
  classic: LIVE_SECTIONS,
  "traditional-streaming": LIVE_SECTIONS,
};

export function resolveThemeFields(theme?: {
  config?: { layout?: string; fields?: unknown[] };
  layout?: string;
} | null): ThemeFieldDef[] {
  const config = theme?.config;
  if (config?.fields?.length) return config.fields as ThemeFieldDef[];
  const layout = config?.layout || theme?.layout || "wedding-theme-traditional";
  return LAYOUT_FIELDS[layout] ?? WEDDING_FIELDS;
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

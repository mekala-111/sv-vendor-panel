import { normalizeTimeForInput } from "@/lib/time-input";

export type CustomerDraftKind = "invitation" | "event";

export type CustomerWizardQuery = {
  fromCustomer?: boolean;
  customerId?: string;
  sourceDraftId?: string;
  sourceDraftKind?: CustomerDraftKind;
};

const THEME_CONTENT_KEYS = [
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
  "galleryImages",
  "subEvents",
  "showSubEvents",
  "showInvitationCard",
] as const;

function isFilledValue(value: unknown): boolean {
  if (value == null || value === "") return false;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

/** Map live-event step-1 fields (location, liveTiming) onto theme content keys. */
export function normalizeThemeContentRaw(raw: Record<string, unknown>): Record<string, unknown> {
  const next = { ...raw };
  const themeConfig =
    raw.themeConfig && typeof raw.themeConfig === "object"
      ? (raw.themeConfig as Record<string, unknown>)
      : null;

  if (!isFilledValue(next.themeId) && isFilledValue(themeConfig?.themeId)) {
    next.themeId = themeConfig!.themeId;
  }
  if (!isFilledValue(next.eventPlace) && isFilledValue(next.location)) {
    next.eventPlace = next.location;
  }
  if (!isFilledValue(next.eventTime) && isFilledValue(next.liveTiming)) {
    next.eventTime = normalizeTimeForInput(String(next.liveTiming));
  }
  if (!isFilledValue(next.location) && isFilledValue(next.eventPlace)) {
    next.location = next.eventPlace;
  }
  if (!isFilledValue(next.pageTitle) && isFilledValue(next.eventName)) {
    next.pageTitle = next.eventName;
  }
  return next;
}

/** Overlay only non-empty values so API `null` fields do not wipe draft content. */
export function overlayFilledRecordFields(
  base: Record<string, unknown>,
  overlay: Record<string, unknown>
): Record<string, unknown> {
  const merged = { ...base };
  for (const [key, value] of Object.entries(overlay)) {
    if (!isFilledValue(value)) continue;
    merged[key] = value;
  }
  return merged;
}

export function mergeCustomerDraftForThemeContent(
  draftRaw: Record<string, unknown>,
  eventRaw: Record<string, unknown>
): Record<string, unknown> {
  const draft = normalizeThemeContentRaw(draftRaw);
  const event = normalizeThemeContentRaw(eventRaw);
  const merged = overlayFilledRecordFields(draft, event);
  merged.themeConfig = event.themeConfig ?? draft.themeConfig;
  merged.themeId =
    event.themeId ??
    draft.themeId ??
    (merged.themeConfig as { themeId?: string } | undefined)?.themeId;
  merged.eventName =
    event.eventName ?? draft.eventName ?? draft.invitationName ?? merged.eventName;
  return normalizeThemeContentRaw(merged);
}

export function recordHasThemeContent(raw: Record<string, unknown>): boolean {
  const normalized = normalizeThemeContentRaw(raw);
  return THEME_CONTENT_KEYS.some((key) => {
    if (key === "showSubEvents" || key === "showInvitationCard") return false;
    return isFilledValue(normalized[key]);
  });
}

export function parseCustomerWizardQuery(
  sp: Record<string, string | string[] | undefined>
): CustomerWizardQuery {
  const fromCustomerRaw = Array.isArray(sp.fromCustomer) ? sp.fromCustomer[0] : sp.fromCustomer;
  const customerId = Array.isArray(sp.customerId) ? sp.customerId[0] : sp.customerId;
  const sourceDraftId = Array.isArray(sp.sourceDraftId) ? sp.sourceDraftId[0] : sp.sourceDraftId;
  const kindRaw = Array.isArray(sp.sourceDraftKind) ? sp.sourceDraftKind[0] : sp.sourceDraftKind;
  return {
    fromCustomer: fromCustomerRaw === "1",
    customerId: customerId?.trim() || undefined,
    sourceDraftId: sourceDraftId?.trim() || undefined,
    sourceDraftKind: kindRaw === "event" ? "event" : "invitation",
  };
}

export function customerWizardSearchParams(query: CustomerWizardQuery): Record<string, string> {
  const params: Record<string, string> = {};
  if (query.fromCustomer) params.fromCustomer = "1";
  if (query.customerId) params.customerId = query.customerId;
  if (query.sourceDraftId) params.sourceDraftId = query.sourceDraftId;
  if (query.sourceDraftKind) params.sourceDraftKind = query.sourceDraftKind;
  return params;
}

export function buildCustomerLiveEventHref(
  customerId: string,
  sourceDraftId: string,
  sourceDraftKind: CustomerDraftKind
) {
  const params = new URLSearchParams({
    step: "1",
    fromCustomer: "1",
    customerId,
    sourceDraftId,
    sourceDraftKind,
  });
  return `/vendor/events/new?${params.toString()}`;
}

export function draftToLiveEventStep1(
  raw: Record<string, unknown>,
  customerId?: string
): {
  eventName: string;
  eventType: string;
  eventDate: string;
  pageTitle: string;
  location: string;
  liveTiming: string;
  coverImage: string;
  customerId?: string;
} {
  const eventName = String(raw.invitationName ?? raw.eventName ?? "").trim();
  const bride = raw.brideName ? String(raw.brideName).trim() : "";
  const groom = raw.groomName ? String(raw.groomName).trim() : "";
  const pageTitle = String(raw.pageTitle ?? "").trim() || (bride && groom ? `${bride} Weds ${groom}` : eventName);

  return {
    eventName,
    eventType: String(raw.eventType ?? "Wedding"),
    eventDate: raw.eventDate ? new Date(String(raw.eventDate)).toISOString().slice(0, 10) : "",
    pageTitle,
    location: String(raw.eventPlace ?? raw.location ?? "").trim(),
    liveTiming: normalizeTimeForInput(String(raw.eventTime ?? raw.liveTiming ?? "")),
    coverImage: String(raw.coverImage ?? raw.customImage ?? raw.logoImage ?? "").trim(),
    customerId: customerId ?? (raw.customerId ? String(raw.customerId) : undefined),
  };
}

export function themeContentFromRecord(raw: Record<string, unknown>): Record<string, unknown> {
  const normalized = normalizeThemeContentRaw(raw);
  const themeConfig =
    normalized.themeConfig && typeof normalized.themeConfig === "object"
      ? (normalized.themeConfig as Record<string, unknown>)
      : null;
  const customConfig =
    themeConfig?.customConfig && typeof themeConfig.customConfig === "object"
      ? (themeConfig.customConfig as Record<string, unknown>)
      : {};

  const payload: Record<string, unknown> = { showWatchLive: true };
  for (const key of THEME_CONTENT_KEYS) {
    const value = normalized[key];
    if (!isFilledValue(value)) continue;
    payload[key] = value;
  }
  if (payload.eventPlace) payload.location = payload.eventPlace;
  if (!Object.prototype.hasOwnProperty.call(payload, "showSubEvents")) {
    if (customConfig.showSubEvents === false || customConfig.showSubEvents === true) {
      payload.showSubEvents = customConfig.showSubEvents;
    } else {
      payload.showSubEvents = normalized.showSubEvents !== false;
    }
  }
  if (!Object.prototype.hasOwnProperty.call(payload, "showInvitationCard")) {
    if (customConfig.showInvitationCard === false || customConfig.showInvitationCard === true) {
      payload.showInvitationCard = customConfig.showInvitationCard;
    } else {
      payload.showInvitationCard = normalized.showInvitationCard !== false;
    }
  }
  return payload;
}

export function liveWizardStepAfterDetails(fromCustomer: boolean): string {
  return fromCustomer ? "3" : "2";
}

export function shouldSkipLiveThemeStep(step: number, fromCustomer: boolean): boolean {
  return fromCustomer && step === 2;
}

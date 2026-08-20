/**
 * Event data fetchers for the vendor panel.
 * Called on the server (Server Components) to avoid exposing API calls to the client.
 */

import { api, ApiError } from "@/lib/api";

export type EventStatus = "DRAFT" | "UPCOMING" | "LIVE" | "COMPLETED" | "CANCELLED" | "EXPIRED";

export interface Event {
  id: string;
  vendorId: string;
  customerId: string | null;
  eventCode: string;
  eventSlug: string;
  eventName: string;
  eventType: string | null;
  description: string | null;
  eventDate: string | null;
  startTime: string | null;
  endTime: string | null;
  timezone: string;
  location: string | null;
  coverImage: string | null;
  pageTitle: string | null;
  liveTiming: string | null;
  status: EventStatus;
  themeId: string | null;
  youtubeChannelId: string | null;
  youtubeVideoId: string | null;
  youtubeLiveUrl: string | null;
  isPublic: boolean;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EventThemeConfig {
  id: string;
  eventId: string;
  themeId: string;
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
  logo: string | null;
  coverImage: string | null;
  pageTitle: string | null;
  description: string | null;
  liveTiming: string | null;
  customConfig: Record<string, unknown> | null;
}

export interface EventAccess {
  id: string;
  eventId: string;
  accessType: "PUBLIC" | "PRIVATE";
  isEnabled: boolean;
}

export interface YoutubeStream {
  id: string;
  eventId: string;
  youtubeChannelId: string;
  youtubeVideoId: string | null;
  youtubeLiveUrl: string | null;
  status: "CONNECTED" | "SCHEDULED" | "LIVE" | "ENDED" | "ERROR";
  scheduledAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
}

export interface EventDetail extends Event {
  themeConfig: EventThemeConfig | null;
  media: unknown[];
  access: EventAccess | null;
  youtubeStreams: YoutubeStream[];
}

export interface EventListResult {
  items: Event[];
  page: number;
  totalPages: number;
  total: number;
}

export async function fetchEvents(params: {
  page?: number;
  status?: EventStatus | "";
  customerId?: string;
}): Promise<EventListResult> {
  const { page = 1, status, customerId } = params;
  const query: Record<string, string | number> = { page, limit: 20 };
  if (status) query.status = status;
  if (customerId) query.customerId = customerId;

  const { items, meta } = await api.getList<Event>("/events", { params: query });
  return { items, page: meta.page, totalPages: meta.totalPages, total: meta.total };
}

/** Returns null when the event doesn't exist or isn't owned by this vendor. */
export async function fetchEventDetail(id: string): Promise<EventDetail | null> {
  try {
    return await api.get<EventDetail>(`/events/${id}`);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 403)) {
      return null;
    }
    throw error;
  }
}

export interface ShareInfo {
  publicUrl: string;
  qrCodeDataUrl: string;
  whatsappShareUrl: string | null;
  whatsappSupportNumber: string | null;
}

export async function fetchShareInfo(eventSlug: string): Promise<ShareInfo | null> {
  try {
    return await api.get<ShareInfo>(`/public/events/${eventSlug}/share`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

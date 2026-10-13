import crypto from "crypto";
import { apiFetch, formatINR, mapEventStatus, fmtDate } from "./api";
import type { Customer, EventRecord, StatusTone } from "./data";
import { TONES, statusTone } from "./data";

export { statusTone, TONES };
export type { StatusTone };

type BackendEvent = {
  id: string;
  eventName: string;
  eventDate?: string | null;
  startTime?: string | null;
  location?: string | null;
  customerId?: string | null;
  status: string;
  themeId?: string | null;
  showWatchLive?: boolean | null;
  isPublished?: boolean;
};

type BackendPayment = {
  id: string;
  amount: number;
  status: string;
  createdAt?: string;
  customerId?: string | null;
  eventId?: string | null;
  purpose?: string | null;
  utrNumber?: string | null;
  paymentImage?: string | null;
  rejectionReason?: string | null;
  gatewayTransactionId?: string | null;
  gateway?: string | null;
};

export async function fetchDashboard() {
  try {
    const { data } = await apiFetch<{
      totalCustomers?: number;
      totalEvents?: number;
      liveEvents?: number;
      upcomingEvents?: number;
      completedEvents?: number;
      monthlyRevenue?: number;
      companyName?: string;
    }>("/vendors/me/dashboard");
    return data;
  } catch {
    return null;
  }
}

export async function fetchVendorProfile() {
  try {
    const { data } = await apiFetch<{
      id: string;
      companyName: string;
      email?: string | null;
      phone?: string | null;
      address?: string | null;
      whatsappNumber?: string | null;
      whatsappEnabled?: boolean;
      eventCreationFee?: number;
      liveEventCreationFee?: number;
      invitationCreationFee?: number;
      branding?: Record<string, unknown>;
      wallet?: { balance?: number; currency?: string } | null;
    }>("/vendors/me");
    return data;
  } catch {
    return null;
  }
}

export async function fetchEventCreationPaymentConfigAction(opts?: {
  eventId?: string;
  invitationId?: string;
}) {
  const params = new URLSearchParams();
  if (opts?.eventId) params.set("eventId", opts.eventId);
  if (opts?.invitationId) params.set("invitationId", opts.invitationId);
  const query = params.toString() ? `?${params.toString()}` : "";
  const { data } = await apiFetch<{
    amount: number;
    currency: string;
    free: boolean;
    payeeName: string;
    qrImage: string;
    instructions: string;
  }>(`/payments/event-creation/config${query}`);
  return data;
}

export async function submitEventCreationPaymentAction(payload: {
  eventId?: string;
  invitationId?: string;
  utrNumber: string;
  paymentImage: string;
}) {
  const { data } = await apiFetch<{
    free?: boolean;
    paid?: boolean;
    pending?: boolean;
    published?: boolean;
    paymentId?: string | null;
    message?: string;
    publicUrl?: string;
  }>("/payments/event-creation/submit", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data;
}

export async function discardDraftEventAction(eventId: string) {
  const { data } = await apiFetch<{ id: string; status: string }>(`/events/${eventId}`, {
    method: "DELETE",
  });
  return data;
}

export async function fetchCustomers(): Promise<Customer[]> {
  try {
    const { data } = await apiFetch<
      Array<{
        id: string;
        name: string;
        email?: string | null;
        status: string;
        createdAt?: string;
        eventsCount?: number;
        contentStatus?: Customer["contentStatus"];
        contentFillUrl?: string | null;
        draftInvitationId?: string | null;
        draftInvitationName?: string | null;
        contentFilledAt?: string | null;
      }>
    >("/customers");
    return (data ?? []).map((c, i) => ({
      id: i + 1,
      name: c.name,
      email: c.email ?? "",
      events: c.eventsCount ?? 0,
      spend: "₹0",
      status: c.status === "ACTIVE" ? "Active" : "Inactive",
      joined: fmtDate(c.createdAt),
      eventsList: [],
      paymentsList: [],
      activity: [],
      _id: c.id,
      contentStatus: c.contentStatus ?? "NONE",
      contentFillUrl: c.contentFillUrl ?? null,
      draftInvitationId: c.draftInvitationId ?? null,
      draftInvitationName: c.draftInvitationName ?? null,
      contentFilledAt: c.contentFilledAt ?? null,
    })) as Customer[];
  } catch {
    return [];
  }
}

export async function fetchCustomer(id: string): Promise<(Customer & { _id?: string; draftInvitation?: Record<string, unknown> | null }) | null> {
  try {
    const { data } = await apiFetch<{
      id: string;
      name: string;
      email?: string | null;
      status: string;
      createdAt?: string;
      draftInvitation?: {
        id: string;
        invitationName?: string;
        contentFillUrl?: string | null;
        contentFilledAt?: string | null;
        contentFilledBy?: string | null;
        themeId?: string | null;
        themeConfig?: { themeId?: string } | null;
        brideName?: string | null;
        groomName?: string | null;
        eventDate?: string | null;
        eventPlace?: string | null;
      } | null;
      eventsCount?: number;
      events?: {
        id: string;
        eventName?: string;
        eventDate?: string | null;
        status?: string | null;
        eventSlug?: string | null;
      }[];
    }>(`/customers/${id}`);
    const draft = data.draftInvitation;
    const eventsList = (data.events ?? []).map((event) => {
      const date = event.eventDate ? new Date(event.eventDate) : null;
      return {
        _id: event.id,
        name: event.eventName ?? "Live event",
        date: date
          ? date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
          : "—",
      };
    });
    return {
      id: 0,
      name: data.name,
      email: data.email ?? "",
      events: data.eventsCount ?? eventsList.length,
      spend: "₹0",
      status: data.status === "ACTIVE" ? "Active" : "Inactive",
      joined: fmtDate(data.createdAt),
      eventsList,
      paymentsList: [],
      activity: [],
      _id: data.id,
      contentStatus: draft?.contentFilledAt
        ? "SUBMITTED"
        : draft?.themeId
          ? "AWAITING_CONTENT"
          : draft
            ? "THEME_PENDING"
            : "NONE",
      contentFillUrl: draft?.contentFillUrl ?? null,
      draftInvitationId: draft?.id ?? null,
      draftInvitationName: draft?.invitationName ?? null,
      contentFilledAt: draft?.contentFilledAt ?? null,
      draftInvitation: draft ?? null,
    };
  } catch {
    return null;
  }
}

export async function fetchEvents(): Promise<(EventRecord & { _id?: string })[]> {
  try {
    const { data } = await apiFetch<BackendEvent[]>("/events");
    return (data ?? []).map((e, i) => {
      const date = e.eventDate ? new Date(e.eventDate) : null;
      return {
        id: i + 1,
        name: e.eventName,
        date: date
          ? date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
          : "—",
        time: e.startTime
          ? new Date(e.startTime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
          : "—",
        location: e.location ?? "—",
        customer: e.customerId ?? "—",
        status: mapEventStatus(e.status),
        viewers: "—",
        revenue: "₹0",
        _id: e.id,
        themeId: e.themeId ?? null,
        showWatchLive: e.showWatchLive,
        isPublished: e.isPublished === true,
      };
    });
  } catch {
    return [];
  }
}

type BackendInvitation = {
  id: string;
  invitationName: string;
  invitationDate?: string | null;
  eventDate?: string | null;
  startTime?: string | null;
  location?: string | null;
  customerId?: string | null;
  status: string;
  themeId?: string | null;
  isPublished?: boolean;
  invitationSlug?: string;
  invitationCode?: string;
};

export async function fetchInvitations(): Promise<(EventRecord & { _id?: string })[]> {
  try {
    const { data } = await apiFetch<BackendInvitation[]>("/invitations");
    return (data ?? []).map((e, i) => {
      const date = e.eventDate ? new Date(e.eventDate) : null;
      return {
        id: i + 1,
        name: e.invitationName,
        date: date
          ? date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
          : "—",
        time: e.startTime
          ? new Date(e.startTime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
          : "—",
        location: e.location ?? "—",
        customer: e.customerId ?? "—",
        status: mapEventStatus(e.status),
        viewers: "—",
        revenue: "₹0",
        _id: e.id,
        themeId: e.themeId ?? null,
        isPublished: e.isPublished === true,
      };
    });
  } catch {
    return [];
  }
}

export async function fetchInvitation(id: string) {
  try {
    const { data } = await apiFetch<
      BackendInvitation & {
        themeConfig?: {
          id?: string;
          themeId?: string;
          primaryColor?: string | null;
          secondaryColor?: string | null;
          accentColor?: string | null;
          pageTitle?: string | null;
        } | null;
        media?: { id: string; url?: string; type?: string }[];
        access?: {
          id?: string;
          accessType?: "PUBLIC" | "PRIVATE";
          isEnabled?: boolean;
        } | null;
        description?: string | null;
        eventType?: string | null;
        pageTitle?: string | null;
        coverImage?: string | null;
        themeId?: string | null;
        isPublic?: boolean;
        brideName?: string | null;
        groomName?: string | null;
        invitationCard?: string | null;
        whatsappImage?: string | null;
        subEvents?: unknown[];
        galleryImages?: string[];
      }
    >(`/invitations/${id}`);
    const date = data.eventDate ? new Date(data.eventDate) : null;
    const normalizedRaw = {
      ...data,
      eventName: data.invitationName,
      eventSlug: data.invitationSlug,
      eventCode: data.invitationCode,
    };
    return {
      id: 0,
      name: data.invitationName,
      date: date
        ? date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : "—",
      time: data.startTime
        ? new Date(data.startTime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
        : "—",
      location: data.location ?? "—",
      customer: data.customerId ?? "—",
      status: mapEventStatus(data.status),
      viewers: "—",
      revenue: "₹0",
      _id: data.id,
      raw: normalizedRaw,
    };
  } catch {
    return null;
  }
}

export async function fetchEvent(id: string) {
  try {
    const { data } = await apiFetch<
      BackendEvent & {
        themeConfig?: {
          id?: string;
          themeId?: string;
          primaryColor?: string | null;
          secondaryColor?: string | null;
          accentColor?: string | null;
          pageTitle?: string | null;
        } | null;
        media?: { id: string; url?: string; type?: string }[];
        access?: {
          id?: string;
          accessType?: "PUBLIC" | "PRIVATE";
          isEnabled?: boolean;
        } | null;
        youtubeStreams?: {
          id: string;
          status?: string;
          youtubeLiveUrl?: string | null;
          youtubeLiveKey?: string | null;
          youtubeVideoId?: string | null;
          youtubeChannelId?: string | null;
        }[];
        description?: string | null;
        eventSlug?: string;
        eventCode?: string;
        eventType?: string | null;
        pageTitle?: string | null;
        coverImage?: string | null;
        liveTiming?: string | null;
        themeId?: string | null;
        isPublished?: boolean;
        isPublic?: boolean;
        youtubeLiveUrl?: string | null;
        youtubeChannelId?: string | null;
        teaserUrl?: string | null;
      }
    >(`/events/${id}`);
    const date = data.eventDate ? new Date(data.eventDate) : null;
    return {
      id: 0,
      name: data.eventName,
      date: date
        ? date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : "—",
      time: data.startTime
        ? new Date(data.startTime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
        : "—",
      location: data.location ?? "—",
      customer: data.customerId ?? "—",
      status: mapEventStatus(data.status),
      viewers: "—",
      revenue: "₹0",
      _id: data.id,
      raw: data,
    };
  } catch {
    return null;
  }
}

export async function fetchEventRecording(eventId: string) {
  try {
    const { data } = await apiFetch<{
      id: string;
      status?: string;
      fileUrl?: string | null;
      durationSec?: number | null;
      createdAt?: string;
    }>(`/events/${eventId}/recording`);
    return data;
  } catch {
    return null;
  }
}

export async function fetchThemes() {
  type ThemeRow = {
    id: string;
    name: string;
    slug: string;
    status?: string;
    previewImage?: string | null;
    config?: {
      colors?: { primary?: string; secondary?: string; accent?: string };
      layout?: string;
      fields?: unknown[];
      sections?: Record<string, boolean>;
      eventTypes?: string[];
    };
  };

  const mapTheme = (t: ThemeRow) => {
    const colors = t.config?.colors ?? {};
    return {
      slug: t.slug || t.id,
      name: t.name || "Theme",
      previewImage: t.previewImage ?? null,
      config: t.config,
      stripe1: colors.secondary || "#F3D9C0",
      stripe2: colors.accent || colors.secondary || "#EAC29A",
      primary: colors.primary || "#C77B3E",
      secondary: colors.secondary || "#F3D9C0",
      accent: colors.accent || "#8A5A2E",
      layout: t.config?.layout || t.slug || "cinematic",
      _id: t.id,
    };
  };

  try {
    const { data: assigned } = await apiFetch<{ theme?: ThemeRow & { id?: string } }[]>(
      "/themes/vendor-assigned"
    );
    const fromAssigned = (assigned ?? [])
      .map((row) => {
        const th = row.theme;
        if (!th) return null;
        return { ...th, id: th.id ?? (th as ThemeRow).id };
      })
      .filter(Boolean) as ThemeRow[];
    return fromAssigned.map(mapTheme);
  } catch {
    return [];
  }
}

export async function createEventPreviewToken(eventId: string) {
  const { data } = await apiFetch<{ token: string; publicUrl: string; expiresInSeconds: number }>(
    `/events/${eventId}/preview-token`,
    { method: "POST", body: JSON.stringify({}) }
  );
  return data;
}

export async function createInvitationPreviewToken(invitationId: string) {
  const { data } = await apiFetch<{ token: string; publicUrl: string; expiresInSeconds: number }>(
    `/invitations/${invitationId}/preview-token`,
    { method: "POST", body: JSON.stringify({}) }
  );
  return data;
}

export async function ensureContentFillTokenAction(
  recordId: string,
  recordKind: CustomerContentRecordKind
): Promise<{ contentFillToken?: string; contentFillUrl?: string } | null> {
  async function requestToken(kind: CustomerContentRecordKind) {
    const path =
      kind === "event"
        ? `/events/${recordId}/content-fill-token`
        : `/invitations/${recordId}/content-fill-token`;
    const { data } = await apiFetch<{ contentFillToken: string; contentFillUrl: string }>(path, {
      method: "POST",
      body: JSON.stringify({}),
    });
    return data;
  }

  try {
    return await requestToken(recordKind);
  } catch (err) {
    if (apiRouteUnavailable(err, "content-fill-token")) return null;
    const msg = err instanceof Error ? err.message.toLowerCase() : "";
    if (/not found/.test(msg)) {
      const altKind: CustomerContentRecordKind = recordKind === "event" ? "invitation" : "event";
      try {
        return await requestToken(altKind);
      } catch (err2) {
        if (apiRouteUnavailable(err2, "content-fill-token")) return null;
        throw err2;
      }
    }
    throw err;
  }
}

export async function fetchWallet() {
  try {
    const [{ data: wallet }, { data: tx }] = await Promise.all([
      apiFetch<{ balance: number; currency: string }>("/wallet"),
      apiFetch<{ type: string; amount: number; description?: string | null; createdAt?: string }[]>(
        "/wallet/transactions"
      ),
    ]);
    return {
      balance: formatINR(wallet.balance),
      transactions: (tx ?? []).map((t) => ({
        desc: t.description || t.type,
        type: t.type === "CREDIT" || t.type === "REFUND" ? "Credit" : "Debit",
        amount: `${t.type === "DEBIT" ? "-" : "+"}${formatINR(t.amount)}`,
        date: fmtDate(t.createdAt),
      })),
    };
  } catch {
    return { balance: "₹0.00", transactions: [] };
  }
}

export async function fetchEventCreationPayment(entityId: string, kind: "live" | "invitation" = "live") {
  try {
    const param =
      kind === "invitation"
        ? `invitationId=${encodeURIComponent(entityId)}`
        : `eventId=${encodeURIComponent(entityId)}`;
    const { data } = await apiFetch<BackendPayment[]>(`/payments?purpose=EVENT_CREATION&${param}`);
    const list = data ?? [];
    if (!list.length) return null;
    const p = list[0];
    return {
      id: p.id,
      amount: Number(p.amount ?? 0),
      status: p.status,
      utrNumber: p.utrNumber || p.gatewayTransactionId || "",
      paymentImage: p.paymentImage || "",
      rejectionReason: p.rejectionReason || "",
      date: fmtDate(p.createdAt),
    };
  } catch {
    return null;
  }
}

export async function fetchPayments() {
  try {
    const { data } = await apiFetch<BackendPayment[]>("/payments");
    const list = data ?? [];
    const success = list.filter((p) => p.status === "SUCCESS").reduce((s, p) => s + Number(p.amount), 0);
    const pending = list.filter((p) => p.status === "PENDING").reduce((s, p) => s + Number(p.amount), 0);
    const failed = list.filter((p) => p.status === "FAILED").reduce((s, p) => s + Number(p.amount), 0);
    const refunds = list.filter((p) => p.status === "REFUNDED").reduce((s, p) => s + Number(p.amount), 0);
    return {
      stats: [
        { label: "Successful", value: formatINR(success), color: "#1E9E5A" },
        { label: "Pending", value: formatINR(pending), color: "#E0A324" },
        { label: "Rejected", value: formatINR(failed), color: "#E4362B" },
        { label: "Refunds", value: formatINR(refunds), color: "#9A9088" },
      ],
      payments: list.map((p) => ({
        id: p.id,
        customer: p.purpose === "EVENT_CREATION" ? "Event fee" : p.customerId ?? "—",
        event: p.eventId ?? "—",
        amount: formatINR(p.amount),
        utrNumber: p.utrNumber || p.gatewayTransactionId || "—",
        rejectionReason: p.rejectionReason || "",
        purpose: p.purpose || "CUSTOMER",
        status:
          p.status === "SUCCESS"
            ? "Success"
            : p.status === "REFUNDED"
              ? "Refunded"
              : p.status === "FAILED"
                ? "Rejected"
                : "Pending",
        date: fmtDate(p.createdAt),
      })),
    };
  } catch {
    return { stats: [], payments: [] };
  }
}

export async function fetchPricing() {
  try {
    const { data } = await apiFetch<{ items?: { name: string; price: number }[] }>("/vendor/pricing");
    return (data?.items ?? []).map((i) => ({ name: i.name, price: formatINR(i.price) }));
  } catch {
    return [];
  }
}

export async function fetchTickets() {
  try {
    const { data } = await apiFetch<
      { id: string; ticketCode: string; subject: string; priority: string; status: string }[]
    >("/support/tickets");
    return (data ?? []).map((t) => ({
      id: t.ticketCode || t.id,
      issue: t.subject,
      priority: t.priority?.[0] + t.priority?.slice(1).toLowerCase(),
      status:
        t.status === "OPEN"
          ? "Open"
          : t.status === "RESOLVED"
            ? "Resolved"
            : t.status === "CLOSED"
              ? "Closed"
              : "Pending",
      _id: t.id,
    }));
  } catch {
    return [];
  }
}

export async function fetchYoutube() {
  try {
    const [{ data: channels }, { data: streams }, oauth] = await Promise.all([
      apiFetch<{ id: string; channelName?: string | null; status: string; channelId?: string }[]>(
        "/youtube/channels"
      ),
      apiFetch<{ id: string; eventId: string; status: string }[]>("/youtube/streams"),
      apiFetch<{ configured: boolean }>("/youtube/oauth-status").catch(() => ({
        data: { configured: false },
      })),
    ]);
    return {
      channels: channels ?? [],
      streams: streams ?? [],
      oauthConfigured: Boolean(oauth.data?.configured),
    };
  } catch {
    return { channels: [], streams: [], oauthConfigured: false };
  }
}

export async function fetchNotifications() {
  try {
    const { data } = await apiFetch<{ title: string; createdAt?: string; type?: string }[]>("/notifications");
    return (data ?? []).map((n) => ({
      text: n.title,
      time: fmtDate(n.createdAt),
      color: "#3E7BD1",
    }));
  } catch {
    return [];
  }
}

export async function createInvitationAction(payload: Record<string, unknown>) {
  const { data } = await apiFetch<{ id?: string; _id?: string; invitationSlug?: string; publicUrl?: string }>(
    "/invitations",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
  const id = data.id || data._id;
  if (!id) throw new Error("Invitation created but no id returned");
  return { ...data, id };
}

export async function updateInvitationAction(id: string, payload: Record<string, unknown>) {
  const { data } = await apiFetch<{ id: string; invitationSlug?: string; publicUrl?: string }>(
    `/invitations/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
  return data;
}

export async function setInvitationThemeAction(
  id: string,
  payload: {
    themeId: string;
    primaryColor?: string;
    pageTitle?: string;
    logo?: string;
    coverImage?: string;
    customConfig?: Record<string, unknown>;
  }
) {
  const { data } = await apiFetch(`/invitations/${id}/theme-config`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return data;
}

export async function publishInvitationAction(id: string) {
  const { data } = await apiFetch<{ id: string; publicUrl?: string }>(`/invitations/${id}/publish`, {
    method: "POST",
    body: JSON.stringify({}),
  });
  return data;
}

export async function createEventAction(payload: Record<string, unknown>) {
  const { data } = await apiFetch<{ id?: string; _id?: string; eventSlug?: string; publicUrl?: string }>(
    "/events",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
  const id = data.id || data._id;
  if (!id) throw new Error("Event created but no id returned");
  return { ...data, id };
}

export async function updateEventAction(id: string, payload: Record<string, unknown>) {
  const { data } = await apiFetch<{ id: string; eventSlug?: string; publicUrl?: string }>(`/events/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return data;
}

export async function setEventThemeAction(
  id: string,
  payload: {
    themeId: string;
    primaryColor?: string;
    pageTitle?: string;
    liveTiming?: string;
    logo?: string;
    coverImage?: string;
    customConfig?: Record<string, unknown>;
  }
) {
  const { data } = await apiFetch(`/events/${id}/theme-config`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return data;
}

export async function publishEventAction(id: string) {
  const { data } = await apiFetch<{ id: string; publicUrl?: string }>(`/events/${id}/publish`, {
    method: "POST",
    body: JSON.stringify({}),
  });
  return data;
}

export async function createYoutubeStreamAction(payload: {
  eventId: string;
  youtubeChannelId: string;
  youtubeVideoId?: string;
  youtubeLiveUrl?: string;
  youtubeLiveKey?: string;
}) {
  const { data } = await apiFetch("/youtube/streams", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data;
}

export async function createCustomerAction(payload: Record<string, unknown>) {
  const { data } = await apiFetch("/customers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data;
}

export type CustomerContentRecordKind = "invitation" | "event";

export type CustomerDraftSetupResult = {
  customer: { id: string; _id?: string; name: string; email?: string };
  invitation: { id: string; _id?: string; invitationName: string; contentFillToken?: string };
  recordKind?: CustomerContentRecordKind;
  contentFillToken?: string;
  contentFillUrl?: string;
};

function apiRouteUnavailable(err: unknown, pathHint?: string): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  if (/no route:/.test(msg)) return true;
  if (pathHint && /api 404:/.test(msg) && msg.includes(pathHint.toLowerCase())) {
    return true;
  }
  return false;
}

async function setupCustomerDraftLegacy(payload: {
  name: string;
  email: string;
  phone?: string;
  invitationName: string;
  themeId?: string;
}): Promise<CustomerDraftSetupResult> {
  const password = crypto.randomBytes(16).toString("base64url");
  const customerRaw = (await createCustomerAction({
    name: payload.name,
    email: payload.email,
    phone: payload.phone,
    password,
  })) as { id?: string; _id?: string; name?: string; email?: string };

  const customerId = customerRaw.id ?? customerRaw._id;
  if (!customerId) throw new Error("Customer created but no id returned");

  let recordKind: CustomerContentRecordKind = "invitation";
  let recordId: string;

  try {
    const invitation = await createInvitationAction({
      customerId,
      invitationName: payload.invitationName,
    });
    recordId = invitation.id;
    if (payload.themeId) {
      await setInvitationThemeAction(recordId, { themeId: payload.themeId });
    }
  } catch (err) {
    if (!apiRouteUnavailable(err, "/invitations")) throw err;
    const event = await createEventAction({
      customerId,
      eventName: payload.invitationName,
    });
    recordKind = "event";
    recordId = event.id;
    if (payload.themeId) {
      await setEventThemeAction(recordId, { themeId: payload.themeId });
    }
  }

  const fillLink = await ensureContentFillTokenAction(recordId, recordKind);

  return {
    customer: {
      id: customerId,
      name: payload.name,
      email: payload.email,
    },
    invitation: {
      id: recordId,
      invitationName: payload.invitationName,
      contentFillToken: fillLink?.contentFillToken,
    },
    recordKind,
    contentFillToken: fillLink?.contentFillToken,
    contentFillUrl: fillLink?.contentFillUrl,
  };
}

export async function setupCustomerDraftAction(payload: {
  name: string;
  email: string;
  phone?: string;
  invitationName: string;
  themeId?: string;
}): Promise<CustomerDraftSetupResult> {
  try {
    const { data } = await apiFetch<CustomerDraftSetupResult>("/customers/setup-draft", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return data;
  } catch (err) {
    if (!apiRouteUnavailable(err, "setup-draft")) throw err;
    return setupCustomerDraftLegacy(payload);
  }
}

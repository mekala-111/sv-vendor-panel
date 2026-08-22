import { apiFetch, formatINR, mapEventStatus, fmtDate } from "./api";
import type { Customer, EventRecord, StatusTone } from "./data";
import { TONES, statusTone } from "./data";

export { statusTone, TONES };
export type { StatusTone };

type BackendCustomer = {
  id: string;
  name: string;
  email?: string | null;
  status: string;
  createdAt?: string;
};

type BackendEvent = {
  id: string;
  eventName: string;
  eventDate?: string | null;
  startTime?: string | null;
  location?: string | null;
  customerId?: string | null;
  status: string;
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
      branding?: Record<string, unknown>;
      wallet?: { balance?: number; currency?: string } | null;
    }>("/vendors/me");
    return data;
  } catch {
    return null;
  }
}

export async function fetchEventCreationPaymentConfigAction() {
  const { data } = await apiFetch<{
    amount: number;
    currency: string;
    free: boolean;
    payeeName: string;
    qrImage: string;
    instructions: string;
  }>("/payments/event-creation/config");
  return data;
}

export async function submitEventCreationPaymentAction(payload: {
  eventId: string;
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
    const { data } = await apiFetch<BackendCustomer[]>("/customers");
    return (data ?? []).map((c, i) => ({
      id: i + 1,
      name: c.name,
      email: c.email ?? "",
      events: 0,
      spend: "₹0",
      status: c.status === "ACTIVE" ? "Active" : "Inactive",
      joined: fmtDate(c.createdAt),
      eventsList: [],
      paymentsList: [],
      activity: [],
      _id: c.id,
    })) as Customer[];
  } catch {
    return [];
  }
}

export async function fetchCustomer(id: string): Promise<(Customer & { _id?: string }) | null> {
  try {
    const { data } = await apiFetch<BackendCustomer>(`/customers/${id}`);
    return {
      id: 0,
      name: data.name,
      email: data.email ?? "",
      events: 0,
      spend: "₹0",
      status: data.status === "ACTIVE" ? "Active" : "Inactive",
      joined: fmtDate(data.createdAt),
      eventsList: [],
      paymentsList: [],
      activity: [],
      _id: data.id,
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
      };
    });
  } catch {
    return [];
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
  try {
    const { data } = await apiFetch<
      {
        id: string;
        name: string;
        slug: string;
        status?: string;
        config?: { colors?: { primary?: string; secondary?: string; accent?: string }; layout?: string };
      }[]
    >("/themes?status=ACTIVE");
    return (data ?? []).map((t) => {
      const colors = t.config?.colors ?? {};
      return {
        slug: t.slug || t.id,
        name: t.name || "Theme",
        stripe1: colors.secondary || "#F3D9C0",
        stripe2: colors.accent || colors.secondary || "#EAC29A",
        primary: colors.primary || "#C77B3E",
        secondary: colors.secondary || "#F3D9C0",
        accent: colors.accent || "#8A5A2E",
        layout: t.config?.layout || t.slug || "cinematic",
        _id: t.id,
      };
    });
  } catch {
    return [];
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

export async function fetchEventCreationPayment(eventId: string) {
  try {
    const { data } = await apiFetch<BackendPayment[]>(
      `/payments?purpose=EVENT_CREATION&eventId=${encodeURIComponent(eventId)}`
    );
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

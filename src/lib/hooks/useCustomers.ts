/**
 * Customer data fetchers for the vendor panel.
 * Called on the server (Server Components) to avoid exposing API calls to the client.
 */

import { api, ApiError } from "@/lib/api";

export type CustomerStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export interface Customer {
  id: string;
  userId: string;
  vendorId: string;
  customerCode: string;
  name: string;
  phone: string | null;
  email: string | null;
  status: CustomerStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerListItem extends Customer {
  eventsCount: number;
}

export interface CustomerListResult {
  items: CustomerListItem[];
  page: number;
  totalPages: number;
  total: number;
}

export async function fetchCustomers(params: {
  page?: number;
  search?: string;
  status?: CustomerStatus | "";
  limit?: number;
}): Promise<CustomerListResult> {
  const { page = 1, search, status, limit = 20 } = params;
  const query: Record<string, string | number> = { page, limit };
  if (search) query.search = search;
  if (status) query.status = status;

  const { items, meta } = await api.getList<CustomerListItem>("/customers", { params: query });
  return { items, page: meta.page, totalPages: meta.totalPages, total: meta.total };
}

export interface CustomerEventSummary {
  id: string;
  eventName: string;
  status: "DRAFT" | "UPCOMING" | "LIVE" | "COMPLETED" | "CANCELLED" | "EXPIRED";
  eventDate: string | null;
  createdAt: string;
}

export interface CustomerPaymentSummary {
  id: string;
  amount: string;
  status: "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";
  paidAt: string | null;
  createdAt: string;
}

export interface CustomerActivityEntry {
  text: string;
  time: string;
}

export interface CustomerDetail {
  customer: Customer;
  stats: {
    totalEvents: number;
    upcomingEvents: number;
    completedEvents: number;
    totalSpend: number;
    pendingSpend: number;
  };
  events: CustomerEventSummary[];
  payments: CustomerPaymentSummary[];
  activity: CustomerActivityEntry[];
}

/** Returns null when the customer doesn't exist or isn't owned by this vendor (backend enforces the tenant scope). */
export async function fetchCustomerDetail(id: string): Promise<CustomerDetail | null> {
  let customer: Customer;
  try {
    customer = await api.get<Customer>(`/customers/${id}`);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 403)) {
      return null;
    }
    throw error;
  }

  const [events, payments] = await Promise.all([
    api.getList<CustomerEventSummary>("/events", { params: { customerId: id, limit: 100 } }),
    api.get<CustomerPaymentSummary[]>("/payments", { params: { customerId: id } }),
  ]);

  const totalEvents = events.meta.total;
  const upcomingEvents = events.items.filter((e) => e.status === "UPCOMING" || e.status === "LIVE").length;
  const completedEvents = events.items.filter((e) => e.status === "COMPLETED").length;

  const totalSpend = payments
    .filter((p) => p.status === "SUCCESS")
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const pendingSpend = payments
    .filter((p) => p.status === "PENDING")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const activity: CustomerActivityEntry[] = [
    ...events.items.map((e) => ({
      text: `Booked event: ${e.eventName}`,
      time: e.createdAt,
    })),
    ...payments
      .filter((p) => p.status === "SUCCESS")
      .map((p) => ({
        text: `Made payment of ₹${Number(p.amount).toLocaleString("en-IN")}`,
        time: p.paidAt ?? p.createdAt,
      })),
  ]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 20);

  return {
    customer,
    stats: { totalEvents, upcomingEvents, completedEvents, totalSpend, pendingSpend },
    events: events.items,
    payments,
    activity,
  };
}

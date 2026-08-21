/** Support ticket fetchers for the vendor panel. */

import { api, ApiError } from "@/lib/api";

export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type TicketStatus = "OPEN" | "PENDING" | "RESOLVED" | "CLOSED" | "CRITICAL";

export interface TicketMessage {
  authorId: string;
  authorRole: string;
  body: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  ticketCode: string;
  vendorId: string | null;
  customerId: string | null;
  userId: string;
  subject: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  assignedTo: string | null;
  messages: TicketMessage[];
  createdAt: string;
  updatedAt: string;
}

export async function fetchSupportTickets(params: { page?: number; status?: TicketStatus | "" } = {}) {
  const { page = 1, status } = params;
  const query: Record<string, string | number> = { page, limit: 20 };
  if (status) query.status = status;

  const { items, meta } = await api.getList<SupportTicket>("/support/tickets", { params: query });
  return { items, page: meta.page, totalPages: meta.totalPages, total: meta.total };
}

/** Returns null when the ticket doesn't exist or isn't owned by this vendor. */
export async function fetchSupportTicketDetail(id: string): Promise<SupportTicket | null> {
  try {
    return await api.get<SupportTicket>(`/support/tickets/${id}`);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 403)) {
      return null;
    }
    throw error;
  }
}

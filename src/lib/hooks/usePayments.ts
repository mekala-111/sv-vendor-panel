/** Payment fetchers for the vendor panel. */

import { api } from "@/lib/api";

export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED" | "CANCELLED";
export type PaymentPurpose = "CUSTOMER" | "EVENT_CREATION";

export interface Payment {
  id: string;
  vendorId: string | null;
  customerId: string | null;
  eventId: string | null;
  amount: number;
  currency: string;
  gateway: string;
  gatewayTransactionId: string | null;
  status: PaymentStatus;
  purpose: PaymentPurpose;
  utrNumber: string | null;
  paymentImage: string | null;
  rejectionReason: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  paidAt: string | null;
  createdAt: string;
}

export async function fetchPayments(params: {
  customerId?: string;
  eventId?: string;
  purpose?: PaymentPurpose;
  status?: PaymentStatus;
} = {}): Promise<Payment[]> {
  const query: Record<string, string> = {};
  if (params.customerId) query.customerId = params.customerId;
  if (params.eventId) query.eventId = params.eventId;
  if (params.purpose) query.purpose = params.purpose;
  if (params.status) query.status = params.status;
  return api.get<Payment[]>("/payments", { params: query });
}

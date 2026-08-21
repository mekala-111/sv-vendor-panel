"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { api, ApiError } from "./api";
import type { TicketStatus } from "./hooks/useSupport";

function errorRedirect(to: string, message: string): never {
  redirect(`${to}?error=${encodeURIComponent(message)}`);
}

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export async function createSupportTicketAction(formData: FormData) {
  const subject = str(formData, "subject");
  if (subject.length < 3) errorRedirect("/vendor/support", "Subject must be at least 3 characters.");

  const category = str(formData, "category");
  const priority = str(formData, "priority");
  const body = str(formData, "body");

  let created: { id: string };
  try {
    created = await api.post<{ id: string }>("/support/tickets", {
      subject,
      ...(category ? { category } : {}),
      ...(priority ? { priority } : {}),
      ...(body ? { body } : {}),
    });
  } catch (error) {
    const message = error instanceof ApiError ? error.message : "Failed to create ticket.";
    errorRedirect("/vendor/support", message);
  }

  revalidatePath("/vendor/support");
  redirect(`/vendor/support/${created.id}`);
}

export async function addTicketMessageAction(id: string, formData: FormData) {
  const message = str(formData, "message");
  if (!message) errorRedirect(`/vendor/support/${id}`, "Enter a message first.");

  try {
    await api.patch(`/support/tickets/${id}`, { message });
  } catch (error) {
    const msg = error instanceof ApiError ? error.message : "Failed to send message.";
    errorRedirect(`/vendor/support/${id}`, msg);
  }

  revalidatePath(`/vendor/support/${id}`);
  redirect(`/vendor/support/${id}`);
}

export async function setTicketStatusAction(id: string, status: TicketStatus, formData: FormData) {
  void formData;
  try {
    await api.patch(`/support/tickets/${id}`, { status });
  } catch (error) {
    const message = error instanceof ApiError ? error.message : "Failed to update ticket status.";
    errorRedirect(`/vendor/support/${id}`, message);
  }

  revalidatePath("/vendor/support");
  revalidatePath(`/vendor/support/${id}`);
  redirect(`/vendor/support/${id}`);
}

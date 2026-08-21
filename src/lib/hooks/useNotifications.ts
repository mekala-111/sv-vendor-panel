/** Notification fetchers for the vendor panel. */

import { api } from "@/lib/api";

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
}

export async function fetchNotifications(params: { limit?: number; unreadOnly?: boolean } = {}): Promise<Notification[]> {
  const { limit = 5, unreadOnly } = params;
  const { items } = await api.getList<Notification>("/notifications", {
    params: { page: 1, limit, ...(unreadOnly ? { unreadOnly: true } : {}) },
  });
  return items;
}

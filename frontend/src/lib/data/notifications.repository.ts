import { api } from "@/lib/data/api-client";
import type { Notification, NotificationKind, NotificationPayload } from "@/types";

interface BackendNotification {
  id: number;
  eventType: string;
  taskId: number;
  taskTitle: string;
  teamId: number;
  read: boolean;
  createdAt: string;
}

function toNotification(b: BackendNotification): Notification {
  return {
    id: String(b.id),
    recipientId: String(b.teamId),
    kind: b.eventType as NotificationKind,
    read: b.read,
    createdAt: b.createdAt,
    payload: {
      taskId: String(b.taskId),
      taskTitle: b.taskTitle,
      teamId: String(b.teamId),
    } as NotificationPayload,
  };
}

export async function getNotifications(): Promise<Notification[]> {
  const data = await api.get<BackendNotification[]>("/api/notifications");
  return data.map(toNotification);
}

export async function markAsRead(id: string): Promise<void> {
  await api.put(`/api/notifications/${id}/read`);
}

export async function markAllAsRead(): Promise<void> {
  const all = await getNotifications();
  await Promise.all(all.filter((n) => !n.read).map((n) => markAsRead(n.id)));
}

export async function deleteNotification(id: string): Promise<void> {
  await api.delete(`/api/notifications/${id}`);
}

export async function getUnreadCount(): Promise<number> {
  const data = await api.get<number>("/api/notifications/unread-count");
  return data;
}

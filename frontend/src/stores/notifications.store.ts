import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { Notification } from "@/types";
import * as notifRepo from "@/lib/data/notifications.repository";

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  startPolling: () => () => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

export const useNotificationsStore = create<NotificationsState>()(
  immer((set, get) => ({
    notifications: [],
    unreadCount: 0,
    loading: false,

    fetchNotifications: async () => {
      set((s) => { s.loading = true; });
      try {
        const notifications = await notifRepo.getNotifications();
        const unreadCount = notifications.filter((n) => !n.read).length;
        set((s) => { s.notifications = notifications; s.unreadCount = unreadCount; });
      } finally {
        set((s) => { s.loading = false; });
      }
    },

    startPolling: () => {
      get().fetchNotifications();
      const id = setInterval(() => get().fetchNotifications(), 10000);
      return () => clearInterval(id);
    },

    markAsRead: async (id) => {
      set((s) => {
        const n = s.notifications.find((x) => x.id === id);
        if (n && !n.read) {
          n.read = true;
          s.unreadCount = Math.max(0, s.unreadCount - 1);
        }
      });
      await notifRepo.markAsRead(id);
    },

    markAllAsRead: async () => {
      set((s) => {
        s.notifications.forEach((n) => { n.read = true; });
        s.unreadCount = 0;
      });
      await notifRepo.markAllAsRead();
    },

    deleteNotification: async (id) => {
      await notifRepo.deleteNotification(id);
      set((s) => {
        const n = s.notifications.find((x) => x.id === id);
        if (n && !n.read) {
          s.unreadCount = Math.max(0, s.unreadCount - 1);
        }
        s.notifications = s.notifications.filter((x) => x.id !== id);
      });
    },
  }))
);

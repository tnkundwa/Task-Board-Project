"use client";

import { useEffect } from "react";
import { useNotificationsStore } from "@/stores/notifications.store";

export function useNotifications() {
  const { notifications, unreadCount, loading, fetchNotifications, markAsRead, markAllAsRead } =
    useNotificationsStore();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead };
}

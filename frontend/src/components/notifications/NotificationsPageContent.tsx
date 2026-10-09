"use client";

import { useEffect } from "react";
import NotificationList from "./NotificationList";
import { useNotificationsStore } from "@/stores/notifications.store";

export default function NotificationsPageContent() {
  const { startPolling } = useNotificationsStore();

  useEffect(() => {
    return startPolling();
  }, [startPolling]);

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-2xl font-semibold mb-6">Notifications</h1>
      <NotificationList />
    </div>
  );
}

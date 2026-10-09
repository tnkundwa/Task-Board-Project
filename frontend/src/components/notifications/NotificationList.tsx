"use client";

import { Bell } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import NotificationItem from "./NotificationItem";
import { useNotificationsStore } from "@/stores/notifications.store";

export default function NotificationList() {
  const { notifications, loading, unreadCount, markAllAsRead } = useNotificationsStore();

  if (loading && notifications.length === 0) {
    return (
      <div className="flex flex-col gap-2 p-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {unreadCount > 0 && (
        <div className="flex justify-end px-2 pb-2">
          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={markAllAsRead}>
            Mark all as read
          </Button>
        </div>
      )}
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
          <Bell className="h-8 w-8 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">All caught up!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-0.5">
          {notifications.map((n) => (
            <NotificationItem key={n.id} notification={n} />
          ))}
        </div>
      )}
    </div>
  );
}

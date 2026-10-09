"use client";

import { CheckSquare, UserCheck, ArrowRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeDate } from "@/lib/utils";
import { useNotificationsStore } from "@/stores/notifications.store";
import type { Notification } from "@/types";

const KIND_ICONS = {
  TASK_ASSIGNED: <UserCheck className="h-4 w-4 text-blue-500" />,
  TASK_COMPLETED: <CheckSquare className="h-4 w-4 text-green-500" />,
  TASK_STATUS_CHANGED: <ArrowRight className="h-4 w-4 text-orange-500" />,
};

function getNotificationText(n: Notification): string {
  const { kind, payload } = n;
  switch (kind) {
    case "TASK_ASSIGNED":
      return `${payload.assignedByName ?? "Someone"} assigned you "${payload.taskTitle}" in ${payload.teamName ?? "a team"}`;
    case "TASK_COMPLETED":
      return `"${payload.taskTitle}" was completed in ${payload.teamName ?? "a team"}`;
    case "TASK_STATUS_CHANGED":
      return `"${payload.taskTitle}" status was changed`;
    default:
      return "New notification";
  }
}

export default function NotificationItem({ notification }: { notification: Notification }) {
  const { markAsRead, deleteNotification } = useNotificationsStore();

  return (
    <div
      className={cn(
        "group flex w-full items-start gap-3 rounded-lg p-3 transition-colors hover:bg-accent",
        !notification.read && "bg-primary/5"
      )}
    >
      <button
        className="flex flex-1 items-start gap-3 min-w-0 text-left"
        onClick={() => !notification.read && markAsRead(notification.id)}
      >
        <div className="mt-0.5 shrink-0">
          {KIND_ICONS[notification.kind]}
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn("text-sm leading-snug", !notification.read && "font-medium")}>
            {getNotificationText(notification)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatRelativeDate(notification.createdAt)}
          </p>
        </div>
        {!notification.read && (
          <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
        )}
      </button>
      <button
        type="button"
        onClick={() => deleteNotification(notification.id)}
        className="mt-0.5 shrink-0 rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
        aria-label="Delete notification"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

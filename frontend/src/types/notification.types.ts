export type NotificationKind =
  | "TASK_ASSIGNED"
  | "TASK_COMPLETED"
  | "TASK_STATUS_CHANGED";

export interface NotificationPayload {
  taskId?: string;
  taskTitle?: string;
  teamId?: string;
  teamName?: string;
  assignedById?: string;
  assignedByName?: string;
  oldStatus?: string;
  newStatus?: string;
}

export interface Notification {
  id: string;
  recipientId: string;
  kind: NotificationKind;
  read: boolean;
  createdAt: string;
  payload: NotificationPayload;
}

export interface CreateNotificationInput {
  recipientId: string;
  kind: NotificationKind;
  payload: NotificationPayload;
}

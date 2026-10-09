import type { TaskPriority, TaskStatus } from "@/types";

export const TASK_STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; color: string; bgColor: string; borderColor: string }
> = {
  TODO: {
    label: "To Do",
    color: "text-slate-600 dark:text-slate-400",
    bgColor: "bg-slate-100 dark:bg-slate-800",
    borderColor: "border-slate-300 dark:border-slate-600",
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950",
    borderColor: "border-blue-300 dark:border-blue-600",
  },
  DONE: {
    label: "Done",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950",
    borderColor: "border-green-300 dark:border-green-600",
  },
};

export const TASK_PRIORITY_CONFIG: Record<
  TaskPriority,
  { label: string; color: string; iconColor: string }
> = {
  LOW: {
    label: "Low",
    color: "text-slate-500",
    iconColor: "text-slate-400",
  },
  MEDIUM: {
    label: "Medium",
    color: "text-yellow-600",
    iconColor: "text-yellow-500",
  },
  HIGH: {
    label: "High",
    color: "text-orange-600",
    iconColor: "text-orange-500",
  },
  URGENT: {
    label: "Urgent",
    color: "text-red-600",
    iconColor: "text-red-500",
  },
};

export const TASK_STATUS_ORDER: TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE"];
export const TASK_PRIORITY_ORDER: TaskPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export const TEAM_COLOR_PRESETS = [
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#f43f5e", // rose
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#22c55e", // green
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#64748b", // slate
];

export const CURRENT_USER_ID = "member-1";

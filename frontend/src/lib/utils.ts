import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistanceToNow, isPast, isToday, isTomorrow, differenceInDays } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return ""
  return format(new Date(date), "MMM d, yyyy")
}

export function formatRelativeDate(date: string | null | undefined): string {
  if (!date) return ""
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function getDueDateStatus(dueDate: string | null | undefined): "overdue" | "due-today" | "due-soon" | "normal" | null {
  if (!dueDate) return null
  const date = new Date(dueDate)
  if (isPast(date) && !isToday(date)) return "overdue"
  if (isToday(date)) return "due-today"
  if (isTomorrow(date) || differenceInDays(date, new Date()) <= 2) return "due-soon"
  return "normal"
}

export function formatShortDate(date: string | null | undefined): string {
  if (!date) return ""
  return format(new Date(date), "MMM d")
}


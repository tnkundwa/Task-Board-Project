import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { TaskFilters, TaskPriority } from "@/types";

interface UIState {
  sidebarOpen: boolean;
  notificationSheetOpen: boolean;
  viewTaskId: string | null;

  // Task filters
  taskFilters: TaskFilters;

  // Actions
  toggleSidebar: () => void;
  setNotificationSheetOpen: (open: boolean) => void;
  openViewTaskSheet: (id: string) => void;
  closeViewTaskSheet: () => void;
  setTaskFilter: (key: keyof TaskFilters, value: string | null | TaskPriority) => void;
  resetTaskFilters: () => void;
}

const defaultFilters: TaskFilters = {
  search: "",
  assigneeId: null,
  priority: null,
};

export const useUIStore = create<UIState>()(
  immer((set) => ({
    sidebarOpen: true,
    notificationSheetOpen: false,
    viewTaskId: null,
    taskFilters: { ...defaultFilters },

    toggleSidebar: () => set((s) => { s.sidebarOpen = !s.sidebarOpen; }),
    setNotificationSheetOpen: (open) => set((s) => { s.notificationSheetOpen = open; }),
    openViewTaskSheet: (id) => set((s) => { s.viewTaskId = id; }),
    closeViewTaskSheet: () => set((s) => { s.viewTaskId = null; }),
    setTaskFilter: (key, value) => set((s) => { (s.taskFilters as Record<string, unknown>)[key] = value; }),
    resetTaskFilters: () => set((s) => { s.taskFilters = { ...defaultFilters }; }),
  }))
);

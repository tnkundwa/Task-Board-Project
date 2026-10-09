import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { Task, CreateTaskInput, UpdateTaskInput, TaskStatus } from "@/types";
import * as tasksRepo from "@/lib/data/tasks.repository";

interface TasksState {
  tasksByTeam: Record<string, Task[]>;
  loading: boolean;
  error: string | null;
  fetchTasksByTeam: (teamId: string) => Promise<void>;
  createTask: (input: CreateTaskInput) => Promise<Task>;
  updateTask: (id: string, teamId: string, input: UpdateTaskInput) => Promise<void>;
  deleteTask: (id: string, teamId: string) => Promise<void>;
  changeStatus: (id: string, teamId: string, status: TaskStatus) => Promise<void>;
}

export const useTasksStore = create<TasksState>()(
  immer((set) => ({
    tasksByTeam: {},
    loading: false,
    error: null,

    fetchTasksByTeam: async (teamId) => {
      set((s) => { s.loading = true; s.error = null; });
      try {
        const tasks = await tasksRepo.getTasksByTeam(teamId);
        set((s) => { s.tasksByTeam[teamId] = tasks; });
      } catch (e) {
        set((s) => { s.error = e instanceof Error ? e.message : "Failed to fetch tasks"; });
      } finally {
        set((s) => { s.loading = false; });
      }
    },

    createTask: async (input) => {
      const task = await tasksRepo.createTask(input);
      set((s) => {
        if (!s.tasksByTeam[input.teamId]) s.tasksByTeam[input.teamId] = [];
        s.tasksByTeam[input.teamId]!.push(task);
      });
      return task;
    },

    updateTask: async (id, teamId, input) => {
      const updated = await tasksRepo.updateTask(id, teamId, input);
      set((s) => {
        const tasks = s.tasksByTeam[teamId];
        if (!tasks) return;
        const idx = tasks.findIndex((t) => t.id === id);
        if (idx !== -1) tasks[idx] = updated;
      });
    },

    deleteTask: async (id, teamId) => {
      await tasksRepo.deleteTask(id);
      set((s) => {
        if (s.tasksByTeam[teamId]) {
          s.tasksByTeam[teamId] = s.tasksByTeam[teamId]!.filter((t) => t.id !== id);
        }
      });
    },

    changeStatus: async (id, teamId, status) => {
      // Optimistic update
      set((s) => {
        const tasks = s.tasksByTeam[teamId];
        if (!tasks) return;
        const task = tasks.find((t) => t.id === id);
        if (task) {
          task.status = status;
          task.completedAt = status === "DONE" ? new Date().toISOString() : null;
        }
      });
      try {
        const updated = await tasksRepo.changeTaskStatus(id, status);
        set((s) => {
          const tasks = s.tasksByTeam[teamId];
          if (!tasks) return;
          const idx = tasks.findIndex((t) => t.id === id);
          if (idx !== -1) tasks[idx] = updated;
        });
      } catch {
        // Revert on failure by re-fetching
        const tasks = await tasksRepo.getTasksByTeam(teamId);
        set((s) => { s.tasksByTeam[teamId] = tasks; });
      }
    },
  }))
);

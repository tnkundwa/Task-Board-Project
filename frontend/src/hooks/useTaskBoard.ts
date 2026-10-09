"use client";

import { useMemo } from "react";
import { useTasksStore } from "@/stores/tasks.store";
import { useUIStore } from "@/stores/ui.store";
import { TASK_STATUS_ORDER } from "@/lib/constants";
import type { TaskStatus } from "@/types";

export function useTaskBoard(teamId: string) {
  const { tasksByTeam } = useTasksStore();
  const { taskFilters } = useUIStore();

  const allTasks = tasksByTeam[teamId] ?? [];

  const filteredTasks = useMemo(() => {
    return allTasks.filter((task) => {
      if (
        taskFilters.search &&
        !task.title.toLowerCase().includes(taskFilters.search.toLowerCase()) &&
        !task.description.toLowerCase().includes(taskFilters.search.toLowerCase())
      ) {
        return false;
      }
      if (taskFilters.assigneeId && task.assigneeId !== taskFilters.assigneeId) return false;
      if (taskFilters.priority && task.priority !== taskFilters.priority) return false;
      return true;
    });
  }, [allTasks, taskFilters]);

  const columns = useMemo(() => {
    return TASK_STATUS_ORDER.reduce(
      (acc, status) => {
        acc[status] = filteredTasks.filter((t) => t.status === status);
        return acc;
      },
      {} as Record<TaskStatus, typeof filteredTasks>
    );
  }, [filteredTasks]);

  return { columns, allTasks, filteredTasks };
}

"use client";

import { useEffect } from "react";
import { useTasksStore } from "@/stores/tasks.store";

export function useTasks(teamId: string) {
  const { tasksByTeam, loading, error, fetchTasksByTeam } = useTasksStore();

  useEffect(() => {
    if (!tasksByTeam[teamId]) {
      fetchTasksByTeam(teamId);
    }
  }, [teamId, tasksByTeam, fetchTasksByTeam]);

  return {
    tasks: tasksByTeam[teamId] ?? [],
    loading,
    error,
  };
}

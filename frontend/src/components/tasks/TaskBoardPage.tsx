"use client";

import { usePathname } from "next/navigation";
import { useTeamsStore } from "@/stores/teams.store";
import TaskBoard from "./TaskBoard";

export default function TaskBoardPage() {
  const teamId = usePathname().split("/")[2] ?? "";
  const { teams } = useTeamsStore();
  const team = teams.find((t) => t.id === teamId);
  const teamName = team?.name ?? "Tasks";

  return <TaskBoard teamId={teamId} teamName={teamName} />;
}
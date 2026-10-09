"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { useTeamsStore } from "@/stores/teams.store";
import TeamForm from "./TeamForm";
import { Skeleton } from "@/components/ui/skeleton";
import type { Team } from "@/types";

export default function TeamSettingsContent() {
  const teamId = usePathname().split("/")[2] ?? "";
  const { teams, updateTeam, loading } = useTeamsStore();
  const [isSaving, setIsSaving] = useState(false);
  const team = teams.find((t) => t.id === teamId) as Team | undefined;

  useEffect(() => {
    // Teams are loaded by Sidebar, but if not loaded yet, trigger a fetch
  }, []);

  if (loading && !team) {
    return (
      <div className="p-6 max-w-lg">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Team not found.</p>
      </div>
    );
  }

  async function handleSubmit(values: { name: string; description: string; color: string }) {
    setIsSaving(true);
    try {
      await updateTeam(teamId, values);
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="p-6 max-w-lg">
      <h1 className="text-2xl font-semibold mb-6">Team Settings</h1>
      <TeamForm
        defaultValues={{ name: team.name, description: team.description, color: team.color }}
        onSubmit={handleSubmit}
        onCancel={() => {}}
        isLoading={isSaving}
        team={team}
      />
    </div>
  );
}
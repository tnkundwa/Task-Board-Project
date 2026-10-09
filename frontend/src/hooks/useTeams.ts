"use client";

import { useEffect } from "react";
import { useTeamsStore } from "@/stores/teams.store";

export function useTeams() {
  const { teams, loading, error, fetchTeams } = useTeamsStore();

  useEffect(() => {
    if (teams.length === 0 && !loading) {
      fetchTeams();
    }
  }, [teams.length, loading, fetchTeams]);

  return { teams, loading, error };
}

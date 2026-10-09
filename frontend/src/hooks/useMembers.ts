"use client";

import { useEffect } from "react";
import { useMembersStore } from "@/stores/members.store";

export function useMembers(teamId?: string) {
  const { members, membersByTeam, loading, fetchMembers, fetchMembersByTeam } = useMembersStore();

  useEffect(() => {
    if (members.length === 0) fetchMembers();
    if (teamId && !membersByTeam[teamId]) fetchMembersByTeam(teamId);
  }, [teamId, members.length, membersByTeam, fetchMembers, fetchMembersByTeam]);

  return {
    members: teamId ? (membersByTeam[teamId] ?? []) : members,
    allMembers: members,
    loading,
  };
}

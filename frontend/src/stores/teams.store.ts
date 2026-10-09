import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { Team, CreateTeamInput, UpdateTeamInput } from "@/types";
import * as teamsRepo from "@/lib/data/teams.repository";

interface TeamsState {
  teams: Team[];
  loading: boolean;
  error: string | null;
  fetchTeams: () => Promise<void>;
  createTeam: (input: CreateTeamInput) => Promise<Team>;
  updateTeam: (id: string, input: UpdateTeamInput) => Promise<void>;
  deleteTeam: (id: string) => Promise<void>;
  addMemberToTeam: (teamId: string, member: { name: string; email: string; role?: string }) => Promise<void>;
  removeMemberFromTeam: (teamId: string, memberId: string) => Promise<void>;
}

export const useTeamsStore = create<TeamsState>()(
  immer((set) => ({
    teams: [],
    loading: false,
    error: null,

    fetchTeams: async () => {
      set((s) => { s.loading = true; s.error = null; });
      try {
        const teams = await teamsRepo.getTeams();
        set((s) => { s.teams = teams; });
      } catch (e) {
        set((s) => { s.error = e instanceof Error ? e.message : "Failed to fetch teams"; });
      } finally {
        set((s) => { s.loading = false; });
      }
    },

    createTeam: async (input) => {
      const team = await teamsRepo.createTeam(input);
      set((s) => { s.teams.push(team); });
      return team;
    },

    updateTeam: async (id, input) => {
      const updated = await teamsRepo.updateTeam(id, input);
      set((s) => {
        const idx = s.teams.findIndex((t) => t.id === id);
        if (idx !== -1) s.teams[idx] = updated;
      });
    },

    deleteTeam: async (id) => {
      await teamsRepo.deleteTeam(id);
      set((s) => { s.teams = s.teams.filter((t) => t.id !== id); });
    },

    addMemberToTeam: async (teamId, member) => {
      await teamsRepo.addMemberToTeam(teamId, { name: member.name, email: member.email, role: member.role ?? "MEMBER" });
    },

    removeMemberFromTeam: async (teamId, memberId) => {
      await teamsRepo.removeMemberFromTeam(teamId, memberId);
      set((s) => {
        const idx = s.teams.findIndex((t) => t.id === teamId);
        if (idx !== -1 && s.teams[idx]) {
          s.teams[idx]!.memberships = s.teams[idx]!.memberships.filter((m) => m.memberId !== memberId);
        }
      });
    },
  }))
);

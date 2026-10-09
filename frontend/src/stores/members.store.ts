import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { Member } from "@/types";
import * as membersRepo from "@/lib/data/members.repository";

interface MembersState {
  members: Member[];
  membersByTeam: Record<string, Member[]>;
  loading: boolean;
  error: string | null;
  fetchMembers: () => Promise<void>;
  fetchMembersByTeam: (teamId: string) => Promise<void>;
  getMemberById: (id: string) => Member | undefined;
}

export const useMembersStore = create<MembersState>()(
  immer((set, get) => ({
    members: [],
    membersByTeam: {},
    loading: false,
    error: null,

    fetchMembers: async () => {
      set((s) => { s.loading = true; s.error = null; });
      try {
        const members = await membersRepo.getMembers();
        set((s) => { s.members = members; });
      } catch (e) {
        set((s) => { s.error = e instanceof Error ? e.message : "Failed to fetch members"; });
      } finally {
        set((s) => { s.loading = false; });
      }
    },

    fetchMembersByTeam: async (teamId) => {
      set((s) => { s.loading = true; });
      try {
        const members = await membersRepo.getMembersByTeam(teamId);
        set((s) => { s.membersByTeam[teamId] = members; });
      } catch (e) {
        set((s) => { s.error = e instanceof Error ? e.message : "Failed to fetch team members"; });
      } finally {
        set((s) => { s.loading = false; });
      }
    },

    getMemberById: (id) => {
      return get().members.find((m) => m.id === id);
    },
  }))
);

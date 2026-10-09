import type { MemberRole } from "./team.types";

export interface Member {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: MemberRole;
  createdAt: string;
}

export interface CreateMemberInput {
  name: string;
  email: string;
  avatarUrl?: string | null;
  role: MemberRole;
}

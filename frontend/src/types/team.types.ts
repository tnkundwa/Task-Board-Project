export interface TeamMembership {
  memberId: string;
  role: MemberRole;
}

export type MemberRole = "OWNER" | "ADMIN" | "MEMBER";

export interface Team {
  id: string;
  name: string;
  description: string;
  color: string;
  createdAt: string;
  updatedAt: string;
  memberships: TeamMembership[];
}

export interface CreateTeamInput {
  name: string;
  description: string;
  color: string;
}

export interface UpdateTeamInput {
  name?: string;
  description?: string;
  color?: string;
}

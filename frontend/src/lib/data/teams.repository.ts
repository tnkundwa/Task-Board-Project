import { api } from "@/lib/data/api-client";
import type { Team, CreateTeamInput, UpdateTeamInput, Member, MemberRole } from "@/types";

interface BackendMember {
  id: number;
  name: string;
  email: string;
  role: string;
  teamId: number;
}

interface BackendTeam {
  id: number;
  name: string;
  description: string;
  color?: string;
  createdAt: string;
  members?: BackendMember[];
}

function toMember(b: BackendMember): Member {
  return {
    id: String(b.id),
    name: b.name,
    email: b.email,
    avatarUrl: null,
    role: b.role as MemberRole,
    createdAt: "",
  };
}

function toTeam(b: BackendTeam): Team {
  return {
    id: String(b.id),
    name: b.name,
    description: b.description,
    color: b.color ?? "#6366f1",
    createdAt: b.createdAt,
    updatedAt: b.createdAt,
    memberships: (b.members ?? []).map((m) => ({
      memberId: String(m.id),
      role: "MEMBER" as MemberRole,
    })),
  };
}

export async function getTeams(): Promise<Team[]> {
  const data = await api.get<BackendTeam[]>("/api/teams");
  return data.map(toTeam);
}

export async function getTeamById(id: string): Promise<Team | null> {
  try {
    const data = await api.get<BackendTeam>(`/api/teams/${id}`);
    return toTeam(data);
  } catch {
    return null;
  }
}

export async function createTeam(input: CreateTeamInput): Promise<Team> {
  const data = await api.post<BackendTeam>("/api/teams", {
    name: input.name,
    description: input.description,
    color: input.color,
  });
  return toTeam(data);
}

export async function updateTeam(id: string, input: UpdateTeamInput): Promise<Team> {
  const data = await api.put<BackendTeam>(`/api/teams/${id}`, {
    name: input.name,
    description: input.description,
    color: input.color,
  });
  return toTeam(data);
}

export function deleteTeam(id: string): Promise<void> {
  return api.delete<void>(`/api/teams/${id}`);
}

export async function addMemberToTeam(
  teamId: string,
  member: { name: string; email: string; role?: string },
): Promise<void> {
  await api.post(`/api/teams/${teamId}/members`, {
    name: member.name,
    email: member.email,
    role: member.role ?? "MEMBER",
  });
}

export function removeMemberFromTeam(teamId: string, memberId: string): Promise<void> {
  return api.delete<void>(`/api/teams/${teamId}/members/${memberId}`);
}

export async function getMembersByTeam(teamId: string): Promise<Member[]> {
  const data = await api.get<BackendMember[]>(`/api/teams/${teamId}/members`);
  return data.map(toMember);
}

export async function getAllMembers(): Promise<Member[]> {
  const teams = await api.get<BackendTeam[]>("/api/teams");
  const seen = new Set<string>();
  const members: Member[] = [];
  for (const team of teams) {
    for (const bm of team.members ?? []) {
      if (!seen.has(bm.email)) {
        seen.add(bm.email);
        members.push(toMember(bm));
      }
    }
  }
  return members;
}

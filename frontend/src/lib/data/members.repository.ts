import { getAllMembers, getMembersByTeam as getTeamMembers } from "./teams.repository";

export { getAllMembers as getMembers, getTeamMembers as getMembersByTeam };

export async function getMemberById(id: string): Promise<import("@/types").Member | null> {
  const all = await getAllMembers();
  return all.find((m) => m.id === id) ?? null;
}

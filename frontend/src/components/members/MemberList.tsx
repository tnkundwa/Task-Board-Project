"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Plus, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import MemberCard from "./MemberCard";
import { useMembersStore } from "@/stores/members.store";
import { useTeamsStore } from "@/stores/teams.store";

export default function MemberList() {
  const teamId = usePathname().split("/")[2] ?? "";
  const { members, membersByTeam, loading, fetchMembers, fetchMembersByTeam } = useMembersStore();
  const { teams, addMemberToTeam, removeMemberFromTeam } = useTeamsStore();
  const [addOpen, setAddOpen] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [createMode, setCreateMode] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const team = teams.find((t) => t.id === teamId);
  const teamMembers = membersByTeam[teamId] ?? [];

  const availableMembers = members.filter(
    (m) => !teamMembers.some((tm) => tm.email === m.email)
  );

  useEffect(() => {
    fetchMembersByTeam(teamId);
    if (members.length === 0) fetchMembers();
  }, [teamId, fetchMembersByTeam, fetchMembers, members.length]);

  function resetDialog() {
    setCreateMode(false);
    setNewName("");
    setNewEmail("");
    setAddingId(null);
    setIsCreating(false);
  }

  async function handleAddMember(memberId: string) {
    setAddingId(memberId);
    const member = members.find((m) => m.id === memberId);
    if (!member) return;
    try {
      await addMemberToTeam(teamId, { name: member.name, email: member.email });
      await fetchMembersByTeam(teamId);
      await fetchMembers();
      toast.success("Member added");
      setAddOpen(false);
      resetDialog();
    } catch {
      toast.error("Failed to add member");
    } finally {
      setAddingId(null);
    }
  }

  async function handleCreateMember() {
    if (!newName.trim() || !newEmail.trim()) {
      toast.error("Name and email are required");
      return;
    }
    setIsCreating(true);
    try {
      await addMemberToTeam(teamId, { name: newName.trim(), email: newEmail.trim() });
      await fetchMembersByTeam(teamId);
      await fetchMembers();
      toast.success("Member added");
      setAddOpen(false);
      resetDialog();
    } catch {
      toast.error("Failed to create member");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleRemoveMember(memberId: string) {
    const member = teamMembers.find((m) => m.id === memberId);
    if (!confirm(`Remove ${member?.name ?? "this member"} from the team?`)) return;
    try {
      await removeMemberFromTeam(teamId, memberId);
      await fetchMembersByTeam(teamId);
      toast.success("Member removed");
    } catch {
      toast.error("Failed to remove member");
    }
  }

  if (loading && teamMembers.length === 0) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Members</h1>
          <Skeleton className="h-7 w-28 rounded-lg" />
        </div>
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  function getMembershipRole(memberId: string) {
    return team?.memberships.find((m) => m.memberId === memberId)?.role;
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Members</h1>
        <Button size="sm" onClick={() => { resetDialog(); setAddOpen(true); }}>
          <Plus className="mr-1.5 h-4 w-4" /> Add member
        </Button>
      </div>

      {teamMembers.length === 0 ? (
        <p className="text-muted-foreground">No members found.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {teamMembers.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              membershipRole={getMembershipRole(member.id)}
              onRemove={() => handleRemoveMember(member.id)}
            />
          ))}
        </div>
      )}

      <Dialog
        open={addOpen}
        onOpenChange={(open) => {
          if (!open) resetDialog();
          setAddOpen(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add member</DialogTitle>
          </DialogHeader>

          <div className="flex gap-2 mb-2">
            <Button
              variant={createMode ? "outline" : "default"}
              size="sm"
              className="flex-1"
              onClick={() => setCreateMode(false)}
            >
              <Users className="mr-1.5 h-4 w-4" /> Existing
            </Button>
            <Button
              variant={createMode ? "default" : "outline"}
              size="sm"
              className="flex-1"
              onClick={() => setCreateMode(true)}
            >
              <UserPlus className="mr-1.5 h-4 w-4" /> New
            </Button>
          </div>

          {createMode ? (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="new-name">Name</Label>
                <Input
                  id="new-name"
                  placeholder="Jane Doe"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="new-email">Email</Label>
                <Input
                  id="new-email"
                  type="email"
                  placeholder="jane@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>
              <Button className="mt-1" onClick={handleCreateMember} disabled={isCreating}>
                {isCreating ? "Adding…" : "Add to team"}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
              {availableMembers.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No available members to add.
                </p>
              ) : (
                availableMembers.map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => handleAddMember(member.id)}
                    disabled={addingId === member.id}
                    className="flex items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-accent disabled:opacity-50"
                  >
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                      style={{
                        backgroundColor: [
                          "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
                          "#f97316", "#22c55e", "#14b8a6", "#3b82f6",
                        ][member.name.length % 8],
                      }}
                    >
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
"use client";

import { useState } from "react";
import Link from "next/link";
import { Users, CheckSquare, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import TeamForm from "./TeamForm";
import TeamAvatar from "./TeamAvatar";
import { useTeamsStore } from "@/stores/teams.store";
import { cn } from "@/lib/utils";
import type { Team } from "@/types";

interface TeamCardProps {
  team: Team;
  taskCount: number;
  onDelete: (id: string) => void;
}

export default function TeamCard({ team, taskCount, onDelete }: TeamCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { updateTeam } = useTeamsStore();

  async function handleEditSubmit(values: { name: string; description: string; color: string }) {
    setIsLoading(true);
    try {
      await updateTeam(team.id, values);
      toast.success("Team updated");
      setEditOpen(false);
    } catch {
      toast.error("Failed to update team");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Card className="group relative hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <Link
            href={`/teams/${team.id}/tasks`}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <TeamAvatar name={team.name} color={team.color} size="lg" />
            <div>
              <h3 className="font-semibold leading-tight">{team.name}</h3>
            </div>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
              )}
            >
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditOpen(true)}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(team.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{team.description}</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              {team.memberships.length} member{team.memberships.length !== 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1.5">
              <CheckSquare className="h-4 w-4" />
              {taskCount} task{taskCount !== 1 ? "s" : ""}
            </span>
          </div>
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit team</DialogTitle>
          </DialogHeader>
          <TeamForm
            defaultValues={{ name: team.name, description: team.description, color: team.color }}
            onSubmit={handleEditSubmit}
            onCancel={() => setEditOpen(false)}
            isLoading={isLoading}
            team={team}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

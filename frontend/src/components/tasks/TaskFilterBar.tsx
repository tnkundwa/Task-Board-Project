"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUIStore } from "@/stores/ui.store";
import { useMembersStore } from "@/stores/members.store";
import { TASK_PRIORITY_ORDER, TASK_PRIORITY_CONFIG } from "@/lib/constants";
import type { TaskPriority } from "@/types";

export default function TaskFilterBar() {
  const { taskFilters, setTaskFilter, resetTaskFilters } = useUIStore();
  const { members } = useMembersStore();

  const hasActiveFilters =
    taskFilters.search !== "" || taskFilters.assigneeId !== null || taskFilters.priority !== null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search tasks…"
          className="h-8 pl-8 w-48 text-sm"
          value={taskFilters.search}
          onChange={(e) => setTaskFilter("search", e.target.value)}
        />
      </div>

      <Select
        value={taskFilters.assigneeId ?? "all"}
        onValueChange={(v) => setTaskFilter("assigneeId", v === "all" ? null : v)}
      >
        <SelectTrigger className="h-8 w-36 text-sm">
          <SelectValue placeholder="Assignee" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All assignees</SelectItem>
          {members.map((m) => (
            <SelectItem key={m.id} value={m.id}>
              {m.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={taskFilters.priority ?? "all"}
        onValueChange={(v) =>
          setTaskFilter("priority", v === "all" ? null : (v as TaskPriority))
        }
      >
        <SelectTrigger className="h-8 w-32 text-sm">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All priorities</SelectItem>
          {TASK_PRIORITY_ORDER.map((p) => (
            <SelectItem key={p} value={p}>
              {TASK_PRIORITY_CONFIG[p].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={resetTaskFilters}>
          <X className="mr-1 h-3.5 w-3.5" /> Clear filters
        </Button>
      )}
    </div>
  );
}

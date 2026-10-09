"use client";

import { useDroppable } from "@dnd-kit/core";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TASK_STATUS_CONFIG } from "@/lib/constants";
import TaskCard from "./TaskCard";
import type { Task, TaskStatus } from "@/types";

interface TaskColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onCreateTask: () => void;
}

export default function TaskColumn({ status, tasks, onCreateTask }: TaskColumnProps) {
  const cfg = TASK_STATUS_CONFIG[status];

  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex flex-col gap-2 min-w-0">
      {/* Column header */}
      <div className={cn("flex items-center justify-between rounded-lg px-3 py-2", cfg.bgColor)}>
        <div className="flex items-center gap-2">
          <span className={cn("text-sm font-semibold", cfg.color)}>{cfg.label}</span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-medium tabular-nums border",
              cfg.bgColor,
              cfg.color,
              cfg.borderColor
            )}
          >
            {tasks.length}
          </span>
        </div>
        {status === "TODO" && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onCreateTask}
            aria-label="Add task"
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex flex-col gap-2 rounded-lg p-2 min-h-[200px] transition-colors",
          isOver ? "bg-accent/50 ring-2 ring-primary/20" : "bg-muted/30"
        )}
      >
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}

        {tasks.length === 0 && (
          <div className="flex flex-1 items-center justify-center py-8">
            <p className="text-xs text-muted-foreground">No tasks</p>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useDraggable } from "@dnd-kit/core";
import { Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatShortDate, getDueDateStatus } from "@/lib/utils";
import TaskPriorityIcon from "./TaskPriorityIcon";
import MemberAvatarGroup from "@/components/members/MemberAvatarGroup";
import { useUIStore } from "@/stores/ui.store";
import { useMembersStore } from "@/stores/members.store";
import type { Task } from "@/types";

interface TaskCardProps {
  task: Task;
  isDragOverlay?: boolean;
}

export default function TaskCard({ task, isDragOverlay }: TaskCardProps) {
  const { openViewTaskSheet } = useUIStore();
  const { members } = useMembersStore();

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
    disabled: isDragOverlay,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  const dueDateStatus = getDueDateStatus(task.dueDate);
  const assignee = task.assigneeId ? members.find((m) => m.id === task.assigneeId) : null;

  const cardContent = (
    <Card
      className={cn(
        "cursor-grab active:cursor-grabbing select-none hover:shadow-md transition-shadow",
        (isDragging || isDragOverlay) && "shadow-xl"
      )}
      onClick={(e) => {
        if (!isDragging && !isDragOverlay) {
          e.stopPropagation();
          openViewTaskSheet(task.id);
        }
      }}
    >
      <CardContent className="p-3 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <p className={cn("text-sm font-medium leading-snug", task.status === "DONE" && "line-through text-muted-foreground")}>
            {task.title}
          </p>
          <TaskPriorityIcon priority={task.priority} />
        </div>

        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
        )}

        <div className="flex items-center justify-between">
          {task.dueDate ? (
            <span
              className={cn(
                "flex items-center gap-1 text-xs",
                dueDateStatus === "overdue" && "text-red-600 font-medium",
                dueDateStatus === "due-today" && "text-orange-600 font-medium",
                dueDateStatus === "due-soon" && "text-yellow-600",
                dueDateStatus === "normal" && "text-muted-foreground"
              )}
            >
              <Calendar className="h-3 w-3" />
              {formatShortDate(task.dueDate)}
            </span>
          ) : (
            <span />
          )}

          {assignee && (
            <MemberAvatarGroup members={[assignee]} max={1} size="sm" />
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (isDragOverlay) {
    return cardContent;
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn("touch-none", isDragging && "opacity-50")}
    >
      {cardContent}
    </div>
  );
}

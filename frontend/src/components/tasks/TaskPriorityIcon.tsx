import { ArrowDown, ArrowRight, ArrowUp, AlertCircle } from "lucide-react";
import { TASK_PRIORITY_CONFIG } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { TaskPriority } from "@/types";

const ICONS: Record<TaskPriority, React.ComponentType<{ className?: string }>> = {
  LOW: ArrowDown,
  MEDIUM: ArrowRight,
  HIGH: ArrowUp,
  URGENT: AlertCircle,
};

export default function TaskPriorityIcon({
  priority,
  showLabel = false,
}: {
  priority: TaskPriority;
  showLabel?: boolean;
}) {
  const cfg = TASK_PRIORITY_CONFIG[priority];
  const Icon = ICONS[priority];
  return (
    <span className={cn("flex items-center gap-1 text-xs", cfg.color)}>
      <Icon className={cn("h-3.5 w-3.5", cfg.iconColor)} />
      {showLabel && <span>{cfg.label}</span>}
    </span>
  );
}

import { Badge } from "@/components/ui/badge";
import { TASK_STATUS_CONFIG } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { TaskStatus } from "@/types";

export default function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const cfg = TASK_STATUS_CONFIG[status];
  return (
    <Badge
      variant="outline"
      className={cn("text-xs font-medium", cfg.color, cfg.bgColor, cfg.borderColor)}
    >
      {cfg.label}
    </Badge>
  );
}

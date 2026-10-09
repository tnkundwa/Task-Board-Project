import { getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Member } from "@/types";

interface MemberAvatarGroupProps {
  members: Member[];
  max?: number;
  size?: "sm" | "md";
}

const sizeClasses = {
  sm: "h-6 w-6 text-xs",
  md: "h-8 w-8 text-sm",
};

export default function MemberAvatarGroup({ members, max = 3, size = "md" }: MemberAvatarGroupProps) {
  const visible = members.slice(0, max);
  const overflow = members.length - max;

  return (
    <div className="flex -space-x-1.5">
      {visible.map((member) => (
        <div
          key={member.id}
          className={cn(
            "flex shrink-0 items-center justify-center rounded-full font-semibold text-white ring-2 ring-background",
            sizeClasses[size]
          )}
          style={{ backgroundColor: stringToColor(member.name) }}
          title={member.name}
        >
          {getInitials(member.name)}
        </div>
      ))}
      {overflow > 0 && (
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground font-medium ring-2 ring-background",
            sizeClasses[size]
          )}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}

// Deterministic color from string
function stringToColor(str: string): string {
  const colors = [
    "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#ef4444",
    "#f97316", "#f59e0b", "#22c55e", "#14b8a6", "#06b6d4", "#3b82f6",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length] ?? "#6366f1";
}

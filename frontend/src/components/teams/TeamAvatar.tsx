import { getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface TeamAvatarProps {
  name: string;
  color: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-6 w-6 text-xs",
  md: "h-8 w-8 text-sm",
  lg: "h-10 w-10 text-base",
};

export default function TeamAvatar({ name, color, size = "md", className }: TeamAvatarProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold text-white",
        sizeClasses[size],
        className
      )}
      style={{ backgroundColor: color }}
      aria-label={name}
    >
      {getInitials(name)}
    </div>
  );
}

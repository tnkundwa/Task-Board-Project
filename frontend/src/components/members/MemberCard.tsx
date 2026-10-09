"use client";

import { Mail, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/lib/utils";
import type { Member, MemberRole } from "@/types";

const roleColors: Record<string, string> = {
  OWNER: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
  ADMIN: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  MEMBER: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

const memberColors = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f97316", "#22c55e", "#14b8a6", "#3b82f6",
];

function getColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return memberColors[Math.abs(hash) % memberColors.length] ?? "#6366f1";
}

interface MemberCardProps {
  member: Member;
  membershipRole?: MemberRole;
  onRemove?: () => void;
}

export default function MemberCard({ member, membershipRole, onRemove }: MemberCardProps) {
  const displayRole = membershipRole ?? member.role;

  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
          style={{ backgroundColor: getColor(member.name) }}
        >
          {getInitials(member.name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium truncate">{member.name}</p>
            <Badge
              variant="outline"
              className={`text-xs ${roleColors[displayRole] ?? ""}`}
            >
              {displayRole.toLowerCase()}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground flex items-center gap-1 truncate">
            <Mail className="h-3.5 w-3.5 shrink-0" />
            {member.email}
          </p>
        </div>
        {onRemove && displayRole !== "OWNER" && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={onRemove}
            aria-label={`Remove ${member.name}`}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

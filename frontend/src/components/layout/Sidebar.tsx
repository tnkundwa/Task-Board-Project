"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  CheckSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useUIStore } from "@/stores/ui.store";
import { useTeamsStore } from "@/stores/teams.store";
import TeamAvatar from "@/components/teams/TeamAvatar";

export default function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { teams, loading, fetchTeams } = useTeamsStore();

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r bg-card transition-all duration-300",
        sidebarOpen ? "w-60" : "w-14"
      )}
    >
      {/* Header */}
      <div className="flex h-14 items-center justify-between px-3 py-2">
        {sidebarOpen && (
          <Link href="/teams" className="flex items-center gap-2 font-semibold">
            <CheckSquare className="h-5 w-5 text-primary" />
            <span className="text-sm">Task Board</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8 shrink-0", !sidebarOpen && "mx-auto")}
          onClick={toggleSidebar}
          aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {sidebarOpen ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeftOpen className="h-4 w-4" />
          )}
        </Button>
      </div>

      <Separator />

      {/* Nav */}
      <div className="flex flex-col gap-1 p-2">
        <NavItem
          href="/teams"
          icon={<LayoutDashboard className="h-4 w-4" />}
          label="Teams"
          collapsed={!sidebarOpen}
          active={pathname === "/teams"}
        />
      </div>

      <Separator />

      {/* Teams list */}
      <ScrollArea className="flex-1 px-2 py-2">
        {sidebarOpen && (
          <p className="mb-1 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Teams
          </p>
        )}
        <div className="flex flex-col gap-0.5">
          {loading && teams.length === 0
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2 rounded-md px-2 py-1.5">
                  <Skeleton className="h-6 w-6 rounded-full shrink-0" />
                  {sidebarOpen && <Skeleton className="h-4 w-24" />}
                </div>
              ))
            : teams.map((team) => {
                const teamBase = `/teams/${team.id}`;
                const isTeamActive = pathname.startsWith(teamBase);
                return (
                  <div key={team.id}>
                    <TeamNavItem
                      team={team}
                      collapsed={!sidebarOpen}
                      active={isTeamActive}
                    />
                    {isTeamActive && sidebarOpen && (
                      <div className="ml-8 flex flex-col gap-0.5">
                        <SubNavItem
                          href={`${teamBase}/tasks`}
                          icon={<CheckSquare className="h-3.5 w-3.5" />}
                          label="Tasks"
                          active={pathname.startsWith(`${teamBase}/tasks`)}
                        />
                        <SubNavItem
                          href={`${teamBase}/members`}
                          icon={<Users className="h-3.5 w-3.5" />}
                          label="Members"
                          active={pathname.startsWith(`${teamBase}/members`)}
                        />
                        <SubNavItem
                          href={`${teamBase}/settings`}
                          icon={<Settings className="h-3.5 w-3.5" />}
                          label="Settings"
                          active={pathname.startsWith(`${teamBase}/settings`)}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
        </div>
      </ScrollArea>
    </aside>
  );
}

function NavItem({
  href,
  icon,
  label,
  collapsed,
  active,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
        active
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        collapsed && "justify-center"
      )}
      title={collapsed ? label : undefined}
    >
      {icon}
      {!collapsed && <span>{label}</span>}
    </Link>
  );
}

function SubNavItem({
  href,
  icon,
  label,
  active,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-1 text-xs transition-colors",
        active
          ? "text-primary font-medium"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}

function TeamNavItem({
  team,
  collapsed,
  active,
}: {
  team: { id: string; name: string; color: string };
  collapsed: boolean;
  active: boolean;
}) {
  return (
    <Link
      href={`/teams/${team.id}/tasks`}
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
        active
          ? "bg-accent text-accent-foreground font-medium"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        collapsed && "justify-center"
      )}
      title={collapsed ? team.name : undefined}
    >
      <TeamAvatar name={team.name} color={team.color} size="sm" />
      {!collapsed && (
        <span className="truncate">{team.name}</span>
      )}
    </Link>
  );
}

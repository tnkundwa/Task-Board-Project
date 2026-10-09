"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, UserX } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { buttonVariants } from "@/components/ui/button";
import { cn, getInitials } from "@/lib/utils";
import { useMembersStore } from "@/stores/members.store";

interface AssigneePickerProps {
  teamId: string;
  value: string | null;
  onChange: (id: string | null) => void;
}

export default function AssigneePicker({ teamId, value, onChange }: AssigneePickerProps) {
  const [open, setOpen] = useState(false);
  const { membersByTeam } = useMembersStore();
  const members = membersByTeam[teamId] ?? [];

  const selected = value ? members.find((m) => m.id === value) : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(buttonVariants({ variant: "outline" }), "w-full justify-between font-normal")}
        role="combobox"
      >
        {selected ? (
          <span className="flex items-center gap-2">
            <MiniAvatar name={selected.name} />
            {selected.name}
          </span>
        ) : (
          <span className="text-muted-foreground">Unassigned</span>
        )}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search members…" />
          <CommandList>
            <CommandEmpty>No members found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="unassigned"
                onSelect={() => {
                  onChange(null);
                  setOpen(false);
                }}
              >
                <UserX className="mr-2 h-4 w-4 opacity-50" />
                Unassigned
                <Check
                  className={cn("ml-auto h-4 w-4", value === null ? "opacity-100" : "opacity-0")}
                />
              </CommandItem>
              {members.map((member) => (
                <CommandItem
                  key={member.id}
                  value={member.name}
                  onSelect={() => {
                    onChange(member.id);
                    setOpen(false);
                  }}
                >
                  <MiniAvatar name={member.name} />
                  <span className="ml-2">{member.name}</span>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === member.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function MiniAvatar({ name }: { name: string }) {
  const colors = [
    "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#ef4444",
    "#f97316", "#22c55e", "#14b8a6", "#3b82f6",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = colors[Math.abs(hash) % colors.length] ?? "#6366f1";

  return (
    <div
      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
      style={{ backgroundColor: color }}
    >
      {getInitials(name)}
    </div>
  );
}

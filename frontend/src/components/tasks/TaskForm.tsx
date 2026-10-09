"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AssigneePicker from "@/components/members/AssigneePicker";
import { TASK_STATUS_ORDER, TASK_PRIORITY_ORDER, TASK_STATUS_CONFIG, TASK_PRIORITY_CONFIG } from "@/lib/constants";
import type { Task, TaskStatus, TaskPriority } from "@/types";

const taskSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().max(500),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"] as const),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"] as const),
  assigneeId: z.string().nullable(),
  dueDate: z.string().nullable(),
});

export type TaskFormValues = z.infer<typeof taskSchema>;

interface TaskFormProps {
  defaultValues?: Partial<Task>;
  onSubmit: (values: TaskFormValues) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  teamId: string;
}

export default function TaskForm({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading,
  teamId,
}: TaskFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      description: defaultValues?.description ?? "",
      status: defaultValues?.status ?? "TODO",
      priority: defaultValues?.priority ?? "MEDIUM",
      assigneeId: defaultValues?.assigneeId ?? null,
      dueDate: defaultValues?.dueDate
        ? new Date(defaultValues.dueDate).toISOString().split("T")[0] ?? null
        : null,
    },
  });

  const assigneeId = watch("assigneeId");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">Title</Label>
        <Input id="title" placeholder="Task title" {...register("title")} />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Add details…"
          rows={3}
          {...register("description")}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>Status</Label>
          <Select
            defaultValue={defaultValues?.status ?? "TODO"}
            onValueChange={(v) => setValue("status", v as TaskStatus)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TASK_STATUS_ORDER.map((s) => (
                <SelectItem key={s} value={s}>
                  {TASK_STATUS_CONFIG[s].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Priority</Label>
          <Select
            defaultValue={defaultValues?.priority ?? "MEDIUM"}
            onValueChange={(v) => setValue("priority", v as TaskPriority)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TASK_PRIORITY_ORDER.map((p) => (
                <SelectItem key={p} value={p}>
                  {TASK_PRIORITY_CONFIG[p].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Assignee</Label>
        <AssigneePicker
          teamId={teamId}
          value={assigneeId}
          onChange={(id) => setValue("assigneeId", id)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="dueDate">Due date</Label>
        <Input id="dueDate" type="date" {...register("dueDate")} />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}

import { api } from "@/lib/data/api-client";
import type { Task, CreateTaskInput, UpdateTaskInput, TaskStatus } from "@/types";

interface BackendTask {
  id: number;
  title: string;
  description: string;
  status: string;
  teamId: number;
  assigneeId: number | null;
  createdAt: string;
  updatedAt: string;
}

function toTask(b: BackendTask): Task {
  return {
    id: String(b.id),
    teamId: String(b.teamId),
    title: b.title,
    description: b.description ?? "",
    status: b.status as TaskStatus,
    priority: "MEDIUM",
    assigneeId: b.assigneeId != null ? String(b.assigneeId) : null,
    createdById: "",
    dueDate: null,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
    completedAt: b.status === "DONE" ? b.updatedAt : null,
  };
}

export async function getTasksByTeam(teamId: string): Promise<Task[]> {
  const data = await api.get<BackendTask[]>("/api/tasks", { params: { teamId } });
  return data.map(toTask);
}

export async function getTaskById(id: string): Promise<Task | null> {
  try {
    const data = await api.get<BackendTask>(`/api/tasks/${id}`);
    return toTask(data);
  } catch {
    return null;
  }
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const data = await api.post<BackendTask>("/api/tasks", {
    title: input.title,
    description: input.description,
    teamId: Number(input.teamId),
  });
  return toTask(data);
}

export async function updateTask(id: string, teamId: string, input: UpdateTaskInput): Promise<Task> {
  const data = await api.put<BackendTask>(`/api/tasks/${id}`, {
    title: input.title,
    description: input.description,
    teamId: Number(teamId),
  });
  const task = toTask(data);
  if (input.assigneeId !== undefined) {
    const assigned = await api.put<BackendTask>(`/api/tasks/${id}/assign`, {
      assigneeId: input.assigneeId ? Number(input.assigneeId) : null,
    });
    return toTask(assigned);
  }
  return task;
}

export function deleteTask(id: string): Promise<void> {
  return api.delete<void>(`/api/tasks/${id}`);
}

export async function changeTaskStatus(id: string, status: TaskStatus): Promise<Task> {
  const data = await api.put<BackendTask>(`/api/tasks/${id}/status`, { status });
  return toTask(data);
}

export async function assignTask(id: string, assigneeId: string): Promise<Task> {
  const data = await api.put<BackendTask>(`/api/tasks/${id}/assign`, {
    assigneeId: Number(assigneeId),
  });
  return toTask(data);
}

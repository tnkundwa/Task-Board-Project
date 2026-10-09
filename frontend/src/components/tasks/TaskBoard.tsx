'use client'

import { useEffect, useState } from 'react'
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import TaskColumn from './TaskColumn'
import TaskForm, { type TaskFormValues } from './TaskForm'
import TaskDetailSheet from './TaskDetailSheet'
import TaskFilterBar from './TaskFilterBar'
import TaskCard from './TaskCard'
import { useTasksStore } from '@/stores/tasks.store'
import { useMembersStore } from '@/stores/members.store'
import { useUIStore } from '@/stores/ui.store'
import { TASK_STATUS_ORDER, CURRENT_USER_ID } from '@/lib/constants'
import type { Task, TaskStatus } from '@/types'

interface TaskBoardProps {
  teamId: string
  teamName: string
}

export default function TaskBoard({ teamId, teamName }: TaskBoardProps) {
  const { tasksByTeam, loading, fetchTasksByTeam, changeStatus, createTask } =
    useTasksStore()
  const { fetchMembersByTeam, fetchMembers } = useMembersStore()
  const { taskFilters } = useUIStore()

  const [createOpen, setCreateOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [draggingTask, setDraggingTask] = useState<Task | null>(null)

  useEffect(() => {
    fetchTasksByTeam(teamId)
    fetchMembersByTeam(teamId)
    fetchMembers()
  }, [teamId, fetchTasksByTeam, fetchMembersByTeam, fetchMembers])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
  )

  const allTasks = tasksByTeam[teamId] ?? []

  const filteredTasks = allTasks.filter((task) => {
    if (
      taskFilters.search &&
      !task.title.toLowerCase().includes(taskFilters.search.toLowerCase()) &&
      !task.description.toLowerCase().includes(taskFilters.search.toLowerCase())
    ) {
      return false
    }
    if (taskFilters.assigneeId && task.assigneeId !== taskFilters.assigneeId)
      return false
    if (taskFilters.priority && task.priority !== taskFilters.priority)
      return false
    return true
  })

  const tasksByStatus = TASK_STATUS_ORDER.reduce(
    (acc, status) => {
      acc[status] = filteredTasks.filter((t) => t.status === status)
      return acc
    },
    {} as Record<TaskStatus, typeof filteredTasks>,
  )

  async function handleCreateSubmit(values: TaskFormValues) {
    setIsCreating(true)
    try {
      await createTask({
        teamId,
        title: values.title,
        description: values.description,
        status: values.status,
        priority: values.priority,
        assigneeId: values.assigneeId,
        createdById: CURRENT_USER_ID,
        dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : null,
      })
      toast.success('Task created')
      setCreateOpen(false)
    } catch {
      toast.error('Failed to create task')
    } finally {
      setIsCreating(false)
    }
  }

  function handleDragStart(event: { active: { id: string | number } }) {
    const task = allTasks.find((t) => t.id === event.active.id)
    setDraggingTask(task ?? null)
  }

  async function handleDragEnd(event: DragEndEvent) {
    setDraggingTask(null)
    const { active, over } = event
    if (!over) return

    const taskId = active.id as string
    const newStatus = over.id as TaskStatus

    if (!TASK_STATUS_ORDER.includes(newStatus)) return

    const task = allTasks.find((t) => t.id === taskId)
    if (!task || task.status === newStatus) return

    await changeStatus(taskId, teamId, newStatus)
  }

  if (loading && allTasks.length === 0) {
    return (
      <div className='flex flex-col gap-4 p-6'>
        <Skeleton className='h-8 w-48' />
        <div className='grid grid-cols-3 gap-4'>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className='flex flex-col gap-2'>
              <Skeleton className='h-10 rounded-lg' />
              {Array.from({ length: 3 }).map((_, j) => (
                <Skeleton key={j} className='h-24 rounded-lg' />
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-4 p-6 h-full'>
      {/* Board header */}
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-semibold'>{teamName}</h1>
        <Button size='sm' onClick={() => setCreateOpen(true)}>
          <Plus className='mr-1.5 h-4 w-4' /> New task
        </Button>
      </div>

      {/* Filters */}
      <TaskFilterBar />

      {/* Kanban columns */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className='grid grid-cols-1 gap-4 md:grid-cols-3 flex-1 min-h-0'>
          {TASK_STATUS_ORDER.map((status) => (
            <TaskColumn
              key={status}
              status={status}
              tasks={tasksByStatus[status] ?? []}
              onCreateTask={() => setCreateOpen(true)}
            />
          ))}
        </div>
        <DragOverlay>
          {draggingTask ? (
            <div className='rotate-2 opacity-90'>
              <TaskCard task={draggingTask} isDragOverlay />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Detail sheet + edit dialog */}
      <TaskDetailSheet teamId={teamId} />

      {/* Create task dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className='max-w-lg'>
          <DialogHeader>
            <DialogTitle>New task</DialogTitle>
          </DialogHeader>
          <TaskForm
            onSubmit={handleCreateSubmit}
            onCancel={() => setCreateOpen(false)}
            isLoading={isCreating}
            teamId={teamId}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

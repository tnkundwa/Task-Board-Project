'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Pencil, Trash2, Calendar, User, Flag } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import TaskStatusBadge from './TaskStatusBadge'
import TaskPriorityIcon from './TaskPriorityIcon'
import TaskForm, { type TaskFormValues } from './TaskForm'
import { useTasksStore } from '@/stores/tasks.store'
import { useMembersStore } from '@/stores/members.store'
import { useUIStore } from '@/stores/ui.store'
import {
  formatDate,
  formatRelativeDate,
  getDueDateStatus,
  cn,
} from '@/lib/utils'

interface TaskDetailSheetProps {
  teamId: string
}

export default function TaskDetailSheet({ teamId }: TaskDetailSheetProps) {
  const { viewTaskId, closeViewTaskSheet } = useUIStore()
  const { tasksByTeam, deleteTask, updateTask } = useTasksStore()
  const { members } = useMembersStore()
  const [deleting, setDeleting] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  // Find task across all teams
  const task = viewTaskId
    ? (Object.values(tasksByTeam)
        .flat()
        .find((t) => t.id === viewTaskId) ?? null)
    : null

  const assignee = task?.assigneeId
    ? members.find((m) => m.id === task.assigneeId)
    : null
  const createdBy = task?.createdById
    ? members.find((m) => m.id === task.createdById)
    : null
  const dueDateStatus = getDueDateStatus(task?.dueDate)

  async function handleDelete() {
    if (!task) return
    if (!confirm('Delete this task?')) return
    setDeleting(true)
    try {
      await deleteTask(task.id, task.teamId)
      toast.success('Task deleted')
      closeViewTaskSheet()
    } catch {
      toast.error('Failed to delete task')
    } finally {
      setDeleting(false)
    }
  }

  async function handleEditSubmit(values: TaskFormValues) {
    if (!task) return
    setIsEditing(true)
    try {
      await updateTask(task.id, task.teamId, {
        title: values.title,
        description: values.description,
        status: values.status,
        priority: values.priority,
        assigneeId: values.assigneeId,
        dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : null,
      })
      toast.success('Task updated')
      setEditOpen(false)
    } catch {
      toast.error('Failed to update task')
    } finally {
      setIsEditing(false)
    }
  }

  return (
    <>
      <Sheet
        open={!!viewTaskId}
        onOpenChange={(open) => !open && closeViewTaskSheet()}
      >
        <SheetContent className='w-[400px] sm:w-[480px] overflow-y-auto px-4'>
          {task ? (
            <>
              <SheetHeader className='mb-4'>
                <div className='flex items-start justify-between gap-2 pr-8'>
                  <SheetTitle className='text-left leading-snug'>
                    {task.title}
                  </SheetTitle>
                  <div className='flex items-center gap-1 shrink-0'>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='h-7 w-7'
                      onClick={() => setEditOpen(true)}
                    >
                      <Pencil className='h-3.5 w-3.5' />
                    </Button>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='h-7 w-7 text-destructive hover:text-destructive'
                      onClick={handleDelete}
                      disabled={deleting}
                    >
                      <Trash2 className='h-3.5 w-3.5' />
                    </Button>
                  </div>
                </div>
              </SheetHeader>

              <div className='flex flex-col gap-4'>
                <div className='flex flex-wrap gap-2'>
                  <TaskStatusBadge status={task.status} />
                  <TaskPriorityIcon priority={task.priority} showLabel />
                </div>

                {task.description && (
                  <div>
                    <p className='text-sm text-muted-foreground leading-relaxed'>
                      {task.description}
                    </p>
                  </div>
                )}

                <Separator />

                <div className='flex flex-col gap-3 text-sm'>
                  {assignee && (
                    <div className='flex items-center gap-3'>
                      <User className='h-4 w-4 text-muted-foreground shrink-0' />
                      <div>
                        <p className='text-xs text-muted-foreground'>
                          Assignee
                        </p>
                        <p className='font-medium'>{assignee.name}</p>
                      </div>
                    </div>
                  )}

                  {task.dueDate && (
                    <div className='flex items-center gap-3'>
                      <Calendar className='h-4 w-4 text-muted-foreground shrink-0' />
                      <div>
                        <p className='text-xs text-muted-foreground'>
                          Due date
                        </p>
                        <p
                          className={cn(
                            'font-medium',
                            dueDateStatus === 'overdue' && 'text-red-600',
                            dueDateStatus === 'due-today' && 'text-orange-600',
                          )}
                        >
                          {formatDate(task.dueDate)}
                          {dueDateStatus === 'overdue' && ' — Overdue'}
                          {dueDateStatus === 'due-today' && ' — Today'}
                        </p>
                      </div>
                    </div>
                  )}

                  {createdBy && (
                    <div className='flex items-center gap-3'>
                      <Flag className='h-4 w-4 text-muted-foreground shrink-0' />
                      <div>
                        <p className='text-xs text-muted-foreground'>
                          Created by
                        </p>
                        <p className='font-medium'>{createdBy.name}</p>
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                <div className='flex flex-col gap-1 text-xs text-muted-foreground'>
                  <p>Created {formatRelativeDate(task.createdAt)}</p>
                  <p>Updated {formatRelativeDate(task.updatedAt)}</p>
                  {task.completedAt && (
                    <p>Completed {formatRelativeDate(task.completedAt)}</p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className='flex h-full items-center justify-center'>
              <p className='text-muted-foreground'>Task not found</p>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {task && (
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className='max-w-lg'>
            <DialogHeader>
              <DialogTitle>Edit task</DialogTitle>
            </DialogHeader>
            <TaskForm
              defaultValues={task}
              onSubmit={handleEditSubmit}
              onCancel={() => setEditOpen(false)}
              isLoading={isEditing}
              teamId={teamId}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

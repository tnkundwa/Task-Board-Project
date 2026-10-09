'use client'

import { useEffect } from 'react'
import { Bell } from 'lucide-react'
import Link from 'next/link'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button, buttonVariants } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import NotificationList from './NotificationList'
import { useNotificationsStore } from '@/stores/notifications.store'
import { useUIStore } from '@/stores/ui.store'
import { cn } from '@/lib/utils'

export default function NotificationBell() {
  const { unreadCount, startPolling } = useNotificationsStore()
  const { notificationSheetOpen, setNotificationSheetOpen } = useUIStore()

  useEffect(() => {
    return startPolling()
  }, [startPolling])

  return (
    <>
      <Button
        variant='ghost'
        size='icon'
        className='relative'
        onClick={() => setNotificationSheetOpen(true)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell className='h-4 w-4' />
        {unreadCount > 0 && (
          <span
            className={cn(
              'absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground',
            )}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      <Sheet
        open={notificationSheetOpen}
        onOpenChange={setNotificationSheetOpen}
      >
        <SheetContent className='w-[380px] p-0'>
          <SheetHeader className='border-b px-4 py-3'>
            <div className='flex items-center justify-between px-4'>
              <SheetTitle>Notifications</SheetTitle>
              <Link
                href='/notifications'
                onClick={() => setNotificationSheetOpen(false)}
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'sm' }),
                  'text-xs h-7 pr-6',
                )}
              >
                View all
              </Link>
            </div>
          </SheetHeader>
          <ScrollArea className='h-[calc(100vh-4rem)]'>
            <div className='p-2'>
              <NotificationList />
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  )
}

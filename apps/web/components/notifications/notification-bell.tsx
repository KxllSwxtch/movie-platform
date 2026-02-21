'use client';

import { useState } from 'react';
import { Bell } from '@phosphor-icons/react';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useUnreadCount } from '@/hooks/use-notifications';
import { useNotificationSocket } from '@/hooks/use-notification-socket';

import { NotificationDropdown } from './notification-dropdown';

/**
 * Notification bell button with unread count badge
 * Opens a popover dropdown with recent notifications
 * Connects to WebSocket for real-time updates
 */
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data } = useUnreadCount();
  const unreadCount = data?.count ?? 0;

  // Connect to notification WebSocket for real-time updates
  useNotificationSocket();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Уведомления"
          className="relative text-mp-text-secondary hover:text-mp-text-primary"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span
              className={cn(
                'absolute flex items-center justify-center',
                'bg-mp-accent-tertiary text-white rounded-full',
                'font-semibold leading-none',
                unreadCount > 9
                  ? 'top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 text-[10px]'
                  : 'top-1 right-1 w-[16px] h-[16px] text-[10px]'
              )}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="p-0 border border-mp-border bg-mp-bg-secondary rounded-xl shadow-2xl shadow-black/40 overflow-hidden"
      >
        <NotificationDropdown onClose={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}

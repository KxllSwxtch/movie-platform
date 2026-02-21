'use client';

import Link from 'next/link';
import { ArrowRight } from '@phosphor-icons/react';
import { CheckCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useNotifications, useMarkAllAsRead } from '@/hooks/use-notifications';

import { NotificationItem } from './notification-item';

// =============================================================================
// Skeleton Loader
// =============================================================================

function NotificationSkeleton() {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-2.5 w-16" />
      </div>
    </div>
  );
}

// =============================================================================
// Component
// =============================================================================

interface NotificationDropdownProps {
  onClose?: () => void;
}

/**
 * Notification dropdown content displayed inside the popover
 * Shows a list of recent notifications with header and footer
 */
export function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  const { data, isLoading } = useNotifications(1, 10);
  const markAllAsRead = useMarkAllAsRead();

  const notifications = data?.items ?? [];
  const hasUnread = notifications.some((n) => !n.isRead);
  const isEmpty = !isLoading && notifications.length === 0;

  function handleMarkAllRead() {
    markAllAsRead.mutate();
  }

  return (
    <div className="w-[380px] max-w-[calc(100vw-2rem)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-mp-border">
        <h3 className="text-sm font-semibold text-mp-text-primary">
          Уведомления
        </h3>
        {hasUnread && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={markAllAsRead.isPending}
            className="h-auto py-1 px-2 text-xs text-mp-accent-secondary hover:text-mp-accent-secondary/80 hover:bg-transparent"
          >
            <CheckCheck className="w-3.5 h-3.5 mr-1" />
            Прочитать все
          </Button>
        )}
      </div>

      {/* Content */}
      <ScrollArea className="max-h-[400px]">
        {/* Loading state */}
        {isLoading && (
          <div className="divide-y divide-mp-border/50">
            {Array.from({ length: 4 }).map((_, i) => (
              <NotificationSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {isEmpty && (
          <div className="flex flex-col items-center justify-center py-10 px-4">
            <div className="w-12 h-12 rounded-full bg-mp-surface-elevated flex items-center justify-center mb-3">
              <CheckCheck className="w-6 h-6 text-mp-text-disabled" />
            </div>
            <p className="text-sm text-mp-text-secondary">
              Нет новых уведомлений
            </p>
          </div>
        )}

        {/* Notification list */}
        {!isLoading && notifications.length > 0 && (
          <div className="divide-y divide-mp-border/50">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onNavigate={onClose}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      {!isEmpty && (
        <div className="border-t border-mp-border px-4 py-2.5">
          <Link
            href="/account/notifications"
            onClick={onClose}
            className={cn(
              'flex items-center justify-center gap-1.5',
              'text-xs font-medium text-mp-accent-secondary',
              'hover:text-mp-accent-secondary/80 transition-colors'
            )}
          >
            Все уведомления
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}

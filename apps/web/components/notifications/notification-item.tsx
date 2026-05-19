"use client";

import Link from "next/link";
import { Bell, CreditCard, Gift, Gear, Trash } from "@phosphor-icons/react";
import { Film, Megaphone, Users } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  useMarkAsRead,
  useDeleteNotification,
} from "@/hooks/use-notifications";
import type { Notification, NotificationType } from "@/hooks/use-notifications";

import { resolveNotificationHref } from "./notification-utils";

// =============================================================================
// Helpers
// =============================================================================

/**
 * Format a date into a Russian relative time string
 */
function formatRelativeTimeRu(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);

  if (diffSeconds < 60) {
    return "только что";
  }

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `${diffMinutes} мин назад`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} ч назад`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) {
    return "вчера";
  }
  if (diffDays < 7) {
    return `${diffDays} дн назад`;
  }

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 4) {
    return `${diffWeeks} нед назад`;
  }

  // For older dates, show the date
  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
  });
}

/**
 * Get icon component for notification type
 */
function getNotificationIcon(type: NotificationType) {
  const iconMap: Record<
    NotificationType,
    React.ComponentType<{ className?: string }>
  > = {
    SYSTEM: Gear,
    PAYMENT: CreditCard,
    SUBSCRIPTION: Film,
    CONTENT: Film,
    PARTNER: Users,
    BONUS: Gift,
    PROMO: Megaphone,
  };

  return iconMap[type] || Bell;
}

/**
 * Get icon color for notification type
 */
function getNotificationIconColor(type: NotificationType): string {
  const colorMap: Record<NotificationType, string> = {
    SYSTEM: "text-mp-text-secondary",
    PAYMENT: "text-mp-accent-secondary",
    SUBSCRIPTION: "text-mp-accent-primary",
    CONTENT: "text-mp-accent-primary",
    PARTNER: "text-blue-400",
    BONUS: "text-yellow-400",
    PROMO: "text-mp-accent-tertiary",
  };

  return colorMap[type] || "text-mp-text-secondary";
}

// =============================================================================
// Component
// =============================================================================

interface NotificationItemProps {
  notification: Notification;
  onNavigate?: () => void;
  showDelete?: boolean;
}

/**
 * Single notification item in the dropdown list
 * Shows icon, title, body (truncated), and relative time
 * Unread notifications have a left accent border and different background
 */
export function NotificationItem({
  notification,
  onNavigate,
  showDelete = false,
}: NotificationItemProps) {
  const markAsRead = useMarkAsRead();
  const deleteNotification = useDeleteNotification();

  const Icon = getNotificationIcon(notification.type);
  const iconColor = getNotificationIconColor(notification.type);
  const relativeTime = formatRelativeTimeRu(notification.createdAt);
  const href = resolveNotificationHref(notification);

  function handleClick() {
    if (!notification.isRead) {
      markAsRead.mutate(notification.id);
    }
    if (href && onNavigate) {
      onNavigate();
    }
  }

  function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    deleteNotification.mutate(notification.id);
  }

  const content = (
    <>
      {/* Icon */}
      <div
        className={cn(
          "flex-shrink-0 mt-0.5 w-9 h-9 rounded-lg flex items-center justify-center",
          "bg-mp-surface-elevated",
        )}
      >
        <Icon className={cn("w-4 h-4", iconColor)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        <p
          className={cn(
            "text-sm leading-snug break-words",
            notification.isRead
              ? "text-mp-text-secondary font-normal"
              : "text-mp-text-primary font-medium",
          )}
        >
          {notification.title}
        </p>
        <p className="text-xs leading-relaxed text-mp-text-secondary line-clamp-3 break-words">
          {notification.body}
        </p>
        <p className="text-[11px] text-mp-text-disabled">{relativeTime}</p>
      </div>

      {/* Delete button (visible on hover) or unread dot */}
      <div className="flex-shrink-0 mt-2">
        {showDelete ? (
          <button
            type="button"
            onClick={handleDelete}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-mp-accent-tertiary/20"
            aria-label="Удалить уведомление"
          >
            <Trash className="w-3.5 h-3.5 text-mp-text-disabled hover:text-mp-accent-tertiary" />
          </button>
        ) : !notification.isRead ? (
          <span className="block w-2 h-2 rounded-full bg-mp-accent-primary" />
        ) : null}
      </div>
    </>
  );

  const itemClassName = cn(
    "group w-full flex items-start gap-3.5 px-4 py-3.5 sm:px-5 text-left transition-colors",
    "hover:bg-mp-surface-elevated/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mp-accent-primary/50",
    href ? "cursor-pointer" : "cursor-default",
    notification.isRead
      ? "bg-transparent"
      : "bg-mp-surface/60 border-l-2 border-l-mp-accent-primary",
  );

  if (href) {
    return (
      <Link href={href} onClick={handleClick} className={itemClassName}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={handleClick} className={itemClassName}>
      {content}
    </button>
  );
}

import type { Notification } from "@/hooks/use-notifications";

const UNAVAILABLE_STATUSES = new Set([
  "ARCHIVED",
  "DELETED",
  "INACCESSIBLE",
  "RESTRICTED",
  "UNAVAILABLE",
]);

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function asBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

export function getNotificationContentId(
  notification: Notification,
): string | undefined {
  const metadata = notification.metadata ?? {};
  return (
    asString(metadata.contentId) ??
    asString(metadata.contentID) ??
    asString(metadata.entityId) ??
    asString(metadata.moderationRequestId)
  );
}

export function isModerationNotification(notification: Notification): boolean {
  const metadata = notification.metadata ?? {};
  const action =
    asString(metadata.moderationAction) ?? asString(metadata.action);
  const status = asString(metadata.status) ?? asString(metadata.contentStatus);
  const semanticType =
    asString(metadata.notificationType) ??
    asString(metadata.type) ??
    asString(notification.type);

  return Boolean(
    getNotificationContentId(notification) &&
    (semanticType?.toUpperCase().includes("MODERATION") ||
      action?.toUpperCase().includes("MODERATION") ||
      action === "submitted_for_moderation" ||
      status === "PENDING"),
  );
}

export function resolveNotificationHref(
  notification: Notification,
): string | undefined {
  const metadata = notification.metadata ?? {};
  const explicitHref =
    notification.link ?? asString(metadata.link) ?? asString(metadata.path);
  if (explicitHref) return explicitHref;

  const contentId = getNotificationContentId(notification);
  if (contentId && isModerationNotification(notification)) {
    return `/admin/content/${contentId}`;
  }

  return undefined;
}

export function isUnavailableContentNotification(
  notification: Notification,
): boolean {
  if (isModerationNotification(notification)) return false;

  const metadata = notification.metadata ?? {};
  const status = (
    asString(metadata.contentStatus) ??
    asString(metadata.status) ??
    asString(metadata.availabilityStatus)
  )?.toUpperCase();

  const isContentNotification =
    notification.type === "CONTENT" ||
    Boolean(getNotificationContentId(notification));

  return Boolean(
    isContentNotification &&
    ((status && UNAVAILABLE_STATUSES.has(status)) ||
      asBoolean(metadata.contentDeleted) === true ||
      asBoolean(metadata.deleted) === true ||
      asBoolean(metadata.unavailable) === true ||
      asBoolean(metadata.inaccessible) === true ||
      asBoolean(metadata.restricted) === true ||
      asBoolean(metadata.contentExists) === false),
  );
}

"use client";

import Link from "next/link";

import { UserAvatar } from "@/components/ui/avatar";
import {
  normalizeCreatorIdentity,
  type CreatorInput,
} from "@/lib/author-identity";
import { normalizeMediaUrl } from "@/lib/media-url";
import { cn } from "@/lib/utils";

interface AuthorInlineLinkProps {
  creator: CreatorInput;
  className?: string;
  avatarSize?: "xs" | "sm";
  showUsername?: boolean;
}

export function AuthorInlineLink({
  creator,
  className,
  avatarSize = "xs",
  showUsername = false,
}: AuthorInlineLinkProps) {
  const identity = normalizeCreatorIdentity(creator);
  if (!identity) return null;

  const avatarSrc = identity.avatarUrl
    ? normalizeMediaUrl(identity.avatarUrl)
    : null;

  const content = (
    <>
      <UserAvatar
        size={avatarSize}
        src={avatarSrc}
        name={identity.displayName}
        className="bg-mp-surface-2"
      />
      <span className="min-w-0">
        <span className="block truncate">{identity.displayName}</span>
        {showUsername && identity.username ? (
          <span className="block truncate text-xs text-mp-text-tertiary">
            @{identity.username}
          </span>
        ) : null}
      </span>
    </>
  );

  const baseClass = cn(
    "inline-flex min-w-0 items-center gap-2 text-sm text-mp-text-secondary transition-colors hover:text-mp-accent-primary",
    className,
  );

  if (!identity.href) {
    return <span className={baseClass}>{content}</span>;
  }

  return (
    <Link
      href={identity.href}
      className={baseClass}
      aria-label={`Открыть профиль автора ${identity.displayName}`}
    >
      {content}
    </Link>
  );
}

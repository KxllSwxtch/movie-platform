"use client";

import { Eye, FilmStrip, UserCheck } from "@phosphor-icons/react";
import Link from "next/link";

import { UserAvatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  normalizeCreatorIdentity,
  type CreatorInput,
} from "@/lib/author-identity";
import { normalizeMediaUrl } from "@/lib/media-url";
import { cn, formatNumber, formatViewCount } from "@/lib/utils";

interface CreatorChannelBlockProps {
  creator: CreatorInput;
  className?: string;
  label?: string;
}

export function CreatorChannelBlock({
  creator,
  className,
  label = "Автор",
}: CreatorChannelBlockProps) {
  const identity = normalizeCreatorIdentity(creator);
  if (!identity) return null;

  const avatarSrc = identity.avatarUrl
    ? normalizeMediaUrl(identity.avatarUrl)
    : null;
  const profileLabel = identity.href ? "Открыть профиль" : "Профиль";

  const identityContent = (
    <>
      <UserAvatar
        size="lg"
        src={avatarSrc}
        name={identity.displayName}
        className="h-12 w-12 bg-mp-surface-2 ring-1 ring-mp-border"
      />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-semibold text-mp-text-primary">
            {identity.displayName}
          </p>
          {identity.role ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-mp-border px-2 py-0.5 text-xs text-mp-text-secondary">
              <UserCheck className="h-3 w-3" />
              {identity.role}
            </span>
          ) : null}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-mp-text-secondary">
          {identity.username ? <span>@{identity.username}</span> : null}
          {identity.totalVideos !== undefined ? (
            <span className="inline-flex items-center gap-1">
              <FilmStrip className="h-3.5 w-3.5" />
              {formatNumber(identity.totalVideos)} видео
            </span>
          ) : null}
          {identity.totalViews !== undefined ? (
            <span className="inline-flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {formatViewCount(identity.totalViews)}
            </span>
          ) : null}
        </div>
      </div>
    </>
  );

  return (
    <section
      className={cn(
        "mb-8 flex flex-col gap-4 border-y border-mp-border py-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
      aria-label={label}
    >
      {identity.href ? (
        <Link
          href={identity.href}
          className="flex min-w-0 items-center gap-3 rounded-lg transition-colors hover:text-mp-accent-primary"
          aria-label={`Открыть профиль автора ${identity.displayName}`}
        >
          {identityContent}
        </Link>
      ) : (
        <div className="flex min-w-0 items-center gap-3">{identityContent}</div>
      )}

      {identity.href ? (
        <Button variant="outline" size="sm" asChild>
          <Link href={identity.href}>{profileLabel}</Link>
        </Button>
      ) : null}
    </section>
  );
}

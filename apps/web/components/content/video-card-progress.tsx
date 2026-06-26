"use client";

import { Play } from "@phosphor-icons/react";
import Link from "next/link";
import { memo } from "react";

import { ContentImage } from "@/components/content/content-image";
import { HoverVideoPreview } from "@/components/content/hover-video-preview";
import { ProgressBar } from "@/components/ui/progress-bar";
import { getPublicContentPath } from "@/lib/public-content-url";
import { cn } from "@/lib/utils";

export interface VideoProgressContent {
  id: string;
  slug?: string;
  contentType?: string;
  title: string;
  year?: number;
  thumbnailUrl: string;
  /** Progress percentage (0-100) */
  progress: number;
  /** Current playback position and duration, in seconds. */
  currentTime: number;
  duration?: number;
}

interface VideoCardProgressProps {
  content: VideoProgressContent;
  className?: string;
}

/**
 * Format remaining time
 */
export function isValidNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function safeProgressPercent(
  currentTime: unknown,
  duration: unknown,
): number {
  if (!isValidNumber(duration) || duration <= 0) return 0;

  const safeCurrentTime = isValidNumber(currentTime) ? currentTime : 0;
  return Math.min(100, Math.max(0, (safeCurrentTime / duration) * 100));
}

export function formatRemainingTime(
  currentTime: unknown,
  duration: unknown,
): string | null {
  if (!isValidNumber(duration) || duration <= 0) return null;

  const safeCurrentTime = isValidNumber(currentTime) ? currentTime : 0;
  const remainingSeconds = Math.max(0, duration - Math.max(0, safeCurrentTime));
  if (remainingSeconds <= 0) return null;

  const minutes = Math.ceil(remainingSeconds / 60);
  if (minutes < 60) {
    return `осталось ${minutes} мин`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `осталось ${hours} ч ${mins} мин` : `осталось ${hours} ч`;
}

/**
 * Video card with progress bar matching Figma "Continue Watch" design
 */
export const VideoCardProgress = memo(function VideoCardProgress({
  content,
  className,
}: VideoCardProgressProps) {
  const progress = safeProgressPercent(content.currentTime, content.duration);
  const remainingTime = formatRemainingTime(
    content.currentTime,
    content.duration,
  );
  const isShort = (content.contentType || "").toUpperCase() === "SHORT";
  const href = isShort ? getPublicContentPath(content) : `/watch/${content.id}`;

  return (
    <article
      className={cn(
        "group block w-[82vw] shrink-0 transition-transform duration-200 active:scale-[0.985] sm:w-[280px] md:w-[308px] md:transition-none md:active:scale-100",
        className,
      )}
    >
      {/* Thumbnail container */}
      <div className="relative mb-0 aspect-video overflow-hidden rounded-[22px] bg-mp-surface shadow-[0_18px_46px_rgba(0,0,0,0.42)] md:mb-3 md:rounded-xl md:shadow-none">
        {/* Image */}
        <ContentImage
          src={content.thumbnailUrl}
          alt={content.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105 md:duration-300"
          sizes="(max-width: 640px) 75vw, 308px"
          fallbackClassName="w-full h-full bg-mp-surface-elevated"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/20 to-transparent md:hidden" />

        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-100 transition-opacity duration-200 md:opacity-0 md:touch:opacity-80 md:hover-hover:group-hover:opacity-100">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/80 bg-black/30 shadow-[0_0_28px_rgba(255,255,255,0.18)] backdrop-blur-sm md:h-12 md:w-12 md:border-0 md:bg-white/90 md:shadow-lg md:touch:h-10 md:touch:w-10">
            <Play
              className="ml-0.5 h-6 w-6 text-white md:h-5 md:w-5 md:text-mp-bg-primary"
              weight="fill"
            />
          </div>
        </div>

        <div className="absolute bottom-4 left-4 right-4 z-10 md:hidden">
          <h3 className="line-clamp-1 text-[18px] font-extrabold leading-tight tracking-[-0.035em] text-white">
            {content.title}
          </h3>
          {remainingTime ? (
            <span className="mt-2 block text-[12px] font-semibold text-white/78">
              {remainingTime}
            </span>
          ) : null}
        </div>

        {/* Progress bar at bottom */}
        <div className="absolute bottom-0 left-0 right-0 z-20">
          <ProgressBar
            value={progress}
            size="sm"
            variant="gradient"
            className="rounded-none"
          />
        </div>
        <HoverVideoPreview
          contentId={content.id}
          title={content.title}
          href={href}
        />
        <Link
          href={href}
          className="absolute inset-0 z-10"
          aria-label={content.title}
        />
      </div>

      {/* Content info */}
      <div className="hidden items-start justify-between gap-2 md:flex">
        <div className="min-w-0">
          <Link
            href={href}
            className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#55b7ff]"
          >
            <h3 className="truncate text-base font-medium text-white transition-colors group-hover:text-mp-accent-primary">
              {content.title}
            </h3>
          </Link>
          {content.year ? (
            <p className="text-sm text-mp-text-secondary">{content.year}</p>
          ) : null}
        </div>
        {remainingTime ? (
          <span className="shrink-0 whitespace-nowrap text-sm text-mp-text-secondary">
            {remainingTime}
          </span>
        ) : null}
      </div>
    </article>
  );
});

'use client';

import { Play } from '@phosphor-icons/react';
import Link from 'next/link';
import { memo } from 'react';

import { ContentImage } from '@/components/content/content-image';
import { HoverVideoPreview } from '@/components/content/hover-video-preview';
import { ProgressBar } from '@/components/ui/progress-bar';
import { cn } from '@/lib/utils';

export interface VideoProgressContent {
  id: string;
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
  return typeof value === 'number' && Number.isFinite(value);
}

export function safeProgressPercent(currentTime: unknown, duration: unknown): number {
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
export const VideoCardProgress = memo(function VideoCardProgress({ content, className }: VideoCardProgressProps) {
  const progress = safeProgressPercent(content.currentTime, content.duration);
  const remainingTime = formatRemainingTime(content.currentTime, content.duration);

  return (
    <article
      className={cn(
        'group block w-[75vw] sm:w-[280px] md:w-[308px] shrink-0',
        className
      )}
    >
      {/* Thumbnail container */}
      <div className="relative aspect-video rounded-xl overflow-hidden bg-mp-surface mb-3">
        {/* Image */}
        <ContentImage
          src={content.thumbnailUrl}
          alt={content.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 75vw, 308px"
          fallbackClassName="w-full h-full bg-mp-surface-elevated"
        />

        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center touch:opacity-80 opacity-0 hover-hover:group-hover:opacity-100 transition-opacity duration-200">
          <div className="w-12 h-12 touch:w-10 touch:h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
            <Play className="w-5 h-5 text-mp-bg-primary ml-0.5" weight="fill" />
          </div>
        </div>

        {/* Progress bar at bottom */}
        <div className="absolute bottom-0 left-0 right-0">
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
          href={`/watch/${content.id}`}
        />
        <Link href={`/watch/${content.id}`} className="absolute inset-0 z-10" aria-label={content.title} />
      </div>

      {/* Content info */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link href={`/watch/${content.id}`} className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#55b7ff]">
            <h3 className="truncate text-base font-medium text-white transition-colors group-hover:text-mp-accent-primary">{content.title}</h3>
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

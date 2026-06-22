"use client";

import { BookOpen, CheckCircle, Play } from "@phosphor-icons/react";
import Link from "next/link";

import { AuthorInlineLink } from "@/components/content/author-inline-link";
import { AgeBadge, type AgeCategory } from "@/components/content/age-badge";
import { ContentImage } from "@/components/content/content-image";
import { HoverVideoPreview } from "@/components/content/hover-video-preview";
import { ProgressBar } from "@/components/ui/progress-bar";
import { RatingBadge } from "@/components/ui/rating-badge";
import type { CreatorInput } from "@/lib/author-identity";
import { cn } from "@/lib/utils";

export interface TutorialContent {
  id: string;
  slug: string;
  title: string;
  thumbnailUrl: string;
  lessonCount: number;
  completedLessons: number;
  ageCategory: AgeCategory;
  category?: string;
  duration?: string;
  instructor?: string;
  creator?: CreatorInput;
  rating?: number;
}

interface TutorialCardProps {
  content: TutorialContent;
  className?: string;
}

function getProgressPercent(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

export function TutorialCard({ content, className }: TutorialCardProps) {
  const progress = getProgressPercent(
    content.completedLessons,
    content.lessonCount,
  );
  const isComplete = progress === 100;

  return (
    <article className={cn("sesh-content-card sesh-tutorial-card group block shrink-0 content-card w-full", className)}>
      <div className="relative mb-3 block aspect-video overflow-hidden rounded-xl bg-mp-surface-2">
        <ContentImage
          src={content.thumbnailUrl}
          alt={content.title}
          fill
          className="object-cover transition-transform duration-500 ease-out-expo group-hover:scale-110"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          fallbackIcon={
            <BookOpen className="w-12 h-12 text-mp-text-disabled" />
          }
        />

        <div className="absolute top-3 left-3 right-3 z-10 flex items-start justify-between">
          <AgeBadge age={content.ageCategory} size="sm" />
          {content.category && (
            <span className="rounded bg-mp-surface/80 px-2 py-1 text-xs text-mp-text-secondary backdrop-blur-sm">
              {content.category}
            </span>
          )}
        </div>

        <div className="absolute bottom-3 left-3 right-3 z-10 flex items-end justify-between gap-2">
          {content.rating !== undefined && content.rating > 0 ? (
            <RatingBadge rating={content.rating} size="sm" />
          ) : (
            <span />
          )}

          {isComplete && (
            <div className="shrink-0">
              <div className="flex items-center gap-1 rounded bg-mp-success-bg/90 px-2 py-1 text-xs font-medium text-mp-success-text backdrop-blur-sm">
                <CheckCircle className="w-3.5 h-3.5" />
                Завершено
              </div>
            </div>
          )}
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity duration-300 touch:opacity-60 hover-hover:group-hover:opacity-100" />

        <div className="absolute inset-0 flex scale-90 items-center justify-center opacity-0 transition-all duration-300 touch:scale-100 touch:opacity-80 hover-hover:group-hover:scale-100 hover-hover:group-hover:opacity-100">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-mp-accent-secondary/90 shadow-glow-secondary backdrop-blur-sm touch:h-11 touch:w-11">
            <Play
              className="ml-0.5 h-6 w-6 text-white touch:h-5 touch:w-5"
              weight="fill"
            />
          </div>
        </div>

        {progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0">
            <ProgressBar
              value={progress}
              size="sm"
              variant={isComplete ? "success" : "default"}
              className="rounded-none"
            />
          </div>
        )}
        <HoverVideoPreview
          contentId={content.id}
          title={content.title}
          href={`/tutorials/${content.slug}`}
        />
        <Link href={`/tutorials/${content.slug}`} className="absolute inset-0 z-10" aria-label={content.title} />
      </div>

      <div>
        <Link href={`/tutorials/${content.slug}`} className="block">
          <h3 className="line-clamp-2 font-medium text-mp-text-primary transition-colors duration-200 group-hover:text-mp-accent-secondary">
            {content.title}
          </h3>
        </Link>
        <AuthorInlineLink
          creator={content.creator}
          className="mt-1 max-w-full"
          showUsername
        />
        <div className="mt-2 flex items-center gap-2 text-sm text-mp-text-secondary">
          <span className="flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            {content.completedLessons}/{content.lessonCount} уроков
          </span>
          {content.duration && (
            <>
              <span>&middot;</span>
              <span>{content.duration}</span>
            </>
          )}
        </div>
        {content.instructor && (
          <p className="mt-1 text-sm text-mp-text-tertiary">
            {content.instructor}
          </p>
        )}
      </div>
    </article>
  );
}

export function TutorialCardProgress({
  content,
  className,
}: TutorialCardProps) {
  const progress = getProgressPercent(
    content.completedLessons,
    content.lessonCount,
  );

  return (
    <article
      className={cn(
        "group flex gap-4 rounded-xl bg-mp-surface p-3 transition-colors hover:bg-mp-surface-2",
        className,
      )}
    >
      <div className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-lg bg-mp-surface-2">
        <ContentImage
          src={content.thumbnailUrl}
          alt={content.title}
          fill
          className="object-cover"
          sizes="128px"
          fallbackIcon={<BookOpen className="w-6 h-6 text-mp-text-disabled" />}
        />

        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity touch:opacity-60 hover-hover:group-hover:opacity-100">
          <Play className="w-6 h-6 text-white" weight="fill" />
        </div>
        <HoverVideoPreview
          contentId={content.id}
          title={content.title}
          href={`/tutorials/${content.slug}`}
        />
        <Link href={`/tutorials/${content.slug}`} className="absolute inset-0 z-10" aria-label={content.title} />
      </div>

      <div className="min-w-0 flex-1">
        <Link href={`/tutorials/${content.slug}`} className="block">
          <h4 className="truncate font-medium text-mp-text-primary transition-colors group-hover:text-mp-accent-secondary">
            {content.title}
          </h4>
        </Link>
        <AuthorInlineLink creator={content.creator} className="mt-1 max-w-full" />
        <p className="mt-1 text-sm text-mp-text-secondary">
          {content.completedLessons} из {content.lessonCount} уроков
        </p>
        <div className="mt-2">
          <ProgressBar value={progress} size="sm" />
        </div>
      </div>
    </article>
  );
}

"use client";

import { Play, Television } from "@phosphor-icons/react";
import Link from "next/link";
import { memo } from "react";

import { AgeBadge, type AgeCategory } from "@/components/content/age-badge";
import { AuthorInlineLink } from "@/components/content/author-inline-link";
import { ContentImage } from "@/components/content/content-image";
import { RatingBadge } from "@/components/ui/rating-badge";
import type { CreatorInput } from "@/lib/author-identity";
import { cn } from "@/lib/utils";

export interface SeriesContent {
  id: string;
  slug: string;
  title: string;
  thumbnailUrl: string;
  seasonCount: number;
  episodeCount: number;
  ageCategory: AgeCategory;
  rating?: number;
  year?: number;
  creator?: CreatorInput;
}

interface SeriesCardProps {
  content: SeriesContent;
  className?: string;
}

function formatSeriesInfo(seasons: number, episodes: number): string {
  const seasonText = seasons === 1 ? "1 сезон" : `${seasons} сезонов`;
  const episodeText = episodes === 1 ? "1 серия" : `${episodes} серий`;
  return `${seasonText} · ${episodeText}`;
}

export const SeriesCard = memo(function SeriesCard({
  content,
  className,
}: SeriesCardProps) {
  return (
    <article className={cn("group block shrink-0 content-card w-full", className)}>
      <Link
        href={`/series/${content.slug}`}
        className="relative mb-3 block aspect-[16/10] overflow-hidden rounded-xl bg-mp-surface-2"
      >
        <ContentImage
          src={content.thumbnailUrl}
          alt={content.title}
          fill
          className="object-cover transition-transform duration-500 ease-out-expo group-hover:scale-110"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          fallbackIcon={<Television className="w-12 h-12 text-mp-text-disabled" />}
        />

        <div className="absolute top-3 left-3 right-3 z-10 flex items-start justify-between">
          <AgeBadge age={content.ageCategory} size="sm" />
          {content.rating !== undefined && content.rating > 0 && (
            <RatingBadge rating={content.rating} size="sm" />
          )}
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity duration-300 touch:opacity-60 hover-hover:group-hover:opacity-100" />

        <div className="absolute inset-0 flex scale-90 items-center justify-center opacity-0 transition-all duration-300 touch:scale-100 touch:opacity-80 hover-hover:group-hover:scale-100 hover-hover:group-hover:opacity-100">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-mp-accent-primary/90 shadow-glow-primary backdrop-blur-sm touch:h-11 touch:w-11">
            <Play className="ml-0.5 h-6 w-6 text-white touch:h-5 touch:w-5" weight="fill" />
          </div>
        </div>

        <div className="absolute bottom-3 left-3 right-3 hidden opacity-0 transition-opacity duration-300 md:block md:group-hover:opacity-100">
          <span className="text-xs font-medium text-white/90">
            {formatSeriesInfo(content.seasonCount, content.episodeCount)}
          </span>
        </div>
      </Link>

      <div>
        <Link href={`/series/${content.slug}`} className="block">
          <h3 className="truncate font-medium text-mp-text-primary transition-colors duration-200 group-hover:text-mp-accent-primary">
            {content.title}
          </h3>
        </Link>
        <AuthorInlineLink
          creator={content.creator}
          className="mt-1 max-w-full"
          showUsername
        />
        <div className="mt-1 flex items-center gap-2">
          {content.year && (
            <span className="text-sm text-mp-text-secondary">{content.year}</span>
          )}
          <span className="text-sm text-mp-text-tertiary">
            {formatSeriesInfo(content.seasonCount, content.episodeCount)}
          </span>
        </div>
      </div>
    </article>
  );
});

export const SeriesCardCompact = memo(function SeriesCardCompact({
  content,
  className,
}: SeriesCardProps) {
  return (
    <article className={cn("group block shrink-0 w-full", className)}>
      <Link
        href={`/series/${content.slug}`}
        className="relative mb-2 block aspect-video overflow-hidden rounded-lg bg-mp-surface-2"
      >
        <ContentImage
          src={content.thumbnailUrl}
          alt={content.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, 25vw"
          fallbackIcon={<Television className="w-8 h-8 text-mp-text-disabled" />}
        />

        <div className="absolute left-2 top-2">
          <AgeBadge age={content.ageCategory} size="sm" />
        </div>

        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-200 touch:opacity-60 hover-hover:group-hover:opacity-100">
          <Play className="w-8 h-8 text-white" weight="fill" />
        </div>
      </Link>

      <Link href={`/series/${content.slug}`} className="block">
        <h4 className="truncate text-sm font-medium text-mp-text-primary transition-colors group-hover:text-mp-accent-primary">
          {content.title}
        </h4>
      </Link>
      <AuthorInlineLink creator={content.creator} className="mt-1 max-w-full" />
      <p className="mt-0.5 text-xs text-mp-text-secondary">
        {formatSeriesInfo(content.seasonCount, content.episodeCount)}
      </p>
    </article>
  );
});

"use client";

import {
  BookOpen,
  Clock,
  Eye,
  FilmStrip,
  Play,
  Star,
  Television,
} from "@phosphor-icons/react";
import Link from "next/link";
import type { ReactNode } from "react";

import {
  ContentRow,
  VideoCardProgress,
  type VideoProgressContent,
} from "@/components/content";
import { ContentImage } from "@/components/content/content-image";
import { RatingBadge } from "@/components/ui/rating-badge";
import type { useDashboardHome } from "@/hooks/use-home";
import { cn, formatDuration, formatNumber } from "@/lib/utils";

type DashboardData = ReturnType<typeof useDashboardHome>;

interface DashboardRowsProps {
  data: DashboardData;
}

interface DashboardCardContent {
  id: string;
  slug: string;
  title: string;
  description?: string;
  type?: string;
  year?: number;
  thumbnailUrl: string;
  rating: number;
  duration?: number;
  viewCount?: number;
  seasonCount?: number;
  episodeCount?: number;
  lessonCount?: number;
}

const TYPE_LABELS: Record<string, string> = {
  SERIES: "Сериал",
  TUTORIAL: "Обучение",
  CLIP: "Видео",
  SHORT: "Шортс",
};

function getContentHref(content: DashboardCardContent) {
  const slug = content.slug || content.id;

  switch (content.type) {
    case "SERIES":
      return `/series/${slug}`;
    case "TUTORIAL":
      return `/tutorials/${slug}`;
    case "CLIP":
      return `/videos/${slug}`;
    case "SHORT":
      return `/shorts/${slug}`;
    default:
      return `/watch/${slug}`;
  }
}

function getFallbackIcon(type?: string) {
  switch (type) {
    case "SERIES":
      return <Television className="h-10 w-10 text-mp-text-disabled" />;
    case "TUTORIAL":
      return <BookOpen className="h-10 w-10 text-mp-text-disabled" />;
    case "CLIP":
    case "SHORT":
      return <FilmStrip className="h-10 w-10 text-mp-text-disabled" />;
    default:
      return <Play className="h-10 w-10 text-mp-text-disabled" weight="fill" />;
  }
}

export function DashboardRows({ data }: DashboardRowsProps) {
  const {
    continueWatching,
    trending,
    newReleases,
    series,
    videos,
    shorts,
    tutorials,
  } = data;

  const continueItems: VideoProgressContent[] =
    (continueWatching.data?.items as VideoProgressContent[] | undefined) || [];
  const trendingItems = (trending.data?.data?.items || []).map(
    mapToDashboardCard,
  );
  const newItems = (newReleases.data?.data?.items || []).map(
    mapToDashboardCard,
  );
  const seriesItems = (series.data?.data?.items || []).map(mapToDashboardCard);
  const videoItems = (videos.data?.data?.items || []).map(mapToDashboardCard);
  const shortItems = (shorts.data?.data?.items || []).map(mapToDashboardCard);
  const tutorialItems = (tutorials.data?.data?.items || []).map(
    mapToDashboardCard,
  );

  return (
    <div className="space-y-10 md:space-y-14">
      {continueItems.length > 0 && (
        <section className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4 md:p-6">
          <ContentRow
            title="Продолжить просмотр"
            subtitle={`${continueItems.length} видео`}
            seeAllHref="/account/history"
            isLoading={continueWatching.isLoading}
          >
            {continueItems.map((item) => (
              <VideoCardProgress key={item.id} content={item} />
            ))}
          </ContentRow>
        </section>
      )}

      <DashboardSection
        title="Популярное"
        href="/search?sort=popular"
        isLoading={trending.isLoading}
        tone="violet"
      >
        <MediaGrid items={trendingItems.slice(0, 10)} variant="popular" />
      </DashboardSection>

      <DashboardSection
        title="Новинки"
        href="/search?sort=newest"
        isLoading={newReleases.isLoading}
        tone="cyan"
      >
        <MediaGrid items={newItems.slice(0, 10)} variant="standard" />
      </DashboardSection>

      <DashboardSection
        title="Сериалы"
        href="/series"
        isLoading={series.isLoading}
        tone="steel"
      >
        <MediaGrid items={seriesItems.slice(0, 8)} variant="series" />
      </DashboardSection>

      <DashboardSection
        title="Видео"
        href="/videos"
        isLoading={videos.isLoading}
        tone="coral"
      >
        <VideoGrid items={videoItems.slice(0, 8)} />
      </DashboardSection>

      <DashboardSection
        title="Шортсы"
        href="/shorts"
        isLoading={shorts.isLoading}
        tone="dark"
      >
        <ShortsGrid items={shortItems.slice(0, 6)} />
      </DashboardSection>

      <DashboardSection
        title="Обучение"
        href="/tutorials"
        isLoading={tutorials.isLoading}
        tone="clean"
      >
        <TutorialGrid items={tutorialItems.slice(0, 8)} />
      </DashboardSection>
    </div>
  );
}

function DashboardSection({
  title,
  href,
  isLoading,
  tone,
  children,
}: {
  title: string;
  href: string;
  isLoading: boolean;
  tone: "violet" | "cyan" | "steel" | "coral" | "dark" | "clean";
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-3xl border p-4 md:p-6 lg:p-7",
        getSectionTone(tone),
      )}
    >
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/[0.04] to-transparent" />
      </div>

      <div className="relative z-10 mb-5 flex items-end justify-between gap-4">
        <h2 className="text-xl font-semibold text-mp-text-primary md:text-2xl">
          {title}
        </h2>
        <Link
          href={href}
          className="shrink-0 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-medium text-mp-text-secondary transition-colors hover:bg-white/[0.08] hover:text-mp-text-primary"
        >
          Показать ещё
        </Link>
      </div>

      <div className="relative z-10">
        {isLoading ? <SectionSkeleton /> : children}
      </div>
    </section>
  );
}

function getSectionTone(
  tone: "violet" | "cyan" | "steel" | "coral" | "dark" | "clean",
) {
  switch (tone) {
    case "violet":
      return "border-violet-400/10 bg-[linear-gradient(135deg,rgba(201,75,255,0.11),rgba(255,255,255,0.025)_42%,rgba(0,0,0,0.08))]";
    case "cyan":
      return "border-cyan-300/10 bg-[linear-gradient(135deg,rgba(40,224,196,0.09),rgba(255,255,255,0.025)_44%,rgba(0,0,0,0.08))]";
    case "steel":
      return "border-sky-300/10 bg-[linear-gradient(135deg,rgba(59,130,246,0.1),rgba(255,255,255,0.025)_48%,rgba(0,0,0,0.1))]";
    case "coral":
      return "border-orange-300/10 bg-[linear-gradient(135deg,rgba(255,107,90,0.1),rgba(255,255,255,0.025)_42%,rgba(0,0,0,0.08))]";
    case "clean":
      return "border-white/[0.07] bg-[linear-gradient(135deg,rgba(255,255,255,0.055),rgba(40,224,196,0.045)_55%,rgba(0,0,0,0.08))]";
    default:
      return "border-white/[0.07] bg-white/[0.025]";
  }
}

function MediaGrid({
  items,
  variant,
}: {
  items: DashboardCardContent[];
  variant: "popular" | "standard" | "series";
}) {
  if (!items.length) return null;

  return (
    <div
      className={cn(
        "flex gap-4 overflow-x-auto pb-2 no-scrollbar md:grid md:auto-rows-[180px] md:overflow-visible md:pb-0 xl:auto-rows-[190px]",
        variant === "series"
          ? "md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          : "md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5",
      )}
    >
      {items.map((item, index) => (
        <MediaGridCard
          key={item.id}
          content={item}
          variant={variant}
          priority={variant === "popular" && index === 0}
        />
      ))}
    </div>
  );
}

function MediaGridCard({
  content,
  variant,
  priority = false,
}: {
  content: DashboardCardContent;
  variant: "popular" | "standard" | "series";
  priority?: boolean;
}) {
  return (
    <Link
      href={getContentHref(content)}
      className={cn(
        "group content-card block min-w-[270px] md:min-w-0",
        priority && "md:col-span-2 md:row-span-2",
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl bg-mp-surface-2",
          priority
            ? "aspect-[16/10] md:aspect-auto md:h-full"
            : "aspect-video md:aspect-auto md:h-full",
        )}
      >
        <ContentImage
          src={content.thumbnailUrl}
          alt={content.title}
          fill
          className="object-cover transition-transform duration-700 ease-out-expo group-hover:scale-110"
          sizes={priority ? "560px" : "320px"}
          fallbackIcon={getFallbackIcon(content.type)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-75 transition-opacity duration-300 group-hover:opacity-95" />

        <CardBadges content={content} />
        <HoverPlayButton />

        <div className="absolute bottom-4 left-4 right-4">
          <h3
            className={cn(
              "font-semibold text-white",
              priority ? "line-clamp-2 text-2xl" : "truncate text-base",
            )}
          >
            {content.title}
          </h3>
          <CardMeta content={content} className="mt-2 text-white/70" />
          {priority && content.description && (
            <p className="mt-3 hidden max-w-lg text-sm leading-relaxed text-white/70 md:line-clamp-2">
              {content.description}
            </p>
          )}
          {variant === "series" && (
            <p className="mt-2 text-sm text-white/65">
              {formatSeriesMeta(content)}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

function VideoGrid({ items }: { items: DashboardCardContent[] }) {
  if (!items.length) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Link
          key={item.id}
          href={getContentHref(item)}
          className="group content-card grid grid-cols-[120px_1fr] gap-4 rounded-2xl border border-white/[0.06] bg-black/20 p-3 md:block md:border-0 md:bg-transparent md:p-0"
        >
          <div className="relative aspect-video overflow-hidden rounded-xl bg-mp-surface-2 md:mb-3">
            <ContentImage
              src={item.thumbnailUrl}
              alt={item.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              sizes="280px"
              fallbackIcon={getFallbackIcon(item.type)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80" />
            <HoverPlayButton compact />
            {item.duration ? (
              <span className="absolute bottom-2 right-2 rounded bg-black/70 px-2 py-1 text-xs font-medium text-white">
                {formatDuration(item.duration)}
              </span>
            ) : null}
          </div>
          <div className="min-w-0 self-center md:self-auto">
            <h3 className="line-clamp-2 font-medium text-mp-text-primary transition-colors group-hover:text-mp-accent-primary">
              {item.title}
            </h3>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-mp-text-secondary">
              {item.viewCount !== undefined && (
                <span className="inline-flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" />
                  {formatNumber(item.viewCount)}
                </span>
              )}
              {item.rating > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 text-amber-400" weight="fill" />
                  {item.rating.toFixed(1)}
                </span>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function ShortsGrid({ items }: { items: DashboardCardContent[] }) {
  if (!items.length) return null;

  return (
    <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar md:grid md:grid-cols-3 md:overflow-visible md:pb-0 lg:grid-cols-6">
      {items.map((item) => (
        <Link
          key={item.id}
          href={getContentHref(item)}
          className="group content-card block min-w-[170px] md:min-w-0"
        >
          <div className="relative aspect-[9/16] overflow-hidden rounded-2xl bg-mp-surface-2">
            <ContentImage
              src={item.thumbnailUrl}
              alt={item.title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              sizes="180px"
              fallbackIcon={getFallbackIcon(item.type)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent opacity-80" />
            <HoverPlayButton compact />
            <div className="absolute bottom-3 left-3 right-3">
              <h3 className="line-clamp-2 text-sm font-semibold text-white">
                {item.title}
              </h3>
              {item.viewCount !== undefined && (
                <p className="mt-1 text-xs text-white/65">
                  {formatNumber(item.viewCount)} просмотров
                </p>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function TutorialGrid({ items }: { items: DashboardCardContent[] }) {
  if (!items.length) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Link
          key={item.id}
          href={getContentHref(item)}
          className="group content-card block rounded-2xl border border-white/[0.07] bg-white/[0.035] p-3 transition-colors hover:bg-white/[0.055]"
        >
          <div className="relative mb-4 aspect-video overflow-hidden rounded-xl bg-mp-surface-2">
            <ContentImage
              src={item.thumbnailUrl}
              alt={item.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="320px"
              fallbackIcon={getFallbackIcon(item.type)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-transparent to-transparent opacity-80" />
            <HoverPlayButton compact />
          </div>
          <div className="space-y-2">
            <h3 className="line-clamp-2 font-semibold text-mp-text-primary transition-colors group-hover:text-mp-accent-secondary">
              {item.title}
            </h3>
            <div className="flex flex-wrap items-center gap-3 text-sm text-mp-text-secondary">
              <span className="inline-flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5" />
                {item.lessonCount || 0} уроков
              </span>
              {item.duration ? (
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {formatDuration(item.duration)}
                </span>
              ) : null}
            </div>
            {item.rating > 0 && (
              <span className="inline-flex items-center gap-1 text-sm text-mp-text-secondary">
                <Star className="h-3.5 w-3.5 text-amber-400" weight="fill" />
                {item.rating.toFixed(1)}
              </span>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}

function CardBadges({ content }: { content: DashboardCardContent }) {
  return (
    <div className="absolute left-3 right-3 top-3 z-10 flex items-start justify-between gap-2">
      {content.type && (
        <span className="rounded bg-black/60 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
          {TYPE_LABELS[content.type] || content.type}
        </span>
      )}
      {content.rating > 0 && <RatingBadge rating={content.rating} size="sm" />}
    </div>
  );
}

function CardMeta({
  content,
  className,
}: {
  content: DashboardCardContent;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2 text-sm", className)}>
      {content.year && <span>{content.year}</span>}
      {content.year && content.rating > 0 && <span>&middot;</span>}
      {content.rating > 0 && (
        <span className="inline-flex items-center gap-1">
          <Star className="h-3.5 w-3.5 text-amber-400" weight="fill" />
          {content.rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}

function HoverPlayButton({ compact = false }: { compact?: boolean }) {
  return (
    <div className="absolute inset-0 flex scale-95 items-center justify-center opacity-0 transition-all duration-300 hover-hover:group-hover:scale-100 hover-hover:group-hover:opacity-100">
      <span
        className={cn(
          "flex items-center justify-center rounded-full bg-white text-black shadow-2xl",
          compact ? "h-10 w-10" : "h-12 w-12",
        )}
      >
        <Play
          className={cn("ml-0.5", compact ? "h-4 w-4" : "h-5 w-5")}
          weight="fill"
        />
      </span>
    </div>
  );
}

function SectionSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="animate-pulse">
          <div className="aspect-video rounded-2xl bg-mp-surface" />
          <div className="mt-3 h-4 w-4/5 rounded bg-mp-surface" />
          <div className="mt-2 h-3 w-1/3 rounded bg-mp-surface" />
        </div>
      ))}
    </div>
  );
}

function formatSeriesMeta(content: DashboardCardContent) {
  const seasons = content.seasonCount || 0;
  const episodes = content.episodeCount || 0;

  if (!seasons && !episodes) return "Смотрите все серии";
  if (!seasons) return `${episodes} серий`;
  if (!episodes) return `${seasons} сезонов`;

  return `${seasons} сезонов · ${episodes} серий`;
}

function mapToDashboardCard(item: any): DashboardCardContent {
  return {
    id: item.id,
    slug: item.slug || item.id,
    title: item.title,
    description: item.description || undefined,
    type: item.contentType || item.type,
    year: item.year || undefined,
    thumbnailUrl: item.thumbnailUrl || "/images/movie-placeholder.jpg",
    rating: item.averageRating ?? item.rating ?? 0,
    duration: item.duration || undefined,
    viewCount: item.viewCount ?? undefined,
    seasonCount: item.seasonCount ?? undefined,
    episodeCount: item.episodeCount ?? undefined,
    lessonCount: item.lessonCount ?? undefined,
  };
}

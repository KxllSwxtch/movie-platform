"use client";

import { CaretLeft, CaretRight, Play } from "@phosphor-icons/react";
import Link from "next/link";
import { useCallback, useRef } from "react";

import {
  AuthorInlineLink,
  HoverVideoPreview,
  VideoCardProgress,
  type VideoProgressContent,
} from "@/components/content";
import { ContentImage } from "@/components/content/content-image";
import type { useDashboardHome } from "@/hooks/use-home";
import type { CreatorInput } from "@/lib/author-identity";
import { cn, formatNumber, formatViewCount } from "@/lib/utils";

type DashboardData = ReturnType<typeof useDashboardHome>;

interface DashboardRowsProps {
  data: DashboardData;
}

interface DashboardCardContent {
  id: string;
  slug: string;
  title: string;
  type?: string;
  thumbnailUrl: string;
  viewCount?: number;
  duration?: number | null;
  creator?: CreatorInput;
}

interface DashboardApiItem {
  id: string;
  slug?: string;
  title: string;
  contentType?: string;
  type?: string;
  thumbnailUrl?: string;
  coverUrl?: string;
  bannerUrl?: string;
  heroImageUrl?: string;
  viewCount?: number | null;
  duration?: number | null;
  creator?: CreatorInput;
  author?: CreatorInput;
}

export function DashboardRows({ data }: DashboardRowsProps) {
  const trendingScrollRef = useRef<HTMLDivElement>(null);
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
  const gridItems = uniqueCards([
    ...trendingItems.slice(5),
    ...(newReleases.data?.data?.items || []).map(mapToDashboardCard),
    ...(videos.data?.data?.items || []).map(mapToDashboardCard),
    ...(tutorials.data?.data?.items || []).map(mapToDashboardCard),
    ...(series.data?.data?.items || []).map(mapToDashboardCard),
    ...(shorts.data?.data?.items || []).map(mapToDashboardCard),
  ]);

  const scrollTrending = useCallback((direction: "left" | "right") => {
    const carousel = trendingScrollRef.current;
    if (!carousel) return;

    carousel.scrollBy({
      left:
        (direction === "left" ? -1 : 1) *
        Math.max(225, carousel.clientWidth * 0.75),
      behavior: "smooth",
    });
  }, []);

  return (
    <div className="space-y-[32px]">
      {continueItems.length > 1 && (
        <section className="rounded-[14px] border border-white/[0.06] bg-black/20 p-3 backdrop-blur-xl">
          <div className="mb-3.5 flex items-end justify-between">
            <h2 className="text-[22px] font-semibold text-white">
              Продолжить просмотр
            </h2>
            <Link
              href="/account/history"
              className="text-sm font-medium text-white/55 transition-colors hover:text-white"
            >
              Смотреть все
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
            {continueItems.map((item) => (
              <VideoCardProgress key={item.id} content={item} />
            ))}
          </div>
        </section>
      )}

      <section className="relative">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="sesh-trending-title text-[44px] font-extrabold leading-[0.94] tracking-[-0.04em] text-white md:text-[58px]">
              Trending
              <br />
              Now
            </h2>
            <p className="mt-2 text-[16px] font-medium text-white/76 md:text-[18px]">
              Сейчас в тренде<span className="ml-1">🔥</span>
            </p>
          </div>

          <div
            className="hidden shrink-0 items-center gap-2 md:flex"
            aria-label="Навигация Trending Now"
          >
            <button
              type="button"
              aria-label="Прокрутить Trending Now назад"
              aria-controls="trending-now-carousel"
              onClick={() => scrollTrending("left")}
              className="flex h-[42px] w-[42px] items-center justify-center rounded-[12px] border border-white/[0.08] bg-[rgba(12,12,24,0.75)] text-white/80 backdrop-blur-[10px] transition-[border-color,box-shadow,color,background-color] duration-150 ease-out hover:border-[#C70F4F]/45 hover:bg-[rgba(20,12,28,0.82)] hover:text-white hover:shadow-[0_0_18px_rgba(199,15,79,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C70F4F]/70"
            >
              <CaretLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Прокрутить Trending Now вперед"
              aria-controls="trending-now-carousel"
              onClick={() => scrollTrending("right")}
              className="flex h-[42px] w-[42px] items-center justify-center rounded-[12px] border border-white/[0.08] bg-[rgba(12,12,24,0.75)] text-white/80 backdrop-blur-[10px] transition-[border-color,box-shadow,color,background-color] duration-150 ease-out hover:border-[#C70F4F]/45 hover:bg-[rgba(20,12,28,0.82)] hover:text-white hover:shadow-[0_0_18px_rgba(199,15,79,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C70F4F]/70"
            >
              <CaretRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div
          id="trending-now-carousel"
          ref={trendingScrollRef}
          className="flex gap-[25px] overflow-x-auto pb-2.5 pr-6 no-scrollbar md:pr-[104px]"
        >
          {trending.isLoading ? (
            <TopRailSkeleton />
          ) : (
            trendingItems
              .slice(0, 8)
              .map((item) => (
                <CompactTrendingCard key={item.id} content={item} />
              ))
          )}
        </div>
      </section>

      <section className="relative">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,240px),1fr))] gap-x-[18px] gap-y-[27px]">
          {(trending.isLoading || newReleases.isLoading || videos.isLoading) &&
          !gridItems.length
            ? Array.from({ length: 8 }).map((_, index) => (
                <GridSkeleton key={index} />
              ))
            : gridItems
                .slice(0, 16)
                .map((item) => (
                  <PremiumVideoCard
                    key={`${item.type}-${item.id}`}
                    content={item}
                  />
                ))}
        </div>
      </section>
    </div>
  );
}

function CompactTrendingCard({ content }: { content: DashboardCardContent }) {
  const href = getContentHref(content);

  return (
    <article className="group w-[188px] shrink-0 md:w-[200px]">
      <div className="relative aspect-[1.83/1] overflow-hidden rounded-[10px] bg-white/[0.04] shadow-[0_12px_32px_rgba(0,0,0,0.22)]">
        <ContentImage
          src={content.thumbnailUrl}
          alt={content.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="200px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/62 via-transparent to-transparent" />
        <ViewPill
          count={content.viewCount}
          className="absolute bottom-2 left-3 transition-opacity duration-200 group-hover:opacity-0"
        />
        <HoverVideoPreview
          contentId={content.id}
          title={content.title}
          href={href}
          duration={content.duration}
        />
        <Link
          href={href}
          className="absolute inset-0 z-10"
          aria-label={content.title}
        />
      </div>
      <Link
        href={href}
        className="block rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#55b7ff]"
      >
        <h2 className="mt-2 line-clamp-2 text-[15px] font-bold leading-[1.16] tracking-normal text-white transition-colors group-hover:text-white/86">
          {content.title}
        </h2>
      </Link>
    </article>
  );
}

function PremiumVideoCard({ content }: { content: DashboardCardContent }) {
  const href = getContentHref(content);

  return (
    <article className="group min-w-0">
      <div className="relative aspect-[1.82/1] overflow-hidden rounded-[10px] bg-white/[0.04] shadow-[0_12px_34px_rgba(0,0,0,0.2)]">
        <ContentImage
          src={content.thumbnailUrl}
          alt={content.title}
          fill
          className="object-cover transition-transform duration-500 ease-out-expo group-hover:scale-[1.045]"
          sizes="(max-width: 768px) 92vw, (max-width: 1536px) 20vw, 260px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/46 via-transparent to-transparent opacity-75" />
        <HoverVideoPreview
          contentId={content.id}
          title={content.title}
          href={href}
          duration={content.duration}
        />
        <Link
          href={href}
          className="absolute inset-0 z-10"
          aria-label={content.title}
        />
      </div>
      <Link
        href={href}
        className="block rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#55b7ff]"
      >
        <h3 className="mt-2 line-clamp-2 text-[15px] font-bold leading-[1.16] tracking-normal text-white md:text-[16px]">
          {content.title}
        </h3>
      </Link>

      <div className="mt-1 flex items-center gap-1 text-[12px] font-medium text-white/72">
        <Play className="h-3 w-3 text-white" weight="fill" />
        <span>{formatViews(content.viewCount)}</span>
      </div>

      <AuthorInlineLink
        creator={content.creator}
        avatarSize="xs"
        className="mt-2 max-w-full text-[12px] font-medium text-white/78 hover:text-white"
      />
    </article>
  );
}

function ViewPill({
  count,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 text-[12px] font-medium text-white/82",
        className,
      )}
    >
      <Play className="h-3 w-3 text-white" weight="fill" />
      <span>{formatViews(count)}</span>
    </div>
  );
}

function TopRailSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="w-[200px] shrink-0 animate-pulse">
          <div className="aspect-[1.83/1] rounded-[10px] bg-white/10" />
          <div className="mt-2 h-3.5 w-5/6 rounded bg-white/10" />
        </div>
      ))}
    </>
  );
}

function GridSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[1.82/1] rounded-[10px] bg-white/10" />
      <div className="mt-2 h-3.5 w-5/6 rounded bg-white/10" />
      <div className="mt-1 h-3 w-1/2 rounded bg-white/10" />
    </div>
  );
}

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

function formatViews(count: number = 0) {
  return formatViewCount(count);
  if (count === undefined || count === null) return "0 Просмотров";
  return `${formatNumber(count)} Просмотров`;
}

function uniqueCards(items: DashboardCardContent[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.type || "content"}-${item.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function mapToDashboardCard(item: DashboardApiItem): DashboardCardContent {
  return {
    id: item.id,
    slug: item.slug || item.id,
    title: item.title,
    type: item.contentType || item.type,
    thumbnailUrl:
      item.thumbnailUrl ||
      item.coverUrl ||
      item.bannerUrl ||
      item.heroImageUrl ||
      "/images/movie-placeholder.jpg",
    viewCount: item.viewCount ?? undefined,
    duration: item.duration,
    creator: item.creator ?? item.author,
  };
}

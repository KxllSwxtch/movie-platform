"use client";

import { Play, DownloadSimple, Flame, Star } from "@phosphor-icons/react";
import Link from "next/link";

import { ContentImage } from "@/components/content/content-image";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAddToWatchlist } from "@/hooks/use-account";

/**
 * Genre color mapping based on age category
 */
const genreColors: Record<string, string> = {
  horror: "#EF4444",
  action: "#C94BFF",
  drama: "#3B82F6",
  comedy: "#28E0C4",
  romance: "#FF6B5A",
  thriller: "#F97316",
  "sci-fi": "#8B5CF6",
  fantasy: "#EC4899",
  // Russian genre names
  ужасы: "#EF4444",
  боевик: "#C94BFF",
  драма: "#3B82F6",
  комедия: "#28E0C4",
  мелодрама: "#FF6B5A",
  триллер: "#F97316",
  фантастика: "#8B5CF6",
  фэнтези: "#EC4899",
  документальный: "#28E0C4",
  анимация: "#F97316",
  default: "#C94BFF",
};

export interface HeroContent {
  id: string;
  title: string;
  year: number;
  genre: string;
  description: string;
  thumbnailUrl: string;
  rank?: number;
  rating?: number;
}

interface HeroSectionProps {
  content: HeroContent;
  className?: string;
  onCTAClick?: () => void;
  onSecondaryClick?: () => void;
}

/**
 * Hero section component with professional asymmetrical layout
 */
export function HeroSection({
  content,
  className,
  onCTAClick,
  onSecondaryClick,
}: HeroSectionProps) {
  const genreColor =
    genreColors[String(content.genre || "").toLowerCase()] ||
    genreColors.default;
  const addToWatchlist = useAddToWatchlist();

  const handleAddToWatchlist = async () => {
    try {
      await addToWatchlist.mutateAsync(content.id);
      onSecondaryClick?.();
    } catch {
      // hook shows toast
    }
  };

  return (
    <section
      className={cn(
        "relative w-full h-[340px] sm:h-[400px] md:h-[460px] xl:h-[500px] rounded-3xl overflow-hidden group shadow-[0_24px_80px_rgba(0,0,0,0.36)]",
        className,
      )}
    >
      {/* Background image with subtle zoom on hover */}
      <div className="absolute inset-0">
        <ContentImage
          src={content.thumbnailUrl}
          alt=""
          fill
          className="scale-110 object-cover blur-2xl opacity-35"
          sizes="100vw"
          priority
          fallbackClassName="w-full h-full bg-mp-surface-2"
          aria-hidden
        />
        <ContentImage
          src={content.thumbnailUrl}
          alt={content.title}
          fill
          className="object-cover transition-transform duration-700 ease-out-expo group-hover:scale-105"
          sizes="100vw"
          priority
          fallbackClassName="w-full h-full bg-mp-surface-2"
        />
        {/* Layered overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/95 sm:from-black/90 via-black/55 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent" />
      </div>

      {/* Content - Left aligned for asymmetry */}
      <div className="relative z-10 h-full flex flex-col justify-end p-6 md:p-10 lg:p-12 max-w-2xl">
        {/* Popular badge */}
        {content.rank && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg backdrop-blur-sm bg-white/5 border border-white/10 w-fit mb-5">
            <Flame className="w-4 h-4 text-amber-400" />
            <span className="text-sm text-white/90 font-medium tracking-wide">
              Популярное #{content.rank}
            </span>
          </div>
        )}

        {/* Genre tag */}
        <div className="mb-3 flex flex-wrap items-center gap-3">
          {content.genre && (
            <span
              className="text-sm font-semibold uppercase tracking-wider"
              style={{ color: genreColor }}
            >
              {content.genre}
            </span>
          )}
          <span className="text-sm text-white/70">{content.year}</span>
          {content.rating !== undefined && content.rating > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-black/35 px-2 py-1 text-sm font-medium text-white backdrop-blur-sm">
              <Star className="h-3.5 w-3.5 text-amber-400" weight="fill" />
              {content.rating.toFixed(1)}
            </span>
          )}
        </div>

        {/* Title - Using display typography */}
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-3 tracking-tight">
          {content.title}
        </h1>

        {/* Description - hidden on very small screens to save space */}
        {(content.description || content.genre) && (
          <p className="hidden sm:block text-sm md:text-base text-white/72 line-clamp-3 mb-8 max-w-xl leading-relaxed">
            {content.description ||
              "Самое заметное сейчас на платформе: включайте и продолжайте с того места, где остановились."}
          </p>
        )}

        {/* CTA Buttons - stack on narrow screens */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mt-4 sm:mt-0">
          <Button
            variant="solid"
            size="lg"
            className="rounded-lg shadow-button hover:shadow-button-hover"
            asChild
            onClick={onCTAClick}
          >
            <Link href={`/watch/${content.id}`}>
              <Play className="w-4 h-4" weight="fill" />
              Смотреть
            </Link>
          </Button>

          <Button
            variant="glass"
            size="lg"
            className="rounded-lg"
            onClick={handleAddToWatchlist}
            disabled={addToWatchlist.isPending}
          >
            <DownloadSimple className="w-4 h-4" />В избранное
          </Button>
        </div>
      </div>

      <div className="absolute bottom-8 right-8 z-10 hidden w-[240px] lg:block">
        <div className="relative aspect-video overflow-hidden rounded-xl border border-white/15 bg-white/5 shadow-2xl backdrop-blur-md">
          <ContentImage
            src={content.thumbnailUrl}
            alt={content.title}
            fill
            className="object-cover"
            sizes="240px"
            fallbackClassName="w-full h-full bg-mp-surface-2"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-3">
            <span className="truncate text-sm font-medium text-white">
              {content.title}
            </span>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-black">
              <Play className="h-4 w-4" weight="fill" />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

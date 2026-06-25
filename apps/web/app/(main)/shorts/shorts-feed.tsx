'use client';

import * as React from 'react';
import { CaretUp, CaretDown, SpinnerGap } from '@phosphor-icons/react';

import { ShortCard, type ShortContent } from '@/components/content';
import { useContentDetail, useContentInfinite } from '@/hooks/use-content';
import { cn } from '@/lib/utils';
import {
  isSameShort,
  mapContentItemToShort,
  prioritizeInitialShort,
} from './shorts.utils';

interface ShortsFeedProps {
  initialShortSlug?: string;
}

export function ShortsFeed({ initialShortSlug }: ShortsFeedProps) {
  const targetSlug = initialShortSlug?.trim() || '';
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [viewportHeight, setViewportHeight] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const scrollFrameRef = React.useRef(0);

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useContentInfinite({ type: 'SHORT', limit: 10 });

  const { data: targetContent, isLoading: isTargetLoading } =
    useContentDetail(targetSlug);

  const feedShorts: ShortContent[] = React.useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) =>
      (page?.items ?? []).map(mapContentItemToShort),
    );
  }, [data]);

  const targetShort = React.useMemo(() => {
    if (!targetSlug || !targetContent) return null;
    if (targetContent.contentType && targetContent.contentType !== 'SHORT') {
      return null;
    }
    return mapContentItemToShort(targetContent);
  }, [targetContent, targetSlug]);

  const targetInFeed = React.useMemo(
    () => Boolean(targetSlug && feedShorts.some((short) => isSameShort(short, targetSlug))),
    [feedShorts, targetSlug],
  );

  const shorts: ShortContent[] = React.useMemo(() => {
    return prioritizeInitialShort(feedShorts, targetSlug, targetShort);
  }, [feedShorts, targetShort, targetSlug]);

  const scrollToIndex = React.useCallback((index: number) => {
    const container = containerRef.current;
    if (!container || viewportHeight === 0) return;
    container.scrollTo({ top: index * viewportHeight, behavior: 'smooth' });
  }, [viewportHeight]);

  React.useEffect(() => {
    if (!targetSlug) return;
    setActiveIndex(0);
    containerRef.current?.scrollTo({ top: 0, behavior: 'auto' });
  }, [targetShort?.id, targetSlug]);

  // Keep one viewport per item while mounting only the previous, current and next cards.
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const updateSize = () => setViewportHeight(container.clientHeight);
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(container);
    updateSize();

    const handleScroll = () => {
      if (scrollFrameRef.current) return;
      scrollFrameRef.current = window.requestAnimationFrame(() => {
        scrollFrameRef.current = 0;
        const height = container.clientHeight;
        if (!height) return;
        const nextIndex = Math.max(
          0,
          Math.min(shorts.length - 1, Math.round(container.scrollTop / height)),
        );
        setActiveIndex((current) => current === nextIndex ? current : nextIndex);
      });
    };

    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      resizeObserver.disconnect();
      container.removeEventListener('scroll', handleScroll);
      if (scrollFrameRef.current) window.cancelAnimationFrame(scrollFrameRef.current);
    };
  }, [shorts.length]);

  // Fetch before the virtual window reaches the end.
  React.useEffect(() => {
    if (activeIndex >= shorts.length - 3 && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [activeIndex, shorts.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        scrollToIndex(Math.min(activeIndex + 1, shorts.length - 1));
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        scrollToIndex(Math.max(activeIndex - 1, 0));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, shorts.length, scrollToIndex]);

  if (isLoading || (targetSlug && isTargetLoading && !targetInFeed)) {
    return (
      <div className="sesh-shorts-loading shorts-viewport-height">
        <div className="sesh-shorts-loading-card">
          <div className="sesh-shorts-loading-spinner" />
          <p>Загрузка шортсов...</p>
        </div>
      </div>
    );
  }

  if (shorts.length === 0) {
    return (
      <div className="relative shorts-viewport-height flex w-full items-center justify-center">
        <p className="text-mp-text-secondary text-lg">Shorts пока нет</p>
      </div>
    );
  }

  return (
    <div className="relative shorts-viewport-height w-full overflow-hidden">
      <div
        ref={containerRef}
        className="h-full overflow-y-scroll snap-y snap-mandatory overscroll-contain"
        style={{ scrollbarWidth: 'none' }}
      >
        <div
          className="relative w-full"
          style={{ height: Math.max(viewportHeight, shorts.length * viewportHeight) }}
        >
          {shorts.map((short, index) => {
            if (Math.abs(index - activeIndex) > 1) return null;
            return (
              <div
                key={short.id}
                className="absolute left-0 w-full snap-start"
                style={{ top: index * viewportHeight, height: viewportHeight || '100%' }}
              >
                <ShortCard content={short} isActive={index === activeIndex} className="h-full" />
              </div>
            );
          })}
        </div>

        {isFetchingNextPage ? (
          <SpinnerGap className="absolute bottom-4 left-1/2 h-6 w-6 -translate-x-1/2 animate-spin text-white" />
        ) : null}
      </div>

      <div className="absolute right-4 top-1/2 z-20 hidden -translate-y-1/2 flex-col gap-2 md:flex">
        <button
          onClick={() => scrollToIndex(Math.max(activeIndex - 1, 0))}
          disabled={activeIndex === 0}
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full border border-[#d5203a]/20 bg-[#07020f]/45 text-white/80 shadow-[0_0_14px_rgba(213,32,58,0.12)] backdrop-blur-md transition-colors',
            activeIndex === 0
              ? 'opacity-30 cursor-not-allowed'
              : 'hover:border-[#55b7ff]/40 hover:bg-[#10131c]/70 hover:text-white',
          )}
          aria-label="Предыдущее видео"
        >
          <CaretUp className="h-5 w-5" />
        </button>
        <button
          onClick={() => scrollToIndex(Math.min(activeIndex + 1, shorts.length - 1))}
          disabled={activeIndex === shorts.length - 1}
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full border border-[#d5203a]/20 bg-[#07020f]/45 text-white/80 shadow-[0_0_14px_rgba(213,32,58,0.12)] backdrop-blur-md transition-colors',
            activeIndex === shorts.length - 1
              ? 'opacity-30 cursor-not-allowed'
              : 'hover:border-[#55b7ff]/40 hover:bg-[#10131c]/70 hover:text-white',
          )}
          aria-label="Следующее видео"
        >
          <CaretDown className="h-5 w-5" />
        </button>
      </div>

      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 hidden md:flex flex-col gap-1.5">
        {shorts.slice(0, 10).map((_, index) => (
          <button
            key={index}
            onClick={() => scrollToIndex(index)}
            className={cn(
              'w-1.5 rounded-full transition-all duration-300',
              index === activeIndex
                ? 'h-6 bg-white'
                : 'h-1.5 bg-white/30 hover:bg-white/50',
            )}
            aria-label={`Перейти к видео ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

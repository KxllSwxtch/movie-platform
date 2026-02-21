'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  CaretLeft,
  ThumbsUp,
  ThumbsDown,
  ShareNetwork,
  Flag,
  CaretDown,
  CaretUp,
  Lock,
  WarningCircle,
} from '@phosphor-icons/react';

import { Container } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import dynamic from 'next/dynamic';
import { VideoPlayerSkeleton } from '@/components/player';
import { cn } from '@/lib/utils';
import { useStreamUrl } from '@/hooks/use-streaming';
import { api, endpoints, ApiError } from '@/lib/api-client';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';

const VideoPlayer = dynamic(
  () => import('@/components/player/video-player').then((m) => m.VideoPlayer),
  { ssr: false, loading: () => <VideoPlayerSkeleton /> },
);

/**
 * Format view count
 */
function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}ч ${m}мин`;
  return `${m} мин`;
}

/**
 * Watch page - video player with episode info
 */
export default function WatchPage() {
  const params = useParams();
  const router = useRouter();
  const contentId = params.id as string;

  const queryClient = useQueryClient();
  const [showFullDescription, setShowFullDescription] = React.useState(false);
  const [liked, setLiked] = React.useState<boolean | null>(null);

  const { data, isLoading, error } = useStreamUrl(contentId);
  const streamData = (data as any)?.data || data;

  // Save watch progress
  const handleProgress = React.useCallback(
    (time: number) => {
      if (!contentId) return;
      api
        .post(endpoints.watchHistory.updateProgress(contentId), {
          progress: Math.round(time),
        })
        .catch(() => {
          // Silently fail — progress saving is non-critical
        });
    },
    [contentId],
  );

  const handleEnded = React.useCallback(() => {
    // Could navigate to next episode or show recommendations
  }, []);

  const handleError = React.useCallback((err: string) => {
    console.error('Video error:', err);
  }, []);

  // When CDN returns 403 for expired signed URL, refetch stream URL
  const handleUrlExpired = React.useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.streaming.url(contentId),
    });
  }, [queryClient, contentId]);

  // Access denied (403) — show subscription CTA
  if (error) {
    const apiError = error as ApiError;
    const status = apiError?.status;

    if (status === 403) {
      return (
        <div className="min-h-screen bg-mp-bg-primary flex items-center justify-center">
          <div className="text-center max-w-md px-4">
            <div className="w-16 h-16 rounded-full bg-mp-accent-primary/10 flex items-center justify-center mx-auto mb-6">
              <Lock className="w-8 h-8 text-mp-accent-primary" />
            </div>
            <h1 className="text-2xl font-bold text-mp-text-primary mb-3">
              Требуется подписка
            </h1>
            <p className="text-mp-text-secondary mb-6">
              Для просмотра этого контента необходима активная подписка или индивидуальная покупка.
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => router.push('/subscriptions')}>
                Оформить подписку
              </Button>
              <Button variant="outline" onClick={() => router.back()}>
                Назад
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // 404 or other errors
    return (
      <div className="min-h-screen bg-mp-bg-primary flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 rounded-full bg-mp-error-bg flex items-center justify-center mx-auto mb-6">
            <WarningCircleclassName="w-8 h-8 text-mp-error-text" />
          </div>
          <h1 className="text-2xl font-bold text-mp-text-primary mb-3">
            Видео не найдено
          </h1>
          <p className="text-mp-text-secondary mb-6">
            {status === 404
              ? 'Контент не найден или видео ещё не готово к воспроизведению.'
              : 'Произошла ошибка при загрузке видео.'}
          </p>
          <Button variant="outline" onClick={() => router.back()}>
            Назад
          </Button>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading || !streamData) {
    return (
      <div className="min-h-screen bg-mp-bg-primary">
        <div className="border-b border-mp-border bg-mp-bg-secondary/50 h-14" />
        <div className="w-full bg-black">
          <Container size="full" className="px-0 md:px-6 lg:px-8">
            <div className="max-w-[1600px] mx-auto">
              <VideoPlayerSkeleton />
            </div>
          </Container>
        </div>
        <Container size="xl" className="py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-mp-surface rounded w-2/3" />
            <div className="h-4 bg-mp-surface rounded w-1/3" />
            <div className="h-10 bg-mp-surface rounded w-full mt-6" />
          </div>
        </Container>
      </div>
    );
  }

  const title = streamData.title || 'Видео';
  const description = streamData.description || '';
  const duration = streamData.duration || 0;

  return (
    <div className="min-h-screen bg-mp-bg-primary">
      {/* Back navigation */}
      <div className="border-b border-mp-border bg-mp-bg-secondary/50 backdrop-blur-sm sticky top-0 z-10">
        <Container size="full">
          <div className="flex items-center h-14">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-mp-text-secondary hover:text-mp-text-primary transition-colors"
            >
              <CaretLeftclassName="w-5 h-5" />
              <span className="text-sm font-medium">Назад</span>
            </button>
          </div>
        </Container>
      </div>

      {/* Video player */}
      <div className="w-full bg-black">
        <Container size="full" className="px-0 md:px-6 lg:px-8">
          <div className="max-w-[1600px] mx-auto">
            <VideoPlayer
              src={streamData.streamUrl}
              poster={streamData.thumbnailUrls?.[0]}
              title={title}
              initialTime={0}
              onProgress={handleProgress}
              onEnded={handleEnded}
              onError={handleError}
              onUrlExpired={handleUrlExpired}
              showSkipButtons
              showPiP
            />
          </div>
        </Container>
      </div>

      {/* Episode info */}
      <Container size="xl" className="py-6">
        <div className="max-w-4xl">
          {/* Title and meta */}
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-mp-text-primary mb-2">
              {title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-mp-text-secondary">
              {duration > 0 && <span>{formatDuration(duration)}</span>}
              {streamData.availableQualities?.length > 0 && (
                <>
                  <span>·</span>
                  <span>
                    До {streamData.availableQualities[streamData.availableQualities.length - 1] || streamData.maxQuality}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pb-6 border-b border-mp-border">
            <Button
              variant={liked === true ? 'default' : 'outline'}
              size="sm"
              onClick={() => setLiked(liked === true ? null : true)}
              className="gap-2"
            >
              <ThumbsUp
                className={cn('w-4 h-4', liked === true && 'fill-current')}
              />
              Нравится
            </Button>
            <Button
              variant={liked === false ? 'default' : 'outline'}
              size="sm"
              onClick={() => setLiked(liked === false ? null : false)}
            >
              <ThumbsDown
                className={cn('w-4 h-4', liked === false && 'fill-current')}
              />
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <ShareNetworkclassName="w-4 h-4" />
              Поделиться
            </Button>
            <Button variant="ghost" size="sm">
              <Flag className="w-4 h-4" />
            </Button>
          </div>

          {/* Description */}
          {description && (
            <div className="py-6">
              <p
                className={cn(
                  'text-mp-text-secondary',
                  !showFullDescription && 'line-clamp-3',
                )}
              >
                {description}
              </p>
              {description.length > 150 && (
                <button
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="flex items-center gap-1 text-sm text-mp-accent-primary hover:underline mt-2"
                >
                  {showFullDescription ? (
                    <>
                      <CaretUpclassName="w-4 h-4" />
                      Скрыть
                    </>
                  ) : (
                    <>
                      <CaretDownclassName="w-4 h-4" />
                      Показать полностью
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}

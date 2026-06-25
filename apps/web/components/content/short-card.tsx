'use client';

import { Play, Heart, ChatCircle, ShareNetwork } from '@phosphor-icons/react';
import Hls from 'hls.js';
import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { cn, copyTextToClipboard, formatNumber, formatRelativeTime } from '@/lib/utils';
import { normalizeMediaUrl } from '@/lib/media-url';
import { normalizeCreatorIdentity } from '@/lib/author-identity';
import { getPublicContentUrl } from '@/lib/public-content-url';
import type { CreatorInput } from '@/lib/author-identity';
import { useStreamUrl } from '@/hooks/use-streaming';
import { useContentComments, useCreateContentComment } from '@/hooks/use-comments';
import {
  useContentLikeStatus,
  useLikeContent,
  useUnlikeContent,
} from '@/hooks/use-likes';
import { useIsAuthenticated, useUser } from '@/stores/auth.store';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/avatar';

let activeShortVideo: HTMLVideoElement | null = null;

export interface ShortContent {
  id: string;
  slug?: string;
  title: string;
  contentType?: string;
  thumbnailUrl?: string;
  creator: CreatorInput;
  likeCount?: number;
  commentCount?: number;
  shareCount?: number;
}

interface ShortCardProps {
  content: ShortContent;
  isActive?: boolean;
  className?: string;
}

/**
 * Full-screen vertical short card for the Shorts feed
 * Uses native <video> for performance. Only active card plays.
 */
export const ShortCard = forwardRef<HTMLDivElement, ShortCardProps>(
  ({ content, isActive = false, className }, ref) => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const hlsRef = useRef<Hls | null>(null);
    const { data, isLoading, error } = useStreamUrl(isActive ? content.id : undefined);
    const streamData = (data as any)?.data ?? data;

    const [isMuted, setIsMuted] = useState(true);
    const [commentsOpen, setCommentsOpen] = useState(false);
    const [commentText, setCommentText] = useState('');

    const user = useUser();
    const isAuthenticated = useIsAuthenticated();
    const commentsQuery = useContentComments(content.id, commentsOpen);
    const createComment = useCreateContentComment(content.id);
    const likeStatus = useContentLikeStatus(content.id, isAuthenticated);
    const likeContent = useLikeContent(content.id);
    const unlikeContent = useUnlikeContent(content.id);
    const liked = likeStatus.data?.liked ?? false;
    const likeCount = likeStatus.data?.likeCount ?? content.likeCount ?? 0;
    const commentCount = commentsQuery.data?.total ?? content.commentCount ?? 0;
    const creatorIdentity = normalizeCreatorIdentity(content.creator);
    const creatorAvatarSrc = creatorIdentity?.avatarUrl
      ? normalizeMediaUrl(creatorIdentity.avatarUrl)
      : undefined;

    const pauseCurrentVideo = useCallback((reset = false) => {
      const el = videoRef.current;
      if (!el) return;
      if (activeShortVideo === el) {
        activeShortVideo = null;
      }
      el.pause();
      if (reset) {
        el.currentTime = 0;
      }
    }, []);

    const playActiveVideo = useCallback(() => {
      const el = videoRef.current;
      if (!el) return;

      if (activeShortVideo && activeShortVideo !== el) {
        activeShortVideo.pause();
        activeShortVideo.currentTime = 0;
      }
      activeShortVideo = el;
      el.muted = true;

      const playPromise = el.play();
      if (playPromise && typeof (playPromise as Promise<void>).catch === 'function') {
        (playPromise as Promise<void>).catch(() => {
          // Autoplay can be blocked; user can tap the video.
        });
      }
    }, []);

    useEffect(() => {
      // Reset local state when card changes
      setIsMuted(true);
      setCommentsOpen(false);
      setCommentText('');
    }, [content.id]);

    useEffect(() => {
      // When card becomes inactive, ensure it's muted (prevents bleed when scrolling)
      if (!isActive) {
        setIsMuted(true);
        if (videoRef.current) {
          videoRef.current.muted = true;
        }
        pauseCurrentVideo(true);
      }
    }, [isActive, pauseCurrentVideo]);

    const videoSrc = useMemo(() => {
      if (!isActive) return undefined;
      return streamData?.streamUrl
        ? normalizeMediaUrl(streamData.streamUrl as string)
        : undefined;
    }, [isActive, streamData?.streamUrl]);

    useEffect(() => {
      const el = videoRef.current;
      if (!el) return undefined;

      // Always clean up previous HLS instance before switching cards/URLs
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      if (!isActive || !videoSrc) {
        try {
          pauseCurrentVideo(true);
          el.removeAttribute('src');
          el.load();
        } catch {
          // ignore
        }
        return undefined;
      }

      const isHls = /\.m3u8(\?|$)/i.test(videoSrc);

      // Chrome/Firefox: native <video> does not play HLS, so we must use hls.js
      if (isHls && Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          backBufferLength: 30,
          maxBufferLength: 20,
          startLevel: -1,
          capLevelToPlayerSize: true,
        });

        hlsRef.current = hls;
        hls.loadSource(videoSrc);
        hls.attachMedia(el);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (videoRef.current === el && isActive) {
            playActiveVideo();
          }
        });

        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            try {
              hls.destroy();
              hlsRef.current = null;
            } catch {
              // ignore
            }
          }
        });

        return () => {
          if (activeShortVideo === el) {
            activeShortVideo = null;
          }
          el.pause();
          if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
          }
        };
      }

      // Safari (native HLS) or non-HLS URL
      try {
        el.src = videoSrc;
        playActiveVideo();
      } catch {
        // ignore
      }
      return () => {
        if (activeShortVideo === el) {
          activeShortVideo = null;
        }
        el.pause();
      };
    }, [isActive, pauseCurrentVideo, playActiveVideo, videoSrc]);

    useEffect(() => {
      return () => {
        pauseCurrentVideo(true);
      };
    }, [pauseCurrentVideo]);

    const handleToggleLike = async () => {
      if (!isAuthenticated) {
        toast.message('Войдите, чтобы поставить лайк');
        return;
      }

      if (liked) {
        await unlikeContent.mutateAsync();
      } else {
        await likeContent.mutateAsync();
      }
    };

    const handleComments = () => {
      setCommentsOpen(true);
    };

    const handleSubmitComment = async () => {
      const text = commentText.trim();
      if (!text) return;

      if (!isAuthenticated) {
        toast.message('Войдите, чтобы оставлять комментарии');
        return;
      }

      try {
        await createComment.mutateAsync({ text });
        setCommentText('');
      } catch {
        // handled by global mutation error toast
      }
    };

    const handleShare = async () => {
      const url = getPublicContentUrl({
        id: content.id,
        slug: content.slug,
        contentType: content.contentType || 'SHORT',
      });
      try {
        if (typeof navigator !== 'undefined' && 'share' in navigator) {
          await (navigator as any).share({ title: content.title, url });
          return;
        }
      } catch {
        // fall back to clipboard
      }

      const ok = await copyTextToClipboard(url);
      if (ok) toast.success('Ссылка скопирована');
      else toast.error('Не удалось скопировать ссылку');
    };

    const handleToggleMute = () => {
      const el = videoRef.current;
      if (!el) return;
      const nextMuted = !el.muted;
      el.muted = nextMuted;
      if (!nextMuted && el.volume === 0) {
        el.volume = 1;
      }
      setIsMuted(nextMuted);

      // If autoplay was muted and audio is now enabled, keep playback running
      if (!nextMuted) {
        const playPromise = el.play();
        if (playPromise && typeof (playPromise as Promise<void>).catch === 'function') {
          (playPromise as Promise<void>).catch(() => {
            // ignore
          });
        }
      }
    };

    return (
      <>
        <div
          ref={ref}
          data-short-id={content.id}
          className={cn(
            'relative flex h-full w-full snap-start snap-always items-center justify-center bg-transparent px-4 py-0 sm:px-6 md:px-0',
            className
          )}
          onClick={(e) => {
            if (!isActive) return;
            const target = e.target as HTMLElement | null;
            if (target?.closest('button,a')) return;
            handleToggleMute();
          }}
        >
          <div className="relative flex h-full w-full max-w-[760px] items-center justify-center gap-3 sm:gap-4 md:gap-5 lg:max-w-[720px]">
            <div className="relative h-full w-full overflow-hidden bg-[#05060a] shadow-[0_24px_70px_rgba(0,0,0,0.34)] sm:mt-3 sm:h-[calc(100%-24px)] sm:aspect-[9/16] sm:max-h-[860px] sm:w-auto sm:self-start sm:rounded-[10px]">
        {/* Video element */}
        <video
          ref={videoRef}
          poster={content.thumbnailUrl ? normalizeMediaUrl(content.thumbnailUrl) : undefined}
          loop
          muted={isMuted}
          playsInline
          preload={isActive ? 'metadata' : 'none'}
          className="absolute inset-0 h-full w-full object-cover"
        />

        {/* Gradient overlays */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/82 via-black/34 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-black/22 to-transparent" />

        {/* Bottom info */}
        <div className="absolute bottom-7 left-5 right-5 z-10 sm:bottom-8 sm:left-6 sm:right-6">
          <h3 className="mb-1.5 line-clamp-2 text-[22px] font-bold leading-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)] sm:text-2xl">
            {content.title}
          </h3>
          {creatorIdentity && (
            <div className="truncate text-sm font-medium text-white/86 drop-shadow-[0_1px_8px_rgba(0,0,0,0.72)]">
              {creatorIdentity.displayName}
              {creatorIdentity.username ? (
                <span className="ml-2 text-white/60">@{creatorIdentity.username}</span>
              ) : null}
            </div>
          )}
        </div>
            </div>

        {/* Side action bar */}
        <div className="absolute bottom-28 right-3 z-10 flex flex-col items-center gap-4 sm:bottom-20 md:static md:translate-y-[38px] md:gap-5">
          {creatorIdentity && (
            <div className="rounded-full bg-[linear-gradient(135deg,#b91428,#43259d,#0e6fb7)] p-[2px] shadow-[0_0_14px_rgba(213,32,58,0.22)]">
              <UserAvatar
                size="default"
                name={creatorIdentity.displayName}
                src={creatorAvatarSrc}
                className="h-11 w-11 border-2 border-[#080013] bg-[#10131c]"
              />
            </div>
          )}
          <button
            type="button"
            className="group flex flex-col items-center gap-1"
            aria-label="Нравится"
            onClick={handleToggleLike}
            disabled={likeContent.isPending || unlikeContent.isPending}
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#d5203a]/22 bg-[#07020f]/54 text-white shadow-[0_0_16px_rgba(213,32,58,0.16)] backdrop-blur-md transition-all group-hover:border-[#ff6a78]/50 group-hover:bg-[#1b0712]/74">
              <Heart className={cn('h-5 w-5', liked && 'fill-current text-[#ff4059]')} />
            </div>
            <span className="text-xs font-semibold text-white">{formatNumber(likeCount)}</span>
          </button>

          <button
            type="button"
            className="group flex flex-col items-center gap-1"
            aria-label="Комментарии"
            onClick={handleComments}
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#d5203a]/22 bg-[#07020f]/54 text-white shadow-[0_0_16px_rgba(213,32,58,0.16)] backdrop-blur-md transition-all group-hover:border-[#55b7ff]/50 group-hover:bg-[#0b1727]/74">
              <ChatCircle className="h-5 w-5" weight="fill" />
            </div>
            <span className="text-xs font-semibold text-white">{formatNumber(commentCount)}</span>
          </button>

          <button
            type="button"
            className="group flex flex-col items-center gap-1"
            aria-label="Поделиться"
            onClick={handleShare}
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#d5203a]/22 bg-[#07020f]/54 text-white shadow-[0_0_16px_rgba(213,32,58,0.16)] backdrop-blur-md transition-all group-hover:border-[#55b7ff]/50 group-hover:bg-[#0b1727]/74">
              <ShareNetwork className="h-5 w-5" weight="fill" />
            </div>
            <span className="text-xs font-semibold text-white">{formatNumber(content.shareCount ?? 0)}</span>
          </button>
        </div>

        {/* Stream state indicator for active card */}
        {isActive && (isLoading || error || !videoSrc) && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <div className="rounded-full bg-[#07020f]/62 px-4 py-2 text-sm text-white/90 shadow-[0_0_16px_rgba(213,32,58,0.14)] backdrop-blur-md">
              Видео готовится…
            </div>
          </div>
        )}

        {/* Center play indicator (shown when paused) */}
        {!isActive && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/16 bg-[#07020f]/40 shadow-[0_0_18px_rgba(213,32,58,0.16)] backdrop-blur-md">
              <Play className="ml-1 h-8 w-8 text-white" weight="fill" />
            </div>
          </div>
        )}
        </div>
        </div>

        <Sheet open={commentsOpen} onOpenChange={setCommentsOpen}>
          <SheetContent
            side="bottom"
            className="h-[75vh] bg-mp-surface border-mp-border text-mp-text-primary flex flex-col"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <SheetHeader>
              <SheetTitle className="text-mp-text-primary">Комментарии</SheetTitle>
            </SheetHeader>

            <div className="mt-4 flex-1 min-h-0 overflow-y-auto space-y-4 pr-1">
              {commentsQuery.isLoading ? (
                <div className="text-sm text-mp-text-secondary">Загрузка…</div>
              ) : commentsQuery.isError ? (
                <div className="text-sm text-mp-text-secondary">Не удалось загрузить комментарии</div>
              ) : (commentsQuery.data?.items?.length ?? 0) === 0 ? (
                <div className="text-sm text-mp-text-secondary">Пока нет комментариев</div>
              ) : (
                commentsQuery.data!.items.map((c) => {
                  const author = c.author;
                  const name =
                    `${author?.firstName ?? ""} ${author?.lastName ?? ""}`.trim() ||
                    author?.username ||
                    'Пользователь';
                  const avatarSrc = author?.avatarUrl
                    ? normalizeMediaUrl(author.avatarUrl)
                    : undefined;

                  return (
                    <div key={c.id} className="flex gap-3">
                      <UserAvatar size="sm" name={name} src={avatarSrc} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <div className="text-sm font-medium text-mp-text-primary truncate">
                            {name}
                          </div>
                          <div className="text-xs text-mp-text-secondary">
                            {formatRelativeTime(c.createdAt)}
                          </div>
                        </div>
                        <div className="text-sm text-mp-text-secondary whitespace-pre-wrap break-words">
                          {c.text}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-4 border-t border-mp-border pt-4">
              {isAuthenticated ? (
                <div className="space-y-2">
                  <div className="text-xs text-mp-text-secondary">
                    Комментирует: {user ? `${user.firstName} ${user.lastName}` : 'вы'}
                  </div>
                  <Textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Написать комментарий…"
                    className="bg-mp-surface-elevated border-mp-border text-mp-text-primary placeholder:text-mp-text-disabled"
                    maxLength={2000}
                  />
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={handleSubmitComment}
                      disabled={!commentText.trim() || createComment.isPending}
                    >
                      Отправить
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-mp-text-secondary">
                  Войдите, чтобы оставить комментарий.
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </>
    );
  }
);
ShortCard.displayName = 'ShortCard';

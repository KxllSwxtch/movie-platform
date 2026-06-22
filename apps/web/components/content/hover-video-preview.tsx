"use client";

import { ShareNetwork } from "@phosphor-icons/react";
// hls.js exposes the runtime constructor as its default export in this version.
// eslint-disable-next-line import/no-named-as-default
import Hls, { Events } from "hls.js";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import type { StreamUrlResponse } from "@/hooks/use-streaming";
import { api, endpoints } from "@/lib/api-client";
import { normalizeMediaUrl } from "@/lib/media-url";
import { buildAbsoluteAppUrl, cn, copyTextToClipboard, formatDuration } from "@/lib/utils";

let activePreviewStop: (() => void) | null = null;
const previewStreamCache = new Map<string, StreamUrlResponse>();

interface HoverVideoPreviewProps {
  contentId: string;
  title: string;
  href: string;
  duration?: number | null;
  className?: string;
}

export function HoverVideoPreview({
  contentId,
  title,
  href,
  duration,
  className,
}: HoverVideoPreviewProps) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const hlsRef = React.useRef<Hls | null>(null);
  const hoverTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [canHover, setCanHover] = React.useState(false);
  const [isHovering, setIsHovering] = React.useState(false);
  const [shouldPreview, setShouldPreview] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [videoDuration, setVideoDuration] = React.useState(duration ?? 0);
  const [streamData, setStreamData] = React.useState<StreamUrlResponse | undefined>();
  const streamUrl = streamData?.streamUrl
    ? normalizeMediaUrl(streamData.streamUrl as string)
    : undefined;
  const totalDuration = videoDuration || streamData?.duration || duration || 0;
  const progress = totalDuration > 0 ? Math.min(100, (currentTime / totalDuration) * 100) : 0;
  const remaining = Math.max(0, totalDuration - currentTime);

  React.useEffect(() => {
    if (!shouldPreview) return undefined;
    const cached = previewStreamCache.get(contentId);
    if (cached) {
      setStreamData(cached);
      return undefined;
    }

    const controller = new AbortController();
    void api
      .get<StreamUrlResponse>(endpoints.streaming.url(contentId), {
        signal: controller.signal,
        retries: 0,
      })
      .then((response) => {
        const data = response.data;
        previewStreamCache.set(contentId, data);
        setStreamData(data);
      })
      .catch(() => undefined);

    return () => controller.abort();
  }, [contentId, shouldPreview]);

  const stopPreview = React.useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setIsHovering(false);
    setShouldPreview(false);
    setStreamData(undefined);
    setCurrentTime(0);
    if (activePreviewStop === stopPreview) activePreviewStop = null;
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.currentTime = 0;
      video.removeAttribute("src");
    }
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
  }, []);

  React.useEffect(() => {
    const query = window.matchMedia("(hover: hover) and (pointer: fine)");
    const updateCapability = () => {
      setCanHover(query.matches);
      if (!query.matches) stopPreview();
    };
    updateCapability();
    query.addEventListener("change", updateCapability);
    return () => query.removeEventListener("change", updateCapability);
  }, [stopPreview]);

  React.useEffect(() => {
    if (!streamData?.duration) return;
    setVideoDuration(streamData.duration);
  }, [streamData?.duration]);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video || !shouldPreview || !streamUrl) return undefined;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    video.muted = true;
    video.playsInline = true;
    const isHls = /\.m3u8(\?|$)/i.test(streamUrl);

    // eslint-disable-next-line import/no-named-as-default-member
    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        maxBufferLength: 12,
        backBufferLength: 8,
        capLevelToPlayerSize: true,
      });
      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      hls.on(Events.MANIFEST_PARSED, () => {
        void video.play().catch(() => undefined);
      });
    } else {
      video.src = streamUrl;
      void video.play().catch(() => undefined);
    }

    return () => {
      video.pause();
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [shouldPreview, streamUrl]);

  React.useEffect(() => stopPreview, [stopPreview]);

  const handleMouseEnter = () => {
    if (!canHover || hoverTimerRef.current || shouldPreview) return;
    setIsHovering(true);
    hoverTimerRef.current = setTimeout(() => {
      hoverTimerRef.current = null;
      activePreviewStop?.();
      activePreviewStop = stopPreview;
      setShouldPreview(true);
    }, 200);
  };

  const sharePreview = async () => {
    const url = buildAbsoluteAppUrl(href);
    try {
      if (typeof navigator !== "undefined" && "share" in navigator) {
        await navigator.share({ title, url });
        return;
      }
    } catch {
      // Fall through to clipboard.
    }
    const copied = await copyTextToClipboard(url);
    if (copied) toast.success("Ссылка скопирована");
    else toast.error("Не удалось скопировать ссылку");
  };

  const handleShare = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    void sharePreview();
  };

  if (!canHover) return null;

  return (
    <div
      className={cn(
        "pointer-events-auto absolute inset-0 z-20 opacity-0 transition-opacity duration-300 hover-hover:group-hover:opacity-100",
        (isHovering || shouldPreview) && "opacity-100",
        className,
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={stopPreview}
    >
      <Link href={href} className="absolute inset-0 z-10" aria-label={title} />
      <video
        ref={videoRef}
        muted
        playsInline
        preload="metadata"
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onDurationChange={(event) => {
          if (Number.isFinite(event.currentTarget.duration)) {
            setVideoDuration(event.currentTarget.duration);
          }
        }}
        className={cn(
          "absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300",
          shouldPreview && streamUrl && "opacity-100",
        )}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,0,16,0.08),rgba(5,0,16,0.44)_58%,rgba(5,0,16,0.82))]" />
      <button
        type="button"
        aria-label="Поделиться"
        onClick={handleShare}
        className="pointer-events-auto absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-[#d5203a]/22 bg-[#07020f]/72 text-white shadow-[0_0_18px_rgba(213,32,58,0.16)] backdrop-blur-md transition-all duration-200 hover:border-[#55b7ff]/60 hover:text-[#8fd3ff] hover:shadow-[0_0_24px_rgba(85,183,255,0.24)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#55b7ff]"
      >
        <ShareNetwork className="h-4 w-4" />
      </button>
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <div className="mb-2 h-1 overflow-hidden rounded-full bg-white/16">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#ff2f8e,#b94bff,#45b7ff)] shadow-[0_0_16px_rgba(185,75,255,0.7)] transition-[width] duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-white/88">
          <span>{formatDuration(Math.floor(currentTime))}</span>
          <span className="ml-auto rounded-full border border-white/10 bg-white/8 px-2 py-0.5 text-white/76 backdrop-blur-md">
            -{formatDuration(Math.floor(remaining))}
          </span>
        </div>
      </div>
    </div>
  );
}

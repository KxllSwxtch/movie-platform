"use client";

import { FilmStrip } from "@phosphor-icons/react";
import Image, { type ImageProps } from "next/image";
import { useEffect, useState } from "react";

import { normalizeMediaUrl } from "@/lib/media-url";
import { cn } from "@/lib/utils";

interface ContentImageProps extends Omit<ImageProps, "onError"> {
  fallbackIcon?: React.ReactNode;
  fallbackClassName?: string;
}

/**
 * Image wrapper with graceful error fallback.
 * When src is falsy or the image fails to load, renders
 * a placeholder icon instead of a broken-image icon.
 */
export function ContentImage({
  src,
  fallbackIcon,
  fallbackClassName,
  className,
  alt,
  unoptimized,
  ...props
}: ContentImageProps) {
  const [hasError, setHasError] = useState(false);

  const normalizedSrc = typeof src === "string" ? normalizeMediaUrl(src) : src;

  // Next.js Image optimizer is strict about upstream response headers.
  // Our MinIO proxy (/minio/*) can return objects without ideal metadata in dev,
  // so we bypass optimization for these URLs to avoid 400 from /_next/image.
  const isMinioProxyPath =
    typeof normalizedSrc === "string" && normalizedSrc.startsWith("/minio/");

  // In Docker dev, the Next.js server runs in a container where `localhost` points to itself.
  // If we try to optimize `http://localhost:4000/...` (API) or `http://localhost:9000/...` (MinIO),
  // the optimizer fetch will fail and return 500. For these URLs, bypass optimization so the
  // browser fetches them directly.
  const isLocalhostAbsoluteUrl = (() => {
    if (typeof normalizedSrc !== "string") return false;
    if (
      !normalizedSrc.startsWith("http://") &&
      !normalizedSrc.startsWith("https://")
    )
      return false;
    try {
      const u = new URL(normalizedSrc);
      return u.hostname === "localhost" || u.hostname === "127.0.0.1";
    } catch {
      return false;
    }
  })();

  const finalUnoptimized =
    unoptimized ?? (isMinioProxyPath || isLocalhostAbsoluteUrl);

  // Reset error state when src changes
  useEffect(() => {
    setHasError(false);
  }, [normalizedSrc]);

  if (!normalizedSrc || hasError) {
    return (
      <div
        className={cn(
          "relative flex h-full w-full items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_28%_18%,rgba(213,32,58,0.24),transparent_34%),radial-gradient(circle_at_78%_70%,rgba(85,183,255,0.18),transparent_36%),linear-gradient(135deg,rgba(22,8,34,0.98),rgba(5,7,18,0.98))]",
          "before:absolute before:inset-0 before:bg-[linear-gradient(180deg,rgba(255,255,255,0.07),transparent_34%,rgba(0,0,0,0.28))]",
          "after:absolute after:inset-0 after:shadow-[inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-40px_70px_rgba(0,0,0,0.34)]",
          fallbackClassName,
        )}
      >
        <div className="relative z-10 flex flex-col items-center gap-2">
          <div className="grid h-14 w-14 place-items-center rounded-full border border-white/12 bg-white/[0.06] text-white/66 shadow-[0_0_26px_rgba(213,32,58,0.18),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-md">
            {fallbackIcon ?? (
              <FilmStrip className="h-7 w-7 text-white/68" weight="duotone" />
            )}
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.24em] text-white/42">
            SESH
          </span>
        </div>
      </div>
    );
  }

  return (
    <Image
      src={normalizedSrc}
      alt={alt}
      className={cn("object-cover", className)}
      onError={() => setHasError(true)}
      unoptimized={finalUnoptimized}
      {...props}
    />
  );
}

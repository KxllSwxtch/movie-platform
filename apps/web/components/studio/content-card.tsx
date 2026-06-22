'use client';

import { ArrowUp, Eye, PencilSimple } from '@phosphor-icons/react';
import type { Content } from '@movie-platform/shared';
import Link from 'next/link';

import { ContentImage } from '@/components/content/content-image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { normalizeMediaUrl } from '@/lib/media-url';
import { formatViewCount } from '@/lib/utils';

import { ContentStatusBadge } from './content-status-badge';
import { ContentTypeBadge } from './content-type-badge';

interface StudioContentCardProps {
  content: Content;
  onPublish?: (id: string) => void;
  isPublishing?: boolean;
}

export function StudioContentCard({
  content,
  onPublish,
  isPublishing,
}: StudioContentCardProps) {
  const formattedDate = new Date(content.createdAt).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const canPublish = content.status === 'DRAFT' && Boolean(onPublish);

  return (
    <Card className="group overflow-hidden rounded-2xl border border-white/[0.08] bg-[#090713]/72 transition-colors hover:border-[#c70f4f]/35">
      <div className="relative aspect-video overflow-hidden bg-[#070913]">
        {content.thumbnailUrl ? (
          <ContentImage
            src={normalizeMediaUrl(content.thumbnailUrl)}
            alt={content.title}
            fill
            className="object-cover transition-transform duration-200 group-hover:scale-[1.02]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs text-mp-text-disabled">Нет обложки</span>
          </div>
        )}

        <span className="absolute right-2 top-2 rounded-md bg-black/75 px-1.5 py-0.5 text-[10px] font-bold text-white">
          {content.ageCategory}
        </span>
      </div>

      <div className="space-y-3 p-4">
        <h3 className="line-clamp-2 min-h-[20px] text-sm font-bold text-white">
          {content.title}
        </h3>

        <div className="flex flex-wrap items-center gap-1.5">
          <ContentTypeBadge type={content.contentType} />
          <ContentStatusBadge status={content.status} />
        </div>

        <div className="flex items-center justify-between gap-3 text-xs text-mp-text-secondary">
          <div className="flex min-w-0 items-center gap-1">
            <Eye className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{formatViewCount(content.viewCount)}</span>
          </div>

          <span className="shrink-0">{formattedDate}</span>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            className={canPublish ? 'h-10 flex-[0.9] rounded-xl' : 'h-10 w-full rounded-xl'}
            asChild
          >
            <Link href={`/studio/${content.id}`}>
              <PencilSimple className="mr-1.5 h-3.5 w-3.5 shrink-0" />
              <span>Изменить</span>
            </Link>
          </Button>

          {canPublish && (
            <Button
              variant="default"
              size="sm"
              className="h-10 flex-[1.15] rounded-xl px-3 whitespace-nowrap"
              onClick={() => onPublish?.(content.id)}
              disabled={isPublishing}
            >
              <ArrowUp className="mr-1.5 h-3.5 w-3.5 shrink-0" />
              <span>{isPublishing ? 'Проверка...' : 'На модерацию'}</span>
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

export function StudioContentCardSkeleton() {
  return (
    <Card className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#090713]/72">
      <Skeleton className="aspect-video w-full" />

      <div className="space-y-3 p-4">
        <Skeleton className="h-4 w-3/4" />

        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>

        <div className="flex justify-between">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-24" />
        </div>

        <div className="flex gap-2">
          <Skeleton className="h-10 flex-1 rounded-xl" />
          <Skeleton className="h-10 flex-1 rounded-xl" />
        </div>
      </div>
    </Card>
  );
}
import type { ShortContent } from '@/components/content';

export function getCreatorName(
  creator:
    | string
    | {
        firstName?: string;
        lastName?: string;
        username?: string;
      }
    | undefined,
) {
  if (!creator) return 'movieplatform';
  if (typeof creator === 'string') return creator;
  return (
    creator.username ||
    [creator.firstName, creator.lastName].filter(Boolean).join(' ') ||
    'movieplatform'
  );
}

export function mapContentItemToShort(item: {
  id?: string;
  title?: string | null;
  thumbnailUrl?: string | null;
  creator?:
    | string
    | {
        firstName?: string;
        lastName?: string;
        username?: string;
      }
    | null;
  likeCount?: number | null;
  commentCount?: number | null;
  shareCount?: number | null;
}): ShortContent {
  return {
    id: item.id || '',
    title: item.title || 'Untitled short',
    thumbnailUrl: item.thumbnailUrl || '/images/movie-placeholder.jpg',
    creator: getCreatorName(item.creator ?? undefined),
    likeCount: item.likeCount ?? 0,
    commentCount: item.commentCount ?? 0,
    shareCount: item.shareCount ?? 0,
  };
}

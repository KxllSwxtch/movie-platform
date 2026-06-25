import type { ShortContent } from "@/components/content";
import type { CreatorInput } from "@/lib/author-identity";

const fallbackCreator = {
  displayName: "SESH",
  username: "movieplatform",
};

export function mapContentItemToShort(item: {
  id?: string;
  slug?: string | null;
  title?: string | null;
  contentType?: string | null;
  thumbnailUrl?: string | null;
  creator?: CreatorInput | null;
  likeCount?: number | null;
  commentCount?: number | null;
  shareCount?: number | null;
}): ShortContent {
  return {
    id: item.id || "",
    slug: item.slug || item.id || "",
    title: item.title || "Untitled short",
    contentType: item.contentType || "SHORT",
    thumbnailUrl: item.thumbnailUrl || "/images/movie-placeholder.jpg",
    creator: item.creator ?? fallbackCreator,
    likeCount: item.likeCount ?? 0,
    commentCount: item.commentCount ?? 0,
    shareCount: item.shareCount ?? 0,
  };
}

export function isSameShort(short: ShortContent, slugOrId: string) {
  return short.id === slugOrId || short.slug === slugOrId;
}

export function prioritizeInitialShort(
  feedShorts: ShortContent[],
  slugOrId: string,
  targetShort?: ShortContent | null,
): ShortContent[] {
  if (!slugOrId) return feedShorts;

  const firstShort =
    targetShort ?? feedShorts.find((short) => isSameShort(short, slugOrId));

  if (!firstShort) return feedShorts;

  return [
    firstShort,
    ...feedShorts.filter(
      (short) => short.id !== firstShort.id && short.slug !== firstShort.slug,
    ),
  ];
}

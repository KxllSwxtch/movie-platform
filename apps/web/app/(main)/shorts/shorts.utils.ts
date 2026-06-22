import type { ShortContent } from "@/components/content";
import type { CreatorInput } from "@/lib/author-identity";

const fallbackCreator = {
  displayName: "SESH",
  username: "movieplatform",
};

export function mapContentItemToShort(item: {
  id?: string;
  title?: string | null;
  thumbnailUrl?: string | null;
  creator?: CreatorInput | null;
  likeCount?: number | null;
  commentCount?: number | null;
  shareCount?: number | null;
}): ShortContent {
  return {
    id: item.id || "",
    title: item.title || "Untitled short",
    thumbnailUrl: item.thumbnailUrl || "/images/movie-placeholder.jpg",
    creator: item.creator ?? fallbackCreator,
    likeCount: item.likeCount ?? 0,
    commentCount: item.commentCount ?? 0,
    shareCount: item.shareCount ?? 0,
  };
}

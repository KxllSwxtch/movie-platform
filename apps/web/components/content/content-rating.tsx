"use client";

import * as React from "react";
import { Star } from "@phosphor-icons/react";
import { toast } from "sonner";

import { useContentRating, useUpsertContentRating } from "@/hooks/use-ratings";
import { useIsAuthenticated } from "@/stores/auth.store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/ui/avatar";
import { cn, formatRelativeTime } from "@/lib/utils";

interface ContentRatingProps {
  contentId: string;
  compact?: boolean;
}

export function ContentRating({
  contentId,
  compact = false,
}: ContentRatingProps) {
  const isAuthenticated = useIsAuthenticated();
  const ratingQuery = useContentRating(contentId, !!contentId);
  const upsertRating = useUpsertContentRating(contentId);
  const [rating, setRating] = React.useState(0);
  const [comment, setComment] = React.useState("");

  React.useEffect(() => {
    if (!ratingQuery.data?.userRating) return;
    setRating(ratingQuery.data.userRating.rating);
    setComment(ratingQuery.data.userRating.comment ?? "");
  }, [ratingQuery.data?.userRating]);

  const summary = ratingQuery.data;

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      toast.message("Войдите, чтобы оставить оценку");
      return;
    }
    if (rating < 1) {
      toast.message("Выберите оценку от 1 до 5");
      return;
    }
    await upsertRating.mutateAsync({
      rating,
      comment: comment.trim() || undefined,
    });
    toast.success("Оценка сохранена");
  };

  return (
    <section
      className={cn(
        "rounded-xl border border-mp-border bg-mp-surface/40 p-4",
        compact && "p-3",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2
            className={cn(
              "font-semibold text-mp-text-primary",
              compact ? "text-base" : "text-xl",
            )}
          >
            Рейтинг и отзывы
          </h2>
          <p className="text-sm text-mp-text-secondary">
            {summary?.ratingCount
              ? `${summary.averageRating.toFixed(1)} из 5, голосов: ${summary.ratingCount}`
              : "Оценок пока нет"}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              className="rounded p-1 text-mp-accent-primary transition-transform hover:scale-110"
              aria-label={`${value} звезд`}
              disabled={!isAuthenticated || upsertRating.isPending}
            >
              <Star
                className="h-6 w-6"
                weight={value <= rating ? "fill" : "regular"}
              />
            </button>
          ))}
        </div>
      </div>

      {!compact && (
        <div className="mt-4 space-y-4">
          <Textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder={
              isAuthenticated
                ? "Отзыв (необязательно)"
                : "Войдите, чтобы оставить отзыв"
            }
            disabled={!isAuthenticated || upsertRating.isPending}
            className="min-h-[92px] bg-mp-surface-elevated border-mp-border text-mp-text-primary"
            maxLength={2000}
          />
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={
                !isAuthenticated || upsertRating.isPending || rating < 1
              }
            >
              Сохранить отзыв
            </Button>
          </div>

          {(summary?.reviews?.length ?? 0) > 0 && (
            <div className="space-y-3 border-t border-mp-border pt-4">
              {summary!.reviews!.map((review) => {
                const author = review.author;
                const name =
                  `${author?.firstName ?? ""} ${author?.lastName ?? ""}`.trim() ||
                  author?.username ||
                  "Пользователь";
                return (
                  <div key={review.id} className="flex gap-3">
                    <UserAvatar
                      size="sm"
                      src={author?.avatarUrl ?? null}
                      name={name}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-mp-text-primary">
                          {name}
                        </span>
                        <span className="text-xs text-mp-accent-primary">
                          {review.rating}/5
                        </span>
                        <span className="text-xs text-mp-text-secondary">
                          {formatRelativeTime(review.updatedAt)}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="mt-1 whitespace-pre-wrap break-words text-sm text-mp-text-secondary">
                          {review.comment}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

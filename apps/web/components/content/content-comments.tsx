"use client";

import * as React from "react";
import { Trash } from "@phosphor-icons/react";
import { toast } from "sonner";

import {
  useContentComments,
  useCreateContentComment,
  useDeleteContentComment,
} from "@/hooks/use-comments";
import { useIsAuthenticated, useUser } from "@/stores/auth.store";
import { normalizeMediaUrl } from "@/lib/media-url";
import { formatRelativeTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/ui/avatar";

interface ContentCommentsProps {
  contentId: string;
  className?: string;
}

export function ContentComments({
  contentId,
  className,
}: ContentCommentsProps) {
  const [text, setText] = React.useState("");
  const user = useUser();
  const isAuthenticated = useIsAuthenticated();
  const commentsQuery = useContentComments(contentId, !!contentId);
  const createComment = useCreateContentComment(contentId);
  const deleteComment = useDeleteContentComment(contentId);
  const canModerate = user?.role === "ADMIN" || user?.role === "MODERATOR";

  const handleSubmit = async () => {
    const value = text.trim();
    if (!value) return;
    if (!isAuthenticated) {
      toast.message("Войдите, чтобы оставить комментарий");
      return;
    }

    await createComment.mutateAsync({ text: value });
    setText("");
  };

  return (
    <section className={className}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-mp-text-primary">
          Комментарии
        </h2>
        {commentsQuery.data && (
          <span className="text-sm text-mp-text-secondary">
            {commentsQuery.data.total}
          </span>
        )}
      </div>

      <div className="mb-6 rounded-xl border border-mp-border bg-mp-surface/40 p-4">
        <Textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={
            isAuthenticated
              ? "Написать комментарий..."
              : "Войдите, чтобы оставить комментарий"
          }
          disabled={!isAuthenticated || createComment.isPending}
          maxLength={2000}
          className="min-h-[96px] bg-mp-surface-elevated border-mp-border text-mp-text-primary"
        />
        <div className="mt-3 flex justify-end">
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={
              !isAuthenticated || createComment.isPending || !text.trim()
            }
          >
            Отправить
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {commentsQuery.isLoading ? (
          <p className="text-sm text-mp-text-secondary">
            Загрузка комментариев...
          </p>
        ) : commentsQuery.isError ? (
          <p className="text-sm text-mp-text-secondary">
            Не удалось загрузить комментарии
          </p>
        ) : (commentsQuery.data?.items?.length ?? 0) === 0 ? (
          <p className="rounded-xl border border-dashed border-mp-border py-8 text-center text-sm text-mp-text-secondary">
            Комментариев пока нет
          </p>
        ) : (
          commentsQuery.data!.items.map((comment) => {
            const author = comment.author;
            const authorName =
              `${author?.firstName ?? ""} ${author?.lastName ?? ""}`.trim() ||
              author?.username ||
              'Пользователь';
            const canDelete = canModerate || author?.id === user?.id;

            return (
              <div
                key={comment.id}
                className="flex gap-3 rounded-xl bg-mp-surface/30 p-4"
              >
                <UserAvatar
                  size="sm"
                  src={
                    author?.avatarUrl
                      ? normalizeMediaUrl(author.avatarUrl)
                      : null
                  }
                  name={authorName}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-mp-text-primary">
                        {authorName}
                      </p>
                      <p className="text-xs text-mp-text-secondary">
                        {formatRelativeTime(comment.createdAt)}
                      </p>
                    </div>
                    {canDelete && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteComment.mutate(comment.id)}
                        disabled={deleteComment.isPending}
                        aria-label="Удалить комментарий"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm text-mp-text-secondary">
                    {comment.text}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

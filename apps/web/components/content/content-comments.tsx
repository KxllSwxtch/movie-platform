"use client";

import * as React from "react";
import {
  ArrowBendUpLeft,
  ChatCircleDots,
  Heart,
  PaperPlaneTilt,
  ShieldCheck,
  SpinnerGap,
  Trash,
} from "@phosphor-icons/react";
import { toast } from "sonner";

import {
  useContentComments,
  useCreateContentComment,
  useDeleteContentComment,
} from "@/hooks/use-comments";
import { useIsAuthenticated, useUser } from "@/stores/auth.store";
import { normalizeMediaUrl } from "@/lib/media-url";
import { cn, formatNumber, formatRelativeTime } from "@/lib/utils";
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
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const user = useUser();
  const isAuthenticated = useIsAuthenticated();
  const commentsQuery = useContentComments(contentId, !!contentId);
  const createComment = useCreateContentComment(contentId);
  const deleteComment = useDeleteContentComment(contentId);
  const canModerate = user?.role === "ADMIN" || user?.role === "MODERATOR";
  const totalComments = commentsQuery.data?.total ?? 0;
  const commentSummary =
    totalComments > 0
      ? `${formatNumber(totalComments)} ${getCommentWord(totalComments)}`
      : "Нет комментариев";
  const userName =
    user ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.username || "вы" : "вы";

  React.useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [text]);

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
    <section
      className={cn(
        "relative overflow-hidden rounded-[24px] border border-white/10 bg-[radial-gradient(circle_at_18%_0%,rgba(213,32,58,0.16),transparent_28%),radial-gradient(circle_at_86%_8%,rgba(85,183,255,0.11),transparent_26%),linear-gradient(180deg,rgba(16,7,29,0.82),rgba(5,6,15,0.9))] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.34),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl sm:p-6 lg:p-7",
        className
      )}
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[22px] font-extrabold leading-tight text-white sm:text-2xl">
            Комментарии
          </h2>
          <p className="mt-1 text-sm font-medium text-white/52">
            {commentSummary}
          </p>
        </div>
        <div className="hidden h-10 items-center rounded-full border border-white/10 bg-white/[0.04] px-4 text-xs font-bold uppercase tracking-[0.14em] text-white/48 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:flex">
          SESH Talk
        </div>
      </div>

      <div className="mb-6 rounded-[20px] border border-white/10 bg-white/[0.045] p-3 shadow-[0_18px_48px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.07)] backdrop-blur-xl sm:p-4">
        {isAuthenticated && (
          <div className="mb-3 flex items-center gap-3">
            <UserAvatar
              size="sm"
              src={user?.avatarUrl ? normalizeMediaUrl(user.avatarUrl) : null}
              name={userName}
              className="h-9 w-9 border border-white/14 bg-[#120917] shadow-[0_0_20px_rgba(213,32,58,0.18)]"
            />
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-white/42">
                Комментирует как
              </p>
              <p className="truncate text-sm font-bold text-white">
                {userName}
              </p>
            </div>
          </div>
        )}
        <Textarea
          ref={textareaRef}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={
            isAuthenticated
              ? "Поделитесь своим мнением..."
              : "Войдите, чтобы оставить комментарий"
          }
          disabled={!isAuthenticated || createComment.isPending}
          maxLength={2000}
          rows={3}
          className="max-h-[180px] min-h-[104px] resize-none rounded-[18px] border-white/10 bg-[#060713]/72 px-4 py-4 text-[15px] leading-relaxed text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_0_0_1px_rgba(213,32,58,0.04)] outline-none transition-all duration-200 placeholder:text-white/34 hover:border-white/16 focus-visible:border-[#ff4163]/45 focus-visible:ring-2 focus-visible:ring-[#d5203a]/20 disabled:opacity-60"
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-xs font-medium text-white/36">
            {text.length}/2000
          </span>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={
              !isAuthenticated || createComment.isPending || !text.trim()
            }
            className="h-11 rounded-full border-0 bg-[linear-gradient(135deg,#d5203a_0%,#ff2d7a_52%,#7a5cff_100%)] px-5 font-bold text-white shadow-[0_0_22px_rgba(213,32,58,0.28),0_12px_28px_rgba(0,0,0,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(255,45,122,0.36),0_16px_36px_rgba(0,0,0,0.34)] active:translate-y-0 disabled:translate-y-0 disabled:opacity-45 disabled:shadow-none"
          >
            {createComment.isPending ? (
              <>
                <SpinnerGap className="h-4 w-4 animate-spin" />
                Отправляем
              </>
            ) : (
              <>
                <PaperPlaneTilt className="h-4 w-4" weight="fill" />
                Отправить
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {commentsQuery.isLoading ? (
          <div className="rounded-[18px] border border-white/8 bg-white/[0.035] p-5 text-sm font-medium text-white/54">
            Загрузка комментариев...
          </div>
        ) : commentsQuery.isError ? (
          <p className="rounded-[18px] border border-[#d5203a]/20 bg-[#d5203a]/8 p-5 text-sm font-medium text-white/64">
            Не удалось загрузить комментарии
          </p>
        ) : (commentsQuery.data?.items?.length ?? 0) === 0 ? (
          <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[22px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.018))] px-6 py-12 text-center">
            <div className="relative mb-5">
              <div className="absolute inset-[-18px] rounded-full bg-[#d5203a]/20 blur-2xl" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-white/12 bg-[#0b0815]/76 text-[#ff6680] shadow-[0_0_28px_rgba(213,32,58,0.22),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl">
                <ChatCircleDots className="h-8 w-8" weight="duotone" />
              </div>
            </div>
            <h3 className="text-lg font-extrabold text-white">
              Комментариев пока нет
            </h3>
            <p className="mt-2 max-w-[280px] text-sm leading-6 text-white/48">
              Будьте первым, кто начнет обсуждение.
            </p>
          </div>
        ) : (
          commentsQuery.data!.items.map((comment) => {
            const author = comment.author;
            const authorName =
              `${author?.firstName ?? ""} ${author?.lastName ?? ""}`.trim() ||
              author?.username ||
              'Пользователь';
            const canDelete = canModerate || author?.id === user?.id;
            const authorMeta = author as
              | (typeof author & {
                  role?: string | null;
                  verified?: boolean | null;
                  isVerified?: boolean | null;
                })
              | null
              | undefined;
            const role = authorMeta?.role;
            const isVerified = Boolean(authorMeta?.verified || authorMeta?.isVerified);

            return (
              <article
                key={comment.id}
                className="group flex gap-3 rounded-[20px] border border-white/[0.07] bg-white/[0.04] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.045)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#d5203a]/22 hover:bg-white/[0.06] hover:shadow-[0_18px_42px_rgba(0,0,0,0.24),0_0_24px_rgba(213,32,58,0.08)] sm:gap-4 sm:p-5"
              >
                <UserAvatar
                  size="default"
                  src={
                    author?.avatarUrl
                      ? normalizeMediaUrl(author.avatarUrl)
                      : null
                  }
                  name={authorName}
                  className="h-10 w-10 border border-white/14 bg-[#120917] shadow-[0_0_20px_rgba(213,32,58,0.18)] ring-2 ring-[#d5203a]/10 sm:h-11 sm:w-11"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <p className="truncate text-[15px] font-extrabold leading-tight text-white">
                          {authorName}
                        </p>
                        {isVerified && (
                          <ShieldCheck className="h-4 w-4 flex-none text-[#55b7ff]" weight="fill" />
                        )}
                        {role && (
                          <span className="rounded-full border border-[#d5203a]/24 bg-[#d5203a]/12 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#ff8a9b]">
                            {role}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs font-medium text-white/42">
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
                        className="h-9 w-9 rounded-full text-white/42 transition-all hover:bg-[#d5203a]/14 hover:text-white"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <p className="mt-3 whitespace-pre-wrap break-words text-[15px] leading-7 text-white/72">
                    {comment.text}
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-xs font-bold text-white/46">
                    <button
                      type="button"
                      className="inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 transition-colors hover:bg-white/[0.06] hover:text-white"
                    >
                      <Heart className="h-3.5 w-3.5" />
                      Нравится
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 transition-colors hover:bg-white/[0.06] hover:text-white"
                    >
                      <ArrowBendUpLeft className="h-3.5 w-3.5" />
                      Ответить
                    </button>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}

function getCommentWord(count: number) {
  const abs = Math.abs(count);
  const lastTwo = abs % 100;
  const last = abs % 10;

  if (lastTwo >= 11 && lastTwo <= 14) return "комментариев";
  if (last === 1) return "комментарий";
  if (last >= 2 && last <= 4) return "комментария";
  return "комментариев";
}

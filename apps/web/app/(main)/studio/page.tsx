"use client";

import {
  FilmSlate,
  Eye,
  FileText,
  CheckCircle,
  Plus,
} from "@phosphor-icons/react";
import Link from "next/link";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StudioPageHeader } from "@/components/studio/studio-page-header";
import {
  StudioContentCard,
  StudioContentCardSkeleton,
} from "@/components/studio/content-card";
import { ContentFilters } from "@/components/studio/content-filters";
import { useAdminContent, useUpdateContent } from "@/hooks/use-admin-content";
import { api, endpoints, ApiError } from "@/lib/api-client";
import { toast } from "sonner";

/**
 * Studio dashboard — content list with stats, filters, and grid
 */
export default function StudioPage() {
  const [search, setSearch] = React.useState("");
  const [contentType, setContentType] = React.useState("all");
  const [status, setStatus] = React.useState("all");
  const [page, setPage] = React.useState(1);
  const [debouncedSearch, setDebouncedSearch] = React.useState("");

  // Debounce search input
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading } = useAdminContent({
    page,
    limit: 12,
    search: debouncedSearch || undefined,
    contentType: contentType !== "all" ? contentType : undefined,
    status: status !== "all" ? status : undefined,
  });

  const updateContent = useUpdateContent();
  const [publishingId, setPublishingId] = React.useState<string | null>(null);

  const items = data?.items || [];
  const meta = (
    data as unknown as { meta?: { total: number; totalPages: number } }
  )?.meta;
  const total = meta?.total || data?.total || 0;
  const totalPages = meta?.totalPages || data?.totalPages || 1;

  // Compute stats from current data (simplified — ideally a separate endpoint)
  const publishedCount = items.filter((c) => c.status === "PUBLISHED").length;
  const draftCount = items.filter((c) => c.status === "DRAFT").length;
  const totalViews = items.reduce((sum, c) => sum + (c.viewCount || 0), 0);

  const handlePublish = async (id: string) => {
    setPublishingId(id);
    try {
      const content = items.find((item) => item.id === id);
      const isStructuredContent =
        content?.contentType === "SERIES" ||
        content?.contentType === "TUTORIAL";

      if (isStructuredContent) {
        const structureResponse = await api.get<{
          seasons?: Array<{
            episodes?: Array<{ hasVideo?: boolean; encodingStatus?: string }>;
          }>;
        }>(endpoints.adminContent.structure(id));
        const structure = (structureResponse as any)?.data || structureResponse;
        const episodes =
          structure?.seasons?.flatMap(
            (season: {
              episodes?: Array<{ hasVideo?: boolean; encodingStatus?: string }>;
            }) => season.episodes ?? [],
          ) ?? [];

        const hasCompletedEpisodeVideo = episodes.some(
          (episode: { hasVideo?: boolean; encodingStatus?: string }) =>
            episode.hasVideo === true && episode.encodingStatus === "COMPLETED",
        );

        if (!hasCompletedEpisodeVideo) {
          toast.error(
            "Нельзя опубликовать без готового видео у эпизода или урока.",
          );
          return;
        }

        updateContent.mutate({ id, status: "PENDING" });
        return;
      }

      const statusResponse = await api.get<{
        hasVideo: boolean;
        status: string;
      }>(endpoints.adminVideo.status(id));
      const payload = (statusResponse as any)?.data || statusResponse;

      if (payload?.hasVideo === false) {
        toast.error(
          "Нельзя опубликовать без видео. Откройте контент и загрузите видео для эпизода, урока или самого материала.",
        );
        return;
      }

      if (payload?.status && payload.status !== "COMPLETED") {
        toast.error(
          "Видео ещё обрабатывается. Дождитесь статуса «Готово» и повторите.",
        );
        return;
      }

      updateContent.mutate({ id, status: "PENDING" });
    } catch (err) {
      const e = err as unknown;
      if (e instanceof ApiError) {
        toast.error(e.message || "Не удалось проверить статус видео");
      } else {
        toast.error("Не удалось проверить статус видео");
      }
    } finally {
      setPublishingId(null);
    }
  };

  const stats = [
    { label: "Всего контента", value: total, icon: FilmSlate },
    { label: "Опубликовано", value: publishedCount, icon: CheckCircle },
    { label: "Черновики", value: draftCount, icon: FileText },
    {
      label: "Просмотры",
      value: totalViews.toLocaleString("ru-RU"),
      icon: Eye,
    },
  ];

  return (
    <div className="sesh-studio-page py-6 md:py-8 space-y-8">
      <StudioPageHeader
        title="Мой контент"
        description="Управление контентом на платформе"
        action={
          <Button asChild className="sesh-studio-create-button">
            <Link href="/studio/create">
              <Plus className="mr-2 h-4 w-4" />
              Создать контент
            </Link>
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="sesh-studio-stat-card">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="sesh-studio-stat-icon rounded-lg p-2.5">
                <stat.icon className="h-5 w-5 text-mp-accent-primary" />
              </div>
              <div>
                <p className="text-xs text-mp-text-secondary">{stat.label}</p>
                <p className="text-lg font-bold text-mp-text-primary">
                  {stat.value}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <ContentFilters
        search={search}
        onSearchChange={setSearch}
        contentType={contentType}
        onContentTypeChange={(v) => {
          setContentType(v);
          setPage(1);
        }}
        status={status}
        onStatusChange={(v) => {
          setStatus(v);
          setPage(1);
        }}
      />

      {/* Content grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <StudioContentCardSkeleton key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card className="sesh-studio-empty-card">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FilmSlate className="h-12 w-12 text-mp-text-disabled mb-4" />
            <h3 className="text-lg font-semibold text-mp-text-primary mb-1">
              Контент не найден
            </h3>
            <p className="text-sm text-mp-text-secondary mb-6 max-w-sm">
              {debouncedSearch || contentType !== "all" || status !== "all"
                ? "Попробуйте изменить фильтры поиска"
                : "Создайте свой первый контент, чтобы он появился здесь"}
            </p>
            {!debouncedSearch && contentType === "all" && status === "all" && (
              <Button
                asChild
              >
                <Link href="/studio/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Создать контент
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((content) => (
            <StudioContentCard
              key={content.id}
              content={content}
              onPublish={handlePublish}
              isPublishing={
                publishingId === content.id || updateContent.isPending
              }
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Назад
          </Button>
          <span className="text-sm text-mp-text-secondary">
            {page} из {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Далее
          </Button>
        </div>
      )}
    </div>
  );
}

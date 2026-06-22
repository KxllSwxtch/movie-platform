"use client";

import {
  Archive,
  CheckCircle,
  FilmStrip,
  NotePencil,
  Sparkle,
} from "@phosphor-icons/react";
import * as React from "react";

import { contentColumns } from "@/components/admin/content/content-columns";
import { DataTable } from "@/components/admin/data-table/data-table";
import { StatsCard } from "@/components/admin/dashboard/stats-card";
import { AdminPageHeader } from "@/components/admin/layout/admin-page-header";
import { Container } from "@/components/ui/container";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdminContent, useDeleteContent } from "@/hooks/use-admin-content";

export default function AdminContentPage() {
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(20);
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("ALL");
  const [contentType, setContentType] = React.useState("ALL");
  const [accessType, setAccessType] = React.useState("ALL");

  const { data, isLoading } = useAdminContent({
    page,
    limit,
    search: search || undefined,
    status: status === "ALL" ? undefined : status,
    contentType: contentType === "ALL" ? undefined : contentType,
    isFree: accessType === "ALL" ? undefined : accessType === "FREE",
  });

  const deleteContent = useDeleteContent();

  React.useEffect(() => {
    const handleArchive = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (detail?.id && window.confirm(`Архивировать "${detail.title}"?`)) {
        deleteContent.mutate(detail.id);
      }
    };

    window.addEventListener("admin:archive-content", handleArchive);
    return () =>
      window.removeEventListener("admin:archive-content", handleArchive);
  }, [deleteContent]);

  const items = data?.items || [];
  const totalContent = data?.total || 0;
  const publishedCount = items.filter(
    (item) => item.status === "PUBLISHED",
  ).length;
  const draftCount = items.filter((item) => item.status === "DRAFT").length;
  const archivedCount = items.filter(
    (item) => item.status === "ARCHIVED",
  ).length;

  const resetPage = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };

  return (
    <div className="sesh-moderation-page">
      <Container size="xl" className="sesh-moderation-content py-8">
        <AdminPageHeader
          title="Контент"
          description="Библиотека контента и модерация публикаций"
          breadcrumbItems={[
            { label: "Главная", href: "/admin" },
            { label: "Контент" },
          ]}
          className="sesh-moderation-header"
        >
          <div
            className="sesh-moderation-welcome"
            aria-label="Раздел управления контентом"
          >
            <div>
              <p>Добро пожаловать!</p>
              <span>Панель управления контентом</span>
            </div>
            <span className="sesh-moderation-welcome-icon" aria-hidden="true">
              <Sparkle weight="fill" />
            </span>
          </div>
        </AdminPageHeader>

        <div className="sesh-moderation-stats mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatsCard
            className="sesh-moderation-stat-card sesh-moderation-stat-card--primary"
            title="Всего контента"
            value={totalContent}
            icon={FilmStrip}
          />
          <StatsCard
            className="sesh-moderation-stat-card sesh-moderation-stat-card--secondary"
            title="Опубликовано"
            value={publishedCount}
            icon={CheckCircle}
          />
          <StatsCard
            className="sesh-moderation-stat-card sesh-moderation-stat-card--tertiary"
            title="Черновики"
            value={draftCount}
            icon={NotePencil}
          />
          <StatsCard
            className="sesh-moderation-stat-card sesh-moderation-stat-card--muted"
            title="Архив"
            value={archivedCount}
            icon={Archive}
          />
        </div>

        <div className="sesh-moderation-filters mb-4 grid gap-3 p-3 md:grid-cols-3">
          <Select value={contentType} onValueChange={resetPage(setContentType)}>
            <SelectTrigger>
              <SelectValue placeholder="Категория" />
            </SelectTrigger>
            <SelectContent className="sesh-moderation-select-menu">
              <SelectItem value="ALL">Все категории</SelectItem>
              <SelectItem value="TUTORIAL">Обучение</SelectItem>
              <SelectItem value="SERIES">Сериалы</SelectItem>
              <SelectItem value="CLIP">Видео</SelectItem>
              <SelectItem value="SHORT">Шорты</SelectItem>
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={resetPage(setStatus)}>
            <SelectTrigger>
              <SelectValue placeholder="Статус" />
            </SelectTrigger>
            <SelectContent className="sesh-moderation-select-menu">
              <SelectItem value="ALL">Все статусы</SelectItem>
              <SelectItem value="PUBLISHED">Опубликовано</SelectItem>
              <SelectItem value="DRAFT">Черновик</SelectItem>
              <SelectItem value="PENDING">Модерация</SelectItem>
              <SelectItem value="REJECTED">Отклонено</SelectItem>
              <SelectItem value="ARCHIVED">Архив</SelectItem>
            </SelectContent>
          </Select>

          <Select value={accessType} onValueChange={resetPage(setAccessType)}>
            <SelectTrigger>
              <SelectValue placeholder="Доступ" />
            </SelectTrigger>
            <SelectContent className="sesh-moderation-select-menu">
              <SelectItem value="ALL">Платный и бесплатный</SelectItem>
              <SelectItem value="PAID">Платный</SelectItem>
              <SelectItem value="FREE">Бесплатный</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="sesh-moderation-table">
          <DataTable
            columns={contentColumns}
            data={items}
            isLoading={isLoading}
            searchKey="title"
            searchPlaceholder="Поиск по названию..."
            manualPagination
            manualFiltering
            onSearch={(value) => {
              setSearch(value);
              setPage(1);
            }}
            pagination={
              data
                ? {
                    page: data.page,
                    limit: data.limit,
                    total: data.total,
                    totalPages: data.totalPages,
                  }
                : undefined
            }
            onPaginationChange={(newPage, newLimit) => {
              setPage(newPage);
              setLimit(newLimit);
            }}
          />
        </div>
      </Container>
    </div>
  );
}

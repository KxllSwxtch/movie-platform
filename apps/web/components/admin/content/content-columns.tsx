"use client";

import {
  Archive,
  Eye,
  FilmStrip,
  PencilSimple,
  Play,
} from "@phosphor-icons/react";
import { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";

import { DataTableColumnHeader } from "@/components/admin/data-table/data-table-column-header";
import { DataTableRowActions } from "@/components/admin/data-table/data-table-row-actions";
import { AgeBadge, Badge } from "@/components/ui/badge";
import type { Content } from "@movie-platform/shared";

type AdminContentRow = Content & {
  creator?: {
    id: string;
    username?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    role?: string;
  } | null;
  likeCount?: number;
};

function getContentTypeBadge(type: string) {
  const config: Record<string, { label: string; className: string }> = {
    SERIES: {
      label: "Сериал",
      className: "bg-blue-500/20 text-blue-400 border-transparent",
    },
    CLIP: {
      label: "Видео",
      className: "bg-green-500/20 text-green-400 border-transparent",
    },
    SHORT: {
      label: "Шорт",
      className: "bg-yellow-500/20 text-yellow-400 border-transparent",
    },
    TUTORIAL: {
      label: "Обучение",
      className: "bg-purple-500/20 text-purple-400 border-transparent",
    },
  };

  const { label, className } = config[type] || { label: type, className: "" };
  return <Badge className={className}>{label}</Badge>;
}

function getContentStatusBadge(status: string) {
  const config: Record<string, { label: string; className: string }> = {
    DRAFT: {
      label: "Черновик",
      className: "bg-gray-500/20 text-gray-300 border-transparent",
    },
    PUBLISHED: {
      label: "Опубликовано",
      className: "bg-green-500/20 text-green-400 border-transparent",
    },
    PENDING: {
      label: "На модерации",
      className: "bg-yellow-500/20 text-yellow-400 border-transparent",
    },
    REJECTED: {
      label: "Отклонено",
      className: "bg-red-500/20 text-red-400 border-transparent",
    },
    ARCHIVED: {
      label: "Архив",
      className: "bg-gray-500/20 text-gray-400 border-transparent",
    },
  };

  const { label, className } = config[status] || {
    label: status,
    className: "",
  };
  return <Badge className={className}>{label}</Badge>;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("ru-RU").format(value ?? 0);
}

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export const contentColumns: ColumnDef<Content>[] = [
  {
    accessorKey: "title",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Название" />
    ),
    cell: ({ row }) => (
      <div className="flex max-w-[320px] flex-col">
        <span className="truncate font-medium text-mp-text-primary">
          {row.original.title}
        </span>
        <span className="truncate font-mono text-xs text-mp-text-disabled">
          {row.original.slug}
        </span>
      </div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "contentType",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Категория" />
    ),
    cell: ({ row }) => getContentTypeBadge(row.original.contentType),
  },
  {
    id: "topic",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Тематика" />
    ),
    cell: ({ row }) => {
      const category = (
        row.original as Content & { category?: { name?: string } }
      ).category;
      return (
        <span className="text-sm text-mp-text-secondary">
          {category?.name ?? "—"}
        </span>
      );
    },
  },
  {
    id: "author",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Автор" />
    ),
    cell: ({ row }) => {
      const creator = (row.original as AdminContentRow).creator;
      const name =
        creator?.username ||
        [creator?.firstName, creator?.lastName].filter(Boolean).join(" ") ||
        creator?.email;

      return (
        <div className="flex max-w-[220px] flex-col">
          <span className="truncate text-sm font-medium text-mp-text-primary">
            {name || "—"}
          </span>
          <span className="truncate text-xs text-mp-text-disabled">
            {creator?.role || creator?.email || ""}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Статус" />
    ),
    cell: ({ row }) => getContentStatusBadge(row.original.status as string),
  },
  {
    accessorKey: "isFree",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Доступ" />
    ),
    cell: ({ row }) =>
      row.original.isFree ? (
        <Badge className="border-transparent bg-emerald-500/20 text-emerald-400">
          Бесплатный
        </Badge>
      ) : (
        <Badge className="border-transparent bg-violet-500/20 text-violet-300">
          Платный
        </Badge>
      ),
  },
  {
    accessorKey: "ageCategory",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Возраст" />
    ),
    cell: ({ row }) => <AgeBadge age={row.original.ageCategory} />,
  },
  {
    accessorKey: "viewCount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Просмотры" />
    ),
    cell: ({ row }) => (
      <span className="text-mp-text-secondary">
        {formatNumber(row.original.viewCount)}
      </span>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Создан" />
    ),
    cell: ({ row }) => (
      <span className="text-sm text-mp-text-secondary">
        {row.original.createdAt
          ? formatDate(row.original.createdAt as string | Date)
          : "—"}
      </span>
    ),
    enableSorting: true,
  },
  {
    id: "actions",
    cell: ({ row }) => <ContentRowActions row={row as { original: Content }} />,
  },
];

function ContentRowActions({ row }: { row: { original: Content } }) {
  const router = useRouter();
  const isStructured =
    row.original.contentType === "SERIES" ||
    row.original.contentType === "TUTORIAL";

  return (
    <DataTableRowActions
      row={row as never}
      actions={[
        {
          label: "Открыть",
          icon: Eye,
          onClick: () => router.push(`/admin/content/${row.original.id}`),
        },
        {
          label: "Редактировать",
          icon: PencilSimple,
          onClick: () => router.push(`/admin/content/${row.original.id}`),
        },
        {
          label: "Предпросмотр",
          icon: Play,
          onClick: () => router.push(`/watch/${row.original.id}?preview=1`),
        },
        ...(isStructured
          ? [
              {
                label: "Открыть структуру",
                icon: FilmStrip,
                onClick: () => router.push(`/admin/content/${row.original.id}`),
              },
            ]
          : []),
        {
          label: "Архивировать",
          icon: Archive,
          onClick: () => {
            window.dispatchEvent(
              new CustomEvent("admin:archive-content", {
                detail: { id: row.original.id, title: row.original.title },
              }),
            );
          },
          variant: "destructive",
          separator: true,
        },
      ]}
    />
  );
}

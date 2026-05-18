"use client";

import * as React from "react";
import {
  Funnel,
  GridNine,
  ListBullets,
  MagnifyingGlass,
  SlidersHorizontal,
  Sparkle,
} from "@phosphor-icons/react";

import {
  ClipCard,
  VideoCardSkeletonGrid,
  type AgeCategory,
} from "@/components/content";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Container } from "@/components/ui/container";
import { ContentGrid } from "@/components/ui/grid";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useContentCategories, useContentList } from "@/hooks/use-content";
import { normalizeAgeCategory } from "@/lib/age-category";
import { cn } from "@/lib/utils";

const SORT_OPTIONS = [
  { value: "createdAt", label: "Сначала новые" },
  { value: "viewCount", label: "По популярности" },
  { value: "rating", label: "По рейтингу" },
];

const AGE_FILTERS: { value: AgeCategory; label: string }[] = [
  { value: "0+", label: "0+" },
  { value: "6+", label: "6+" },
  { value: "12+", label: "12+" },
  { value: "16+", label: "16+" },
  { value: "18+", label: "18+" },
];

export default function VideosPage() {
  const [showFilters, setShowFilters] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [sortBy, setSortBy] = React.useState("createdAt");
  const [search, setSearch] = React.useState("");
  const [selectedAges, setSelectedAges] = React.useState<AgeCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<string | undefined>();
  const { data: categories = [] } = useContentCategories();

  const { data, isLoading } = useContentList({
    type: "CLIP",
    categoryId: selectedCategoryId,
    sortBy,
    search: search.trim() || undefined,
    age: selectedAges.length === 1 ? selectedAges[0] : undefined,
    page: currentPage,
    limit: 12,
  });

  const videos = React.useMemo(() => {
    const items = data?.data?.items ?? [];
    return items.map((item) => ({
      id: item.id,
      slug: item.slug,
      title: item.title,
      thumbnailUrl: item.thumbnailUrl || "/images/movie-placeholder.jpg",
      duration: item.duration,
      viewCount: item.viewCount,
      rating: item.averageRating ?? item.rating,
      ageCategory: normalizeAgeCategory(item.ageCategory || "0+"),
      category:
        typeof item.category === "object" && item.category !== null
          ? item.category.name
          : item.category,
    }));
  }, [data]);

  const total = data?.data?.total ?? 0;
  const totalPages = Math.ceil(total / 12);
  const activeCategoryName =
    categories.find((category) => category.id === selectedCategoryId)?.name || "Все";

  const handleAgeToggle = (age: AgeCategory) => {
    setSelectedAges((prev) =>
      prev.includes(age) ? prev.filter((a) => a !== age) : [...prev, age],
    );
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSelectedAges([]);
    setSelectedCategoryId(undefined);
    setSearch("");
    setCurrentPage(1);
  };

  const hasActiveFilters = selectedAges.length > 0 || !!selectedCategoryId || !!search.trim();

  const filterContent = (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-medium text-mp-text-primary">
          Возрастной рейтинг
        </h3>
        <div className="space-y-2">
          {AGE_FILTERS.map((age) => (
            <label
              key={age.value}
              className="flex cursor-pointer items-center gap-2"
            >
              <Checkbox
                checked={selectedAges.includes(age.value)}
                onCheckedChange={() => handleAgeToggle(age.value)}
              />
              <span className="text-sm text-mp-text-secondary">
                {age.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearFilters}
          className="w-full"
        >
          Сбросить фильтры
        </Button>
      )}
    </div>
  );

  return (
    <Container size="full" className="py-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-mp-text-primary">Видео</h1>
          <p className="mt-1 text-sm text-mp-text-secondary">
            {total} видео найдено
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-64">
            <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mp-text-secondary" />
            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setCurrentPage(1);
              }}
              placeholder="Поиск видео"
              className="pl-9"
            />
          </div>

          <Select
            value={sortBy}
            onValueChange={(value) => {
              setSortBy(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Сортировка" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center rounded-lg border border-mp-border p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "rounded p-1.5 transition-colors",
                viewMode === "grid"
                  ? "bg-mp-accent-primary/20 text-mp-accent-primary"
                  : "text-mp-text-secondary hover:text-mp-text-primary",
              )}
              aria-label="Grid view"
            >
              <GridNine className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "rounded p-1.5 transition-colors",
                viewMode === "list"
                  ? "bg-mp-accent-primary/20 text-mp-accent-primary"
                  : "text-mp-text-secondary hover:text-mp-text-primary",
              )}
              aria-label="List view"
            >
              <ListBullets className="h-4 w-4" />
            </button>
          </div>

          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Фильтры
            {selectedAges.length > 0 && (
              <span className="ml-1 rounded-full bg-mp-accent-primary px-1.5 py-0.5 text-xs">
                {selectedAges.length}
              </span>
            )}
          </Button>
        </div>
      </div>

      <div className="-mx-4 mb-6 overflow-x-auto px-4 sm:-mx-6 sm:px-6">
        <div className="flex min-w-max items-center gap-2 pb-1">
          <button
            type="button"
            onClick={() => {
              setSelectedCategoryId(undefined);
              setCurrentPage(1);
            }}
            className={cn(
              "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors",
              !selectedCategoryId
                ? "border-mp-accent-primary bg-mp-accent-primary text-white shadow-sm"
                : "border-mp-border bg-mp-surface/60 text-mp-text-secondary hover:bg-mp-surface hover:text-mp-text-primary",
            )}
          >
            <Sparkle className="h-4 w-4" />
            Все
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => {
                setSelectedCategoryId(category.id);
                setCurrentPage(1);
              }}
              className={cn(
                "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors",
                selectedCategoryId === category.id
                  ? "border-mp-accent-primary bg-mp-accent-primary text-white shadow-sm"
                  : "border-mp-border bg-mp-surface/60 text-mp-text-secondary hover:bg-mp-surface hover:text-mp-text-primary",
              )}
            >
              {category.iconUrl ? (
                <img
                  src={category.iconUrl}
                  alt=""
                  className="h-4 w-4 rounded object-cover"
                />
              ) : (
                <span className="h-2 w-2 rounded-full bg-current opacity-70" />
              )}
              {category.name}
            </button>
          ))}
        </div>
      </div>

      <div className="md:hidden">
        <Sheet open={showFilters} onOpenChange={setShowFilters}>
          <SheetContent side="left" className="w-80">
            <SheetHeader>
              <SheetTitle>Фильтры</SheetTitle>
            </SheetHeader>
            <div className="mt-4">{filterContent}</div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex gap-6">
        {showFilters && (
          <aside className="hidden w-64 shrink-0 md:block">
            {filterContent}
          </aside>
        )}

        <div className="min-w-0 flex-1">
          {isLoading ? (
            <VideoCardSkeletonGrid
              count={12}
              variant="series"
              columns={showFilters ? 4 : 5}
            />
          ) : videos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Funnel className="mb-4 h-12 w-12 text-mp-text-disabled" />
              <h3 className="mb-2 text-lg font-medium text-mp-text-primary">
                Ничего не найдено
              </h3>
              <p className="mb-4 text-mp-text-secondary">
                Попробуйте изменить поиск или фильтры
                {activeCategoryName !== "Все" ? ` в категории «${activeCategoryName}»` : ""}
              </p>
              <Button variant="outline" onClick={handleClearFilters}>
                Сбросить фильтры
              </Button>
            </div>
          ) : (
            <>
              <ContentGrid variant={showFilters || viewMode === "list" ? "compact" : "default"}>
                {videos.map((video) => (
                  <ClipCard key={video.id} content={video} />
                ))}
              </ContentGrid>

              {totalPages > 1 && (
                <div className="mt-8">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Container>
  );
}

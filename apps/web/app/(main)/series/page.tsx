'use client';

import * as React from 'react';
import { Funnel, SlidersHorizontal, GridNine, ListBullets } from '@phosphor-icons/react';

import { Container } from '@/components/ui/container';
import { ContentGrid } from '@/components/ui/grid';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { SeriesCard, VideoCardSkeletonGrid, type SeriesContent, type AgeCategory } from '@/components/content';
import { cn } from '@/lib/utils';

// Mock data for demonstration
const MOCK_SERIES: SeriesContent[] = [
  {
    id: '1',
    slug: 'breaking-point',
    title: 'Точка Невозврата',
    thumbnailUrl: '/images/movie-placeholder.jpg',
    seasonCount: 3,
    episodeCount: 24,
    ageCategory: '16+',
    rating: 8.7,
    year: 2024,
  },
  {
    id: '2',
    slug: 'winter-shadows',
    title: 'Зимние Тени',
    thumbnailUrl: '/images/movie-placeholder.jpg',
    seasonCount: 2,
    episodeCount: 16,
    ageCategory: '12+',
    rating: 8.2,
    year: 2023,
  },
  {
    id: '3',
    slug: 'night-patrol',
    title: 'Ночной Патруль',
    thumbnailUrl: '/images/movie-placeholder.jpg',
    seasonCount: 5,
    episodeCount: 48,
    ageCategory: '18+',
    rating: 9.1,
    year: 2024,
  },
  {
    id: '4',
    slug: 'family-secrets',
    title: 'Семейные Секреты',
    thumbnailUrl: '/images/movie-placeholder.jpg',
    seasonCount: 1,
    episodeCount: 8,
    ageCategory: '6+',
    rating: 7.5,
    year: 2024,
  },
  {
    id: '5',
    slug: 'cyber-world',
    title: 'Кибер Мир',
    thumbnailUrl: '/images/movie-placeholder.jpg',
    seasonCount: 2,
    episodeCount: 20,
    ageCategory: '12+',
    rating: 8.8,
    year: 2023,
  },
  {
    id: '6',
    slug: 'deep-waters',
    title: 'Глубокие Воды',
    thumbnailUrl: '/images/movie-placeholder.jpg',
    seasonCount: 4,
    episodeCount: 36,
    ageCategory: '16+',
    rating: 8.4,
    year: 2022,
  },
];

const CATEGORIES = [
  { value: 'all', label: 'Все категории' },
  { value: 'drama', label: 'Драма' },
  { value: 'comedy', label: 'Комедия' },
  { value: 'thriller', label: 'Триллер' },
  { value: 'horror', label: 'Ужасы' },
  { value: 'scifi', label: 'Фантастика' },
  { value: 'action', label: 'Боевик' },
];

const YEARS = [
  { value: 'all', label: 'Все годы' },
  { value: '2024', label: '2024' },
  { value: '2023', label: '2023' },
  { value: '2022', label: '2022' },
  { value: '2021', label: '2021' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Сначала новые' },
  { value: 'oldest', label: 'Сначала старые' },
  { value: 'rating', label: 'По рейтингу' },
  { value: 'popular', label: 'По популярности' },
  { value: 'alphabetical', label: 'По алфавиту' },
];

const AGE_FILTERS: { value: AgeCategory; label: string }[] = [
  { value: '0+', label: '0+' },
  { value: '6+', label: '6+' },
  { value: '12+', label: '12+' },
  { value: '16+', label: '16+' },
  { value: '18+', label: '18+' },
];

/**
 * Series listing page with filters and pagination
 */
export default function SeriesPage() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [showFilters, setShowFilters] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [sortBy, setSortBy] = React.useState('newest');
  const [category, setCategory] = React.useState('all');
  const [year, setYear] = React.useState('all');
  const [selectedAges, setSelectedAges] = React.useState<AgeCategory[]>([]);

  // Simulate loading
  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleAgeToggle = (age: AgeCategory) => {
    setSelectedAges((prev) =>
      prev.includes(age) ? prev.filter((a) => a !== age) : [...prev, age]
    );
  };

  const handleClearFilters = () => {
    setCategory('all');
    setYear('all');
    setSelectedAges([]);
  };

  const hasActiveFilters = category !== 'all' || year !== 'all' || selectedAges.length > 0;

  // Filter series based on selected filters
  const filteredSeries = React.useMemo(() => {
    return MOCK_SERIES.filter((series) => {
      if (selectedAges.length > 0 && !selectedAges.includes(series.ageCategory)) {
        return false;
      }
      if (year !== 'all' && series.year?.toString() !== year) {
        return false;
      }
      return true;
    });
  }, [selectedAges, year]);

  const totalPages = Math.ceil(filteredSeries.length / 12);

  return (
    <Container size="full" className="py-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-mp-text-primary">Сериалы</h1>
          <p className="text-sm text-mp-text-secondary mt-1">
            {filteredSeries.length} сериалов найдено
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Sort */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
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

          {/* View toggle */}
          <div className="flex items-center border border-mp-border rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-1.5 rounded transition-colors',
                viewMode === 'grid'
                  ? 'bg-mp-accent-primary/20 text-mp-accent-primary'
                  : 'text-mp-text-secondary hover:text-mp-text-primary'
              )}
              aria-label="Grid view"
            >
              <GridNineclassName="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-1.5 rounded transition-colors',
                viewMode === 'list'
                  ? 'bg-mp-accent-primary/20 text-mp-accent-primary'
                  : 'text-mp-text-secondary hover:text-mp-text-primary'
              )}
              aria-label="List view"
            >
              <ListBullets className="w-4 h-4" />
            </button>
          </div>

          {/* Filter toggle */}
          <Button
            variant={showFilters ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Фильтры
            {hasActiveFilters && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-mp-accent-primary rounded-full">
                {(category !== 'all' ? 1 : 0) + (year !== 'all' ? 1 : 0) + selectedAges.length}
              </span>
            )}
          </Button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Filters sidebar */}
        {showFilters && (
          <aside className="w-64 shrink-0 space-y-6">
            {/* Category filter */}
            <div>
              <h3 className="text-sm font-medium text-mp-text-primary mb-3">Категория</h3>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите категорию" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Year filter */}
            <div>
              <h3 className="text-sm font-medium text-mp-text-primary mb-3">Год выхода</h3>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите год" />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map((y) => (
                    <SelectItem key={y.value} value={y.value}>
                      {y.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Age filter */}
            <div>
              <h3 className="text-sm font-medium text-mp-text-primary mb-3">Возрастной рейтинг</h3>
              <div className="space-y-2">
                {AGE_FILTERS.map((age) => (
                  <label
                    key={age.value}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedAges.includes(age.value)}
                      onCheckedChange={() => handleAgeToggle(age.value)}
                    />
                    <span className="text-sm text-mp-text-secondary">{age.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Clear filters */}
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
          </aside>
        )}

        {/* Content grid */}
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <VideoCardSkeletonGrid count={12} variant="series" columns={showFilters ? 4 : 5} />
          ) : filteredSeries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FunnelclassName="w-12 h-12 text-mp-text-disabled mb-4" />
              <h3 className="text-lg font-medium text-mp-text-primary mb-2">
                Ничего не найдено
              </h3>
              <p className="text-mp-text-secondary mb-4">
                Попробуйте изменить параметры фильтрации
              </p>
              <Button variant="outline" onClick={handleClearFilters}>
                Сбросить фильтры
              </Button>
            </div>
          ) : (
            <>
              <ContentGrid variant={showFilters ? 'compact' : 'default'}>
                {filteredSeries.map((series) => (
                  <SeriesCard key={series.id} content={series} />
                ))}
              </ContentGrid>

              {/* Pagination */}
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

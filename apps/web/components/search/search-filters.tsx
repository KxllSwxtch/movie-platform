'use client';

import * as React from 'react';
import { SlidersHorizontal, X } from '@phosphor-icons/react';

import { type AgeCategory } from '@/components/content';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export interface SearchFiltersState {
  type: string;
  category: string;
  age: AgeCategory | 'all';
  year: string;
  sortBy: string;
}

interface SearchFiltersProps {
  filters: SearchFiltersState;
  onFiltersChange: (filters: SearchFiltersState) => void;
  categories?: Array<{ id: string; name: string; iconUrl?: string }>;
  className?: string;
}

const CONTENT_TYPES = [
  { value: 'all', label: 'Все типы' },
  { value: 'series', label: 'Сериалы' },
  { value: 'clip', label: 'Видео' },
  { value: 'short', label: 'Шортсы' },
  { value: 'tutorials', label: 'Обучение' },
];

const AGE_RATINGS: { value: AgeCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'Все возрасты' },
  { value: '0+', label: '0+' },
  { value: '6+', label: '6+' },
  { value: '12+', label: '12+' },
  { value: '16+', label: '16+' },
  { value: '18+', label: '18+' },
];

const YEARS = [
  { value: 'all', label: 'Все годы' },
  { value: '2026', label: '2026' },
  { value: '2025', label: '2025' },
  { value: '2024', label: '2024' },
  { value: '2023', label: '2023' },
  { value: '2022', label: '2022' },
];

const SORT_OPTIONS = [
  { value: 'relevance', label: 'По релевантности' },
  { value: 'newest', label: 'Сначала новые' },
  { value: 'oldest', label: 'Сначала старые' },
  { value: 'rating', label: 'По рейтингу' },
  { value: 'popular', label: 'По популярности' },
];

function countActiveFilters(filters: SearchFiltersState): number {
  let count = 0;
  if (filters.type !== 'all') count++;
  if (filters.category !== 'all') count++;
  if (filters.age !== 'all') count++;
  if (filters.year !== 'all') count++;
  return count;
}

function FilterSelects({
  filters,
  onFiltersChange,
  categories = [],
  layout = 'inline',
}: {
  filters: SearchFiltersState;
  onFiltersChange: (filters: SearchFiltersState) => void;
  categories?: Array<{ id: string; name: string; iconUrl?: string }>;
  layout?: 'inline' | 'stacked';
}) {
  const handleChange = (key: keyof SearchFiltersState, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const selectWidth = layout === 'stacked' ? 'w-full' : '';

  return (
    <>
      <Select value={filters.type} onValueChange={(v) => handleChange('type', v)}>
        <SelectTrigger className={cn(selectWidth || 'w-[140px]')}>
          <SelectValue placeholder="Тип" />
        </SelectTrigger>
        <SelectContent>
          {CONTENT_TYPES.map((type) => (
            <SelectItem key={type.value} value={type.value}>
              {type.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.category} onValueChange={(v) => handleChange('category', v)}>
        <SelectTrigger className={cn(selectWidth || 'w-[180px]')}>
          <SelectValue placeholder="Категория" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Все категории</SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat.id} value={cat.id}>
              {cat.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.age}
        onValueChange={(v) => handleChange('age', v as AgeCategory | 'all')}
      >
        <SelectTrigger className={cn(selectWidth || 'w-[140px]')}>
          <SelectValue placeholder="Возраст" />
        </SelectTrigger>
        <SelectContent>
          {AGE_RATINGS.map((age) => (
            <SelectItem key={age.value} value={age.value}>
              {age.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.year} onValueChange={(v) => handleChange('year', v)}>
        <SelectTrigger className={cn(selectWidth || 'w-[120px]')}>
          <SelectValue placeholder="Год" />
        </SelectTrigger>
        <SelectContent>
          {YEARS.map((year) => (
            <SelectItem key={year.value} value={year.value}>
              {year.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.sortBy} onValueChange={(v) => handleChange('sortBy', v)}>
        <SelectTrigger
          className={cn(
            layout === 'stacked' ? 'w-full' : 'w-[180px]',
            layout === 'inline' && 'ml-auto',
          )}
        >
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
    </>
  );
}

export function SearchFilters({
  filters,
  onFiltersChange,
  categories = [],
  className,
}: SearchFiltersProps) {
  const activeCount = countActiveFilters(filters);
  const hasActiveFilters = activeCount > 0;

  const handleClearFilters = () => {
    onFiltersChange({
      ...filters,
      type: 'all',
      category: 'all',
      age: 'all',
      year: 'all',
    });
  };

  return (
    <>
      <div className={cn('flex items-center gap-3 md:hidden', className)}>
        <Drawer>
          <DrawerTrigger asChild>
            <Button variant="outline" size="default" className="min-w-0 flex-1 gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Фильтры
              {activeCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-mp-accent-primary text-xs font-semibold text-white">
                  {activeCount}
                </span>
              )}
            </Button>
          </DrawerTrigger>
          <DrawerContent className="sesh-search-filter-drawer">
            <DrawerHeader>
              <DrawerTitle>Фильтры</DrawerTitle>
            </DrawerHeader>
            <div className="space-y-3 px-4 pb-2">
              <FilterSelects
                filters={filters}
                onFiltersChange={onFiltersChange}
                categories={categories}
                layout="stacked"
              />
            </div>
            <DrawerFooter>
              {hasActiveFilters && (
                <Button variant="ghost" onClick={handleClearFilters} className="gap-1">
                  <X className="h-4 w-4" />
                  Сбросить фильтры
                </Button>
              )}
              <DrawerClose asChild>
                <Button variant="default">Применить</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>

        <Select
          value={filters.sortBy}
          onValueChange={(v) => onFiltersChange({ ...filters, sortBy: v })}
        >
          <SelectTrigger className="min-w-0 flex-1">
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
      </div>

      <div className={cn('hidden flex-wrap items-center gap-3 md:flex', className)}>
        <FilterSelects
          filters={filters}
          onFiltersChange={onFiltersChange}
          categories={categories}
          layout="inline"
        />

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={handleClearFilters} className="gap-1">
            <X className="h-4 w-4" />
            Сбросить
          </Button>
        )}
      </div>
    </>
  );
}

export function SearchFilterChips({
  filters,
  onFiltersChange,
  categories = [],
  className,
}: SearchFiltersProps) {
  const activeFilters: { key: keyof SearchFiltersState; label: string }[] = [];

  if (filters.type !== 'all') {
    const type = CONTENT_TYPES.find((t) => t.value === filters.type);
    if (type) activeFilters.push({ key: 'type', label: type.label });
  }
  if (filters.category !== 'all') {
    const cat = categories.find((c) => c.id === filters.category);
    if (cat) activeFilters.push({ key: 'category', label: cat.name });
  }
  if (filters.age !== 'all') {
    activeFilters.push({ key: 'age', label: filters.age });
  }
  if (filters.year !== 'all') {
    activeFilters.push({ key: 'year', label: filters.year });
  }

  if (activeFilters.length === 0) return null;

  const handleRemove = (key: keyof SearchFiltersState) => {
    onFiltersChange({ ...filters, [key]: 'all' });
  };

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {activeFilters.map(({ key, label }) => (
        <span
          key={key}
          className="inline-flex items-center gap-1 rounded-full bg-mp-accent-primary/20 px-2 py-1 text-sm text-mp-accent-primary"
        >
          {label}
          <button
            onClick={() => handleRemove(key)}
            className="rounded-full p-0.5 transition-colors hover:bg-mp-accent-primary/30"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
    </div>
  );
}

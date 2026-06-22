'use client';

import {
  BookOpen,
  FilmStrip,
  Lightning,
  MusicNote,
} from '@phosphor-icons/react';
import * as React from 'react';

import { cn } from '@/lib/utils';

interface ContentTypeCardsProps {
  value: string;
  onChange: (type: string) => void;
  disabled?: boolean;
}

const CONTENT_TYPES = [
  {
    type: 'SERIES',
    label: 'Сериал',
    description: 'Многосерийный контент с сезонами и эпизодами',
    icon: FilmStrip,
  },
  {
    type: 'CLIP',
    label: 'Видео',
    description: 'Видео для каталога и тематических категорий',
    icon: MusicNote,
  },
  {
    type: 'SHORT',
    label: 'Шорт',
    description: 'Короткие вертикальные видео',
    icon: Lightning,
  },
  {
    type: 'TUTORIAL',
    label: 'Туториал',
    description: 'Обучающие видео и курсы',
    icon: BookOpen,
  },
] as const;

export function ContentTypeCards({
  value,
  onChange,
  disabled = false,
}: ContentTypeCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {CONTENT_TYPES.map(({ type, label, description, icon: Icon }) => {
        const isSelected = value === type;

        return (
          <button
            key={type}
            type="button"
            disabled={disabled}
            onClick={() => onChange(type)}
            className={cn(
              'flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all duration-200 cursor-pointer',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d5203a]/45 focus-visible:ring-offset-0',
              isSelected
                ? 'border-[#d5203a]/50 bg-[#8f101f]/16 shadow-[0_0_16px_rgba(213,32,58,0.12)]'
                : 'border-mp-border bg-mp-surface/50 hover:border-[#d5203a]/28',
              disabled && 'pointer-events-none opacity-50'
            )}
          >
            <Icon
              weight={isSelected ? 'fill' : 'regular'}
              className={cn(
                'h-8 w-8 transition-colors duration-200',
                isSelected ? 'text-[#ff6a78]' : 'text-mp-text-secondary'
              )}
            />
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-mp-text-primary transition-colors duration-200">
                {label}
              </p>
              <p className="text-xs text-mp-text-secondary leading-relaxed">
                {description}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Plus, ShareNetwork, Calendar } from '@phosphor-icons/react';

import { Container } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ContentGrid } from '@/components/ui/grid';
import {
  AgeBadge,
  EpisodeCard,
  SeriesCard,
  VideoCardSkeletonGrid,
  type AgeCategory,
  type EpisodeContent,
  type SeriesContent,
} from '@/components/content';
import { RatingBadge } from '@/components/ui/rating-badge';
import { cn } from '@/lib/utils';

// Mock series data
const MOCK_SERIES = {
  id: '1',
  slug: 'breaking-point',
  title: 'Точка Невозврата',
  originalTitle: 'Breaking Point',
  description:
    'Захватывающая история о детективе, расследующем серию загадочных преступлений в маленьком городе. Каждый новый поворот приближает его к ужасающей правде, которая навсегда изменит его жизнь и представления о добре и зле.',
  thumbnailUrl: '/images/hero-placeholder.jpg',
  bannerUrl: '/images/hero-placeholder.jpg',
  seasonCount: 3,
  episodeCount: 24,
  ageCategory: '16+' as AgeCategory,
  rating: 8.7,
  year: 2024,
  genres: ['Триллер', 'Криминал', 'Драма'],
  country: 'Россия',
  director: 'Алексей Петров',
  cast: ['Иван Сидоров', 'Мария Иванова', 'Петр Козлов', 'Анна Михайлова'],
  seasons: [
    {
      number: 1,
      title: 'Сезон 1',
      year: 2022,
      episodes: [
        {
          id: 'ep-1-1',
          title: 'Начало',
          episodeNumber: 1,
          seasonNumber: 1,
          thumbnailUrl: '/images/movie-placeholder.jpg',
          duration: 52,
          description: 'Детектив Сергей Волков получает новое дело, которое перевернёт его жизнь.',
          progress: 100,
          isWatched: true,
        },
        {
          id: 'ep-1-2',
          title: 'Первые улики',
          episodeNumber: 2,
          seasonNumber: 1,
          thumbnailUrl: '/images/movie-placeholder.jpg',
          duration: 48,
          description: 'Расследование продолжается. Новые улики ведут к неожиданному повороту.',
          progress: 65,
        },
        {
          id: 'ep-1-3',
          title: 'Тёмные секреты',
          episodeNumber: 3,
          seasonNumber: 1,
          thumbnailUrl: '/images/movie-placeholder.jpg',
          duration: 51,
          description: 'Волков раскрывает тёмные секреты маленького города.',
          isNext: true,
        },
        {
          id: 'ep-1-4',
          title: 'Точка невозврата',
          episodeNumber: 4,
          seasonNumber: 1,
          thumbnailUrl: '/images/movie-placeholder.jpg',
          duration: 55,
          description: 'Финал первого сезона. Все карты раскрыты.',
        },
      ] as EpisodeContent[],
    },
    {
      number: 2,
      title: 'Сезон 2',
      year: 2023,
      episodes: [
        {
          id: 'ep-2-1',
          title: 'Новое начало',
          episodeNumber: 1,
          seasonNumber: 2,
          thumbnailUrl: '/images/movie-placeholder.jpg',
          duration: 50,
          description: 'Год спустя. Волков возвращается к делу.',
        },
        {
          id: 'ep-2-2',
          title: 'Призраки прошлого',
          episodeNumber: 2,
          seasonNumber: 2,
          thumbnailUrl: '/images/movie-placeholder.jpg',
          duration: 49,
          description: 'Прошлое не отпускает никого.',
        },
      ] as EpisodeContent[],
    },
  ],
};

// Related series
const RELATED_SERIES: SeriesContent[] = [
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
];

/**
 * Series detail page with seasons and episodes
 */
export default function SeriesDetailPage() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedSeason, setSelectedSeason] = React.useState('1');
  const [showFullDescription, setShowFullDescription] = React.useState(false);

  // Simulate loading
  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const series = MOCK_SERIES;

  // Find next episode to watch
  const nextEpisode = React.useMemo(() => {
    for (const season of series.seasons) {
      const next = season.episodes.find((ep) => ep.isNext || (!ep.isWatched && !ep.progress));
      if (next) return next;
    }
    return series.seasons[0]?.episodes[0];
  }, [series]);

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-[400px] bg-mp-surface-2" />
        <Container size="xl" className="py-8">
          <div className="h-8 bg-mp-surface-2 rounded w-1/3 mb-4" />
          <div className="h-4 bg-mp-surface-2 rounded w-2/3 mb-8" />
          <VideoCardSkeletonGrid count={4} variant="episode" columns={4} />
        </Container>
      </div>
    );
  }

  return (
    <div>
      {/* Hero banner */}
      <div className="relative h-[400px] md:h-[500px]">
        {/* Background image */}
        <Image
          src={series.bannerUrl}
          alt={series.title}
          fill
          className="object-cover"
          priority
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-mp-bg-primary via-mp-bg-primary/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-mp-bg-primary/80 via-transparent to-transparent" />

        {/* Content */}
        <Container size="xl" className="relative h-full flex items-end pb-8">
          <div className="max-w-2xl">
            {/* Badges */}
            <div className="flex items-center gap-3 mb-4">
              <AgeBadge age={series.ageCategory} size="lg" />
              {series.rating && <RatingBadge rating={series.rating} size="lg" />}
              <span className="text-sm text-white/80 flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {series.year}
              </span>
              <span className="text-sm text-white/80">
                {series.seasonCount} сезон • {series.episodeCount} серий
              </span>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
              {series.title}
            </h1>
            {series.originalTitle && series.originalTitle !== series.title && (
              <p className="text-lg text-white/60 mb-4">{series.originalTitle}</p>
            )}

            {/* Genres */}
            <div className="flex flex-wrap gap-2 mb-4">
              {series.genres.map((genre) => (
                <span
                  key={genre}
                  className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-sm text-white/80"
                >
                  {genre}
                </span>
              ))}
            </div>

            {/* Description */}
            <p
              className={cn(
                'text-white/80 mb-6',
                !showFullDescription && 'line-clamp-3'
              )}
            >
              {series.description}
            </p>
            {series.description.length > 200 && (
              <button
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="text-sm text-mp-accent-primary hover:underline mb-6"
              >
                {showFullDescription ? 'Скрыть' : 'Читать далее'}
              </button>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <Button variant="gradient" size="lg" asChild>
                <Link href={nextEpisode ? `/watch/${nextEpisode.id}` : '#'}>
                  <Play className="w-5 h-5 fill-current mr-2" />
                  Смотреть
                </Link>
              </Button>
              <Button variant="outline" size="lg">
                <Plus className="w-5 h-5 mr-2" />
                В список
              </Button>
              <Button variant="ghost" size="lg">
                <ShareNetwork className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </Container>
      </div>

      {/* Seasons and episodes */}
      <Container size="xl" className="py-8">
        <Tabs value={selectedSeason} onValueChange={setSelectedSeason}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-mp-text-primary">Эпизоды</h2>
            <TabsList>
              {series.seasons.map((season) => (
                <TabsTrigger key={season.number} value={season.number.toString()}>
                  {season.title}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {series.seasons.map((season) => (
            <TabsContent key={season.number} value={season.number.toString()}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {season.episodes.map((episode) => (
                  <EpisodeCard
                    key={episode.id}
                    content={episode}
                    seriesSlug={series.slug}
                  />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Cast & Crew */}
        <section className="mt-12">
          <h2 className="text-xl font-semibold text-mp-text-primary mb-4">
            Создатели
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-mp-surface rounded-xl">
              <p className="text-sm text-mp-text-secondary mb-1">Режиссёр</p>
              <p className="font-medium text-mp-text-primary">{series.director}</p>
            </div>
            <div className="p-4 bg-mp-surface rounded-xl">
              <p className="text-sm text-mp-text-secondary mb-1">Страна</p>
              <p className="font-medium text-mp-text-primary">{series.country}</p>
            </div>
          </div>

          <h3 className="text-lg font-medium text-mp-text-primary mt-6 mb-3">В ролях</h3>
          <div className="flex flex-wrap gap-2">
            {series.cast.map((actor) => (
              <span
                key={actor}
                className="px-3 py-1.5 bg-mp-surface rounded-lg text-sm text-mp-text-secondary hover:text-mp-text-primary hover:bg-mp-surface-2 transition-colors cursor-pointer"
              >
                {actor}
              </span>
            ))}
          </div>
        </section>

        {/* Related series */}
        <section className="mt-12">
          <h2 className="text-xl font-semibold text-mp-text-primary mb-4">
            Похожие сериалы
          </h2>
          <ContentGrid variant="default">
            {RELATED_SERIES.map((related) => (
              <SeriesCard key={related.id} content={related} />
            ))}
          </ContentGrid>
        </section>
      </Container>
    </div>
  );
}

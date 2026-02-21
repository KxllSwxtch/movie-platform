import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Клипы — MoviePlatform',
  description: 'Смотрите лучшие клипы из фильмов и сериалов на MoviePlatform. Яркие моменты, закулисье и эксклюзивные фрагменты.',
  openGraph: {
    title: 'Клипы — MoviePlatform',
    description: 'Смотрите лучшие клипы из фильмов и сериалов на MoviePlatform.',
  },
};

export default function ClipsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

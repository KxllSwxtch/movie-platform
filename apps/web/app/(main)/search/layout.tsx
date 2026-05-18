import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Поиск',
  description: 'Поиск сериалов, видео, курсов и другого контента на MoviePlatform',
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}

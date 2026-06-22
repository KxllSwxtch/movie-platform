import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Сериалы',
  description: 'Смотрите сериалы на SESH — эксклюзивные проекты, криминальные драмы и многое другое.',
  openGraph: {
    title: 'Сериалы',
    description: 'Смотрите сериалы на SESH — эксклюзивные проекты, криминальные драмы и многое другое.',
  },
};

export default function SeriesLayout({ children }: { children: React.ReactNode }) {
  return children;
}

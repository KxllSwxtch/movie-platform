import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Просмотр — SESH',
  description: 'Смотрите видео онлайн на SESH',
};

export default function WatchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

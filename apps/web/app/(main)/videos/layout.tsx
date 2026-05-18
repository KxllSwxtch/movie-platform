import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Видео',
  openGraph: {
    title: 'Видео',
  },
};

export default function VideosLayout({ children }: { children: React.ReactNode }) {
  return children;
}

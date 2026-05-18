import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Создать видео | Студия',
  description: 'Создание нового видео на платформе',
  robots: {
    index: false,
    follow: true,
  },
};

export default function LegacyCreateClipLayout({ children }: { children: React.ReactNode }) {
  return children;
}

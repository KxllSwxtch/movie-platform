import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Создать видео | Студия',
  description: 'Создание нового видео на платформе',
};

export default function CreateVideoLayout({ children }: { children: React.ReactNode }) {
  return children;
}

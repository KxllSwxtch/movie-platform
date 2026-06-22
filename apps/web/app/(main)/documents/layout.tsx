import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Правовые документы — SESH',
  description: 'Пользовательское соглашение, политика конфиденциальности и другие правовые документы SESH.',
  openGraph: {
    title: 'Правовые документы — SESH',
    description: 'Правовые документы SESH.',
  },
};

export default function DocumentsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

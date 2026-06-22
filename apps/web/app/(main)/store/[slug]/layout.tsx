import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Товар — Магазин SESH',
  description: 'Подробная информация о товаре в магазине SESH.',
};

export default function ProductDetailLayout({ children }: { children: React.ReactNode }) {
  return children;
}

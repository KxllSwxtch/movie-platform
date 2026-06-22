import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Корзина — SESH',
  description: 'Ваша корзина покупок в магазине SESH.',
};

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}

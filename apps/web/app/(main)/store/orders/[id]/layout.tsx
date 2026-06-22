import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Заказ — SESH',
  description: 'Детали заказа в магазине SESH.',
};

export default function OrderDetailLayout({ children }: { children: React.ReactNode }) {
  return children;
}

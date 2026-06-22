import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Мои заказы — SESH',
  description: 'История заказов в магазине SESH.',
};

export default function OrdersLayout({ children }: { children: React.ReactNode }) {
  return children;
}

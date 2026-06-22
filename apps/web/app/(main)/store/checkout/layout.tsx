import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Оформление заказа — SESH',
  description: 'Оформите заказ в магазине SESH.',
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}

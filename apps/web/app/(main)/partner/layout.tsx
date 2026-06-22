import type { Metadata } from 'next';

import { PartnerAuthGuard } from '@/components/partner';

export const metadata: Metadata = {
  title: 'Партнерская программа',
  description: 'Партнерская программа SESH — приглашайте друзей и зарабатывайте комиссии с 5 уровней.',
  openGraph: {
    title: 'Партнерская программа',
    description: 'Партнерская программа SESH — приглашайте друзей и зарабатывайте комиссии с 5 уровней.',
  },
};

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  return <PartnerAuthGuard>{children}</PartnerAuthGuard>;
}

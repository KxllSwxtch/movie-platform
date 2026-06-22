import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Главная — SESH',
  description: 'Смотрите сериалы, обучающие курсы и эксклюзивный контент на SESH',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

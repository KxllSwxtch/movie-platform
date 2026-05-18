'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

import { Spinner } from '@/components/ui/spinner';

const ClipWizard = dynamic(
  () =>
    import('@/components/studio/wizards').then((m) => ({
      default: m.ClipWizard,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[420px] items-center justify-center">
        <Spinner size="lg" />
      </div>
    ),
  },
);

export default function CreateVideoPage() {
  const router = useRouter();

  return (
    <div className="py-8 md:py-12">
      <ClipWizard onSuccess={(id) => router.push(`/studio/${id}`)} />
    </div>
  );
}

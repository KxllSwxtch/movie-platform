import { Spinner } from '@/components/ui/spinner';

export default function ShortsLoading() {
  return (
    <div className="shorts-viewport-height flex w-full items-center justify-center">
      <Spinner size="xl" />
    </div>
  );
}

import { ShortsLoadingSkeleton } from './shorts-loading-skeleton';

export default function ShortsLoading() {
  return (
    <div className="sesh-shorts-loading shorts-viewport-height">
      <ShortsLoadingSkeleton />
    </div>
  );
}

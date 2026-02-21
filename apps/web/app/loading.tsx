import { SpinnerGap } from '@phosphor-icons/react';

/**
 * Global loading component
 * Shown during page transitions
 */
export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-mp-bg-primary">
      <div className="flex flex-col items-center gap-4">
        <SpinnerGap className="w-10 h-10 text-mp-accent-primary animate-spin" />
        <p className="text-sm text-mp-text-secondary">Загрузка...</p>
      </div>
    </div>
  );
}

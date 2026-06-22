'use client';

import { StudioAuthGuard } from '@/components/studio/studio-auth-guard';
import { StudioSidebar, StudioMobileTabs } from '@/components/studio/studio-sidebar';

export function StudioLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StudioAuthGuard>
      <div className="sesh-studio-workspace mx-auto flex max-w-6xl gap-5 lg:gap-8">
        <StudioSidebar />
        <div className="sesh-studio-workspace-content min-w-0 flex-1">
          <StudioMobileTabs />
          {children}
        </div>
      </div>
    </StudioAuthGuard>
  );
}

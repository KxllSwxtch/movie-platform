'use client';

import { AppHeader } from '@/components/layout/app-header';
import { AppSidebar, SIDEBAR_WIDTH } from '@/components/layout/app-sidebar';
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav';
import { PageTransition } from '@/components/layout/page-transition';
import { MobileSearchOverlay } from '@/components/search/mobile-search-overlay';
import { PendingDocumentsModal } from '@/components/documents/pending-documents-modal';
import { useIsMobile } from '@/hooks/use-media-query';

/**
 * Main layout with sidebar navigation - matches Figma design
 */
export default function MainLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-mp-bg-primary">
      {/* Sidebar */}
      <AppSidebar />

      {/* Main content area */}
      <div
        className="min-h-screen transition-all duration-300"
        style={{ marginLeft: isMobile ? 0 : SIDEBAR_WIDTH }}
      >
        {/* Header */}
        <AppHeader />

        {/* Page content */}
        <main id="main-content" className="p-4 md:p-6 pb-20 md:pb-6">
          <PageTransition variant="fade">
            {children}
          </PageTransition>
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <MobileBottomNav />

      {/* Mobile search overlay */}
      <MobileSearchOverlay />

      {/* Blocking modal for pending legal documents */}
      <PendingDocumentsModal />
    </div>
  );
}

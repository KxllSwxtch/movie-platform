'use client';

import { AdminHeader, AdminSidebar } from '@/components/admin/layout';
import { AdminAuthGuard } from '@/components/admin/guards';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/ui.store';

/**
 * Admin panel layout with sidebar navigation and authentication guard
 */
export default function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const isSidebarCollapsed = useUIStore((state) => state.isSidebarCollapsed);

  return (
    <AdminAuthGuard>
      <div className="sesh-admin-shell min-h-screen text-mp-text-primary">
        {/* Sidebar */}
        <AdminSidebar />

        {/* Main content area */}
        <div
          className={cn(
            'min-h-screen transition-[margin-left] duration-300 ml-0',
            isSidebarCollapsed ? 'md:ml-[76px]' : 'md:ml-[250px]',
          )}
        >
          {/* Header */}
          <AdminHeader />

          {/* Page content with top padding for header */}
          <main className="sesh-admin-main min-h-screen p-4 pt-16 md:p-6 md:pt-16">
            {children}
          </main>
        </div>
      </div>
    </AdminAuthGuard>
  );
}

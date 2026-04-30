'use client';

import { AdminHeader, AdminSidebar } from '@/components/admin/layout';
import { AdminAuthGuard } from '@/components/admin/guards';

/**
 * Admin panel layout with sidebar navigation and authentication guard
 */
export default function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAuthGuard>
      <div className="min-h-screen bg-mp-bg-primary text-mp-text-primary">
        {/* Sidebar */}
        <AdminSidebar />

        {/* Main content area */}
        <div className="min-h-screen transition-all duration-300 ml-0 md:ml-[250px]">
          {/* Header */}
          <AdminHeader />

          {/* Page content with top padding for header */}
          <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,rgba(201,75,255,0.10),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_240px)] p-4 pt-16 md:p-6 md:pt-16">
            {children}
          </main>
        </div>
      </div>
    </AdminAuthGuard>
  );
}

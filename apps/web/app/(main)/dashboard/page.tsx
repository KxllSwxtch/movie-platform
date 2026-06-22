"use client";

import { DashboardRows } from "@/components/home";
import { useDashboardHome } from "@/hooks/use-home";

/**
 * Authenticated dashboard — real API data with content rows
 */
export default function DashboardPage() {
  const data = useDashboardHome();

  return (
    <div className="relative min-h-[calc(100vh-68px)] pt-[40px]">
      <DashboardRows data={data} />
    </div>
  );
}

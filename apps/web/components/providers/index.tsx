'use client';

import * as React from 'react';

import { NetworkStatus } from '@/components/ui/network-status';
import { Toaster } from '@/components/ui/toaster';
import { useAuthStore } from '@/stores/auth.store';

import { QueryProvider } from './query-provider';
import { ThemeProvider } from './theme-provider';

/**
 * Root providers props
 */
interface ProvidersProps {
  children: React.ReactNode;
}

/**
 * Combined providers for the application
 * Handles theme, query client, toast notifications, and auth hydration
 */
export function Providers({ children }: ProvidersProps) {
  // Hydrate auth store on mount (SSR-safe)
  React.useEffect(() => {
    useAuthStore.persist.rehydrate();
  }, []);

  return (
    <QueryProvider>
      <ThemeProvider>
        {children}
        <NetworkStatus />
        <Toaster />
      </ThemeProvider>
    </QueryProvider>
  );
}

// Re-export individual providers
export { ThemeProvider } from './theme-provider';
export { QueryProvider } from './query-provider';

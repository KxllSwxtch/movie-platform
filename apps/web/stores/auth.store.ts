import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@movie-platform/shared';

/**
 * Authentication state interface
 */
interface AuthState {
  // State
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;

  // Actions
  setAuth: (user: User, accessToken: string, refreshToken?: string) => void;
  setUser: (user: User) => void;
  setTokens: (accessToken: string, refreshToken?: string) => void;
  updateUser: (updates: Partial<User>) => void;
  logout: () => void;
  setHydrated: (hydrated: boolean) => void;
}

/**
 * Auth store with persistence
 * Uses skipHydration to prevent SSR hydration mismatches
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isHydrated: false,

      // Set full auth state (after login)
      setAuth: (user, accessToken, refreshToken) =>
        set({
          user,
          accessToken,
          refreshToken: refreshToken ?? get().refreshToken,
          isAuthenticated: true,
        }),

      // Update user data
      setUser: (user) => set({ user }),

      // Update tokens (after refresh)
      setTokens: (accessToken, refreshToken) =>
        set({
          accessToken,
          refreshToken: refreshToken ?? get().refreshToken,
        }),

      // Partial user update
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      // Clear auth state (logout)
      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        }),

      // Mark store as hydrated
      setHydrated: (hydrated) => set({ isHydrated: hydrated }),
    }),
    {
      name: 'mp-auth-storage',
      storage: createJSONStorage(() => localStorage),
      // Skip hydration to prevent SSR mismatches
      // We manually rehydrate in the Providers component
      skipHydration: true,
      // Only persist essential auth data
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

/**
 * Selector hooks for common auth state
 */
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAccessToken = () => useAuthStore((state) => state.accessToken);
export const useIsHydrated = () => useAuthStore((state) => state.isHydrated);

/**
 * Get auth state outside of React components
 */
export const getAuthState = () => useAuthStore.getState();

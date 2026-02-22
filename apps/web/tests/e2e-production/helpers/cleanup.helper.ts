/**
 * Test data cleanup helpers.
 * Run after tests to restore production data to clean state.
 */

import { apiDelete, apiGet, apiPost, apiPatch } from './api.helper';

/**
 * Clear the user's shopping cart.
 */
export async function clearCart(token: string): Promise<void> {
  try {
    const cart = await apiGet('/store/cart', token);
    if (cart.success && cart.data) {
      const items = (cart.data as { items?: { productId: string }[] }).items;
      if (items?.length) {
        for (const item of items) {
          await apiDelete(`/store/cart/items/${item.productId}`, token);
        }
      }
    }
  } catch {
    // Cart may not exist — that's fine
  }
}

/**
 * Clear the user's watchlist.
 */
export async function clearWatchlist(token: string): Promise<void> {
  try {
    const watchlist = await apiGet('/users/me/watchlist', token);
    if (watchlist.success && watchlist.data) {
      const items = watchlist.data as { id: string; contentId: string }[];
      if (Array.isArray(items)) {
        for (const item of items) {
          await apiDelete(`/users/me/watchlist/${item.contentId}`, token);
        }
      }
    }
  } catch {
    // Watchlist may be empty — that's fine
  }
}

/**
 * Restore user profile to original seed values.
 */
export async function restoreProfile(
  token: string,
  original: { firstName: string; lastName: string }
): Promise<void> {
  try {
    await apiPatch('/users/me/profile', original, token);
  } catch {
    // Non-critical
  }
}

/**
 * Mark all notifications as read.
 */
export async function markAllNotificationsRead(token: string): Promise<void> {
  try {
    await apiPost('/notifications/read-all', undefined, token);
  } catch {
    // Non-critical
  }
}

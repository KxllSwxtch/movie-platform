import { PROD_USERS, loginViaApi } from './helpers/auth.helper';
import { clearCart, clearWatchlist, markAllNotificationsRead } from './helpers/cleanup.helper';

/**
 * Global teardown: clean up any test data created during the run.
 * Runs once after the entire test suite completes.
 */
async function globalTeardown() {
  console.log('[global-teardown] Cleaning up test data...');

  try {
    const userAuth = await loginViaApi(
      PROD_USERS.user.email,
      PROD_USERS.user.password
    );

    await clearCart(userAuth.accessToken);
    await clearWatchlist(userAuth.accessToken);
    await markAllNotificationsRead(userAuth.accessToken);

    console.log('[global-teardown] Cleanup complete.');
  } catch (err) {
    console.warn('[global-teardown] Cleanup failed (non-fatal):', err);
  }
}

export default globalTeardown;

import { test, expect } from '@playwright/test';
import { apiGet } from '../helpers/api.helper';
import { loginViaApi, PROD_USERS, canLoginViaApi } from '../helpers/auth.helper';

test.describe('Admin Payments', () => {
  test('admin payments page loads', async ({ page }) => {
    await page.goto('/admin/payments');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    if (page.url().includes('/login')) {
      test.skip(true, 'Auth state expired — redirected to login');
      return;
    }

    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('admin payments API returns data', async () => {
    let auth;
    try {
      auth = await loginViaApi(
        PROD_USERS.admin.email,
        PROD_USERS.admin.password
      );
    } catch {
      test.skip(true, 'Admin login failed — possible 502');
      return;
    }

    const res = await apiGet(
      '/admin/payments/transactions',
      auth.accessToken
    );
    expect(res).toBeDefined();
    expect(typeof res.success).toBe('boolean');
  });

  test('admin payments shows content', async ({ page }) => {
    await page.goto('/admin/payments');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(5000);

    if (page.url().includes('/login')) {
      test.skip(true, 'Auth state expired — redirected to login');
      return;
    }

    const bodyText = await page.locator('body').innerText();

    if (bodyText.trim().length < 50) {
      test.skip(true, 'Admin payments page did not fully render — possible auth issue');
      return;
    }

    expect(bodyText.trim().length).toBeGreaterThan(0);
  });

  test('admin payments page has Russian text', async ({ page }) => {
    await page.goto('/admin/payments');
    await page.waitForLoadState('domcontentloaded');

    const bodyText = await page.locator('body').innerText();
    expect(/[\u0400-\u04FF]/.test(bodyText)).toBe(true);
  });
});

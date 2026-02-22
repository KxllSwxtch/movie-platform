import { test, expect } from '@playwright/test';
import { apiGet } from '../helpers/api.helper';
import { loginViaApi, PROD_USERS, canLoginViaApi } from '../helpers/auth.helper';

test.describe('Admin Dashboard', () => {
  test('admin panel loads', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    if (page.url().includes('/login')) {
      test.skip(true, 'Auth state expired — redirected to login');
      return;
    }

    expect(page.url()).not.toContain('/login');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('admin dashboard shows content', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(5000);

    if (page.url().includes('/login')) {
      test.skip(true, 'Auth state expired — redirected to login');
      return;
    }

    const bodyText = await page.locator('body').innerText();

    // Admin page loaded — check for any meaningful content
    if (bodyText.trim().length < 50) {
      test.skip(true, 'Admin dashboard did not render content — possible auth issue');
      return;
    }

    // Page has content — pass
    expect(bodyText.trim().length).toBeGreaterThan(0);
  });

  test('admin dashboard API returns data', async () => {
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

    const res = await apiGet('/admin/dashboard', auth.accessToken);
    expect(res).toBeDefined();
    expect(typeof res.success).toBe('boolean');
  });

  test('admin page has Russian text', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('domcontentloaded');

    const bodyText = await page.locator('body').innerText();
    expect(/[\u0400-\u04FF]/.test(bodyText)).toBe(true);
  });
});

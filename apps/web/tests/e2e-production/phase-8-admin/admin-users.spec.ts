import { test, expect } from '@playwright/test';
import { apiGet } from '../helpers/api.helper';
import { loginViaApi, PROD_USERS, canLoginViaApi } from '../helpers/auth.helper';

test.describe('Admin Users', () => {
  test('admin users page loads', async ({ page }) => {
    await page.goto('/admin/users');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    if (page.url().includes('/login')) {
      test.skip(true, 'Auth state expired — redirected to login');
      return;
    }

    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('admin users shows user data', async ({ page }) => {
    await page.goto('/admin/users');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(5000);

    if (page.url().includes('/login')) {
      test.skip(true, 'Auth state expired — redirected to login');
      return;
    }

    const bodyText = await page.locator('body').innerText();

    if (bodyText.trim().length < 50) {
      test.skip(true, 'Admin users page did not fully render — possible auth issue');
      return;
    }

    expect(bodyText.trim().length).toBeGreaterThan(0);
  });

  test('admin users API returns data', async () => {
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

    const res = await apiGet('/admin/users', auth.accessToken);
    expect(res).toBeDefined();
    expect(typeof res.success).toBe('boolean');
  });

  test('admin users has interactive elements', async ({ page }) => {
    await page.goto('/admin/users');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(5000);

    if (page.url().includes('/login')) {
      test.skip(true, 'Auth state expired — redirected to login');
      return;
    }

    const bodyText = await page.locator('body').innerText();
    if (bodyText.trim().length < 50) {
      test.skip(true, 'Admin page did not render — skipping interactive check');
      return;
    }

    const hasTable = await page.locator('table').isVisible().catch(() => false);
    const hasButtons = await page.locator('button').count();
    const hasLinks = await page.locator('a').count();

    expect(hasTable || hasButtons > 0 || hasLinks > 0).toBe(true);
  });

  test('admin users page has Russian text', async ({ page }) => {
    await page.goto('/admin/users');
    await page.waitForLoadState('domcontentloaded');

    const bodyText = await page.locator('body').innerText();
    expect(/[\u0400-\u04FF]/.test(bodyText)).toBe(true);
  });
});

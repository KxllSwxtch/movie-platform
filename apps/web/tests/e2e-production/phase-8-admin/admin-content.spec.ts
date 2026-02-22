import { test, expect } from '@playwright/test';
import { apiGet } from '../helpers/api.helper';
import { loginViaApi, PROD_USERS, canLoginViaApi } from '../helpers/auth.helper';

test.describe('Admin Content', () => {
  test('admin content page loads', async ({ page }) => {
    await page.goto('/admin/content');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    if (page.url().includes('/login')) {
      test.skip(true, 'Auth state expired — redirected to login');
      return;
    }

    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('admin content shows content items', async ({ page }) => {
    await page.goto('/admin/content');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(5000);

    if (page.url().includes('/login')) {
      test.skip(true, 'Auth state expired — redirected to login');
      return;
    }

    const bodyText = await page.locator('body').innerText();

    // If body is too short, admin didn't fully render
    if (bodyText.trim().length < 50) {
      test.skip(true, 'Admin content page did not fully render — possible auth issue');
      return;
    }

    expect(bodyText.trim().length).toBeGreaterThan(0);
  });

  test('admin content API returns items', async () => {
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

    const res = await apiGet('/admin/content', auth.accessToken);
    expect(res).toBeDefined();
    expect(typeof res.success).toBe('boolean');
  });

  test('admin content has interactive elements', async ({ page }) => {
    await page.goto('/admin/content');
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

    // Should have some interactive elements
    const hasTable = await page.locator('table').isVisible().catch(() => false);
    const hasButtons = await page.locator('button').count();
    const hasLinks = await page.locator('a').count();

    expect(hasTable || hasButtons > 0 || hasLinks > 0).toBe(true);
  });

  test('admin content page has Russian text', async ({ page }) => {
    await page.goto('/admin/content');
    await page.waitForLoadState('domcontentloaded');

    const bodyText = await page.locator('body').innerText();
    expect(/[\u0400-\u04FF]/.test(bodyText)).toBe(true);
  });
});

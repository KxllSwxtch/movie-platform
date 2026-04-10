import { test, expect } from '../fixtures/referral.fixture';

test.describe('Referral Registration', () => {
  test.describe('Referral code from URL', () => {
    test('should pre-fill referral code from ref query parameter', async ({ page }) => {
      await page.goto('/register?ref=ABC12345');

      const referralInput = page.locator('#referralCode');
      await expect(referralInput).toHaveValue('ABC12345');
    });

    test('should persist referral code in sessionStorage', async ({ page }) => {
      await page.goto('/register?ref=XYZ98765');

      const stored = await page.evaluate(() => sessionStorage.getItem('mp-referral-code'));
      expect(stored).toBe('XYZ98765');
    });

    test('should restore referral code from sessionStorage when no URL param', async ({ page }) => {
      // First visit with ref param
      await page.goto('/register?ref=STORED1');

      // Navigate away and back without ref param
      await page.goto('/login');
      await page.goto('/register');

      const referralInput = page.locator('#referralCode');
      await expect(referralInput).toHaveValue('STORED1');
    });
  });

  test.describe('Referral code input', () => {
    test('should display referral code input with uppercase CSS', async ({ page }) => {
      await page.goto('/register');

      const referralInput = page.locator('#referralCode');
      await expect(referralInput).toHaveClass(/uppercase/);
    });

    test('should accept referral code characters', async ({ page }) => {
      await page.goto('/register');

      const referralInput = page.locator('#referralCode');
      await referralInput.fill('ABCDEFGH');

      await expect(referralInput).toHaveValue('ABCDEFGH');
    });

    test('should uppercase referral code from URL param', async ({ page }) => {
      await page.goto('/register?ref=abc12345');

      const referralInput = page.locator('#referralCode');
      // URL param should be uppercased before being set as default
      await expect(referralInput).toHaveValue('ABC12345');
    });
  });

  test.describe('Registration with referral code', () => {
    test('should send referral code in registration request', async ({ page, referralApi }) => {
      await referralApi.mockRegisterWithReferral();

      let capturedBody: any;
      await page.route('**/api/v1/auth/register', async (route) => {
        capturedBody = route.request().postDataJSON();
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              accessToken: 'mock-token',
              refreshToken: 'mock-refresh',
              sessionId: 'mock-session',
              expiresAt: new Date(Date.now() + 900000).toISOString(),
              user: {
                id: 'user-123',
                email: 'new@test.com',
                firstName: 'Test',
                lastName: 'User',
                role: 'BUYER',
                referralCode: 'NEWCODE1',
                referredById: 'referrer-456',
                ageCategory: '18+',
                verificationStatus: 'UNVERIFIED',
                bonusBalance: 0,
              },
            },
          }),
        });
      });

      await page.goto('/register?ref=PARTNER1');

      // Fill out form
      await page.locator('#firstName').fill('Test');
      await page.locator('#lastName').fill('User');
      await page.locator('#email').fill('new@test.com');
      await page.locator('#dateOfBirth').fill('1990-01-15');
      await page.locator('#password').fill('TestPassword1');
      await page.locator('#confirmPassword').fill('TestPassword1');
      await page.locator('#acceptTerms').check();

      // Submit
      await page.locator('button[type="submit"]').click();

      // Wait for request and verify referral code was sent
      await page.waitForResponse('**/api/v1/auth/register');
      expect(capturedBody?.referralCode).toBe('PARTNER1');
    });
  });

  test.describe('Turnstile widget', () => {
    test('should not render Turnstile when NEXT_PUBLIC_TURNSTILE_SITE_KEY is not set', async ({ page }) => {
      await page.goto('/register');

      // Turnstile widget should not be present when env var is not set
      const turnstileWidget = page.locator('[data-sitekey]');
      await expect(turnstileWidget).toHaveCount(0);
    });
  });

  test.describe('Registration form structure', () => {
    test('should display referral code field as optional', async ({ page }) => {
      await page.goto('/register');

      const label = page.locator('label[for="referralCode"]');
      await expect(label).toContainText('необязательно');
    });

    test('should have all required form fields', async ({ page }) => {
      await page.goto('/register');

      await expect(page.locator('#firstName')).toBeVisible();
      await expect(page.locator('#lastName')).toBeVisible();
      await expect(page.locator('#email')).toBeVisible();
      await expect(page.locator('#dateOfBirth')).toBeVisible();
      await expect(page.locator('#password')).toBeVisible();
      await expect(page.locator('#confirmPassword')).toBeVisible();
      await expect(page.locator('#referralCode')).toBeVisible();
      await expect(page.locator('#acceptTerms')).toBeVisible();
    });
  });
});

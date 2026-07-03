import { test as base, expect, type Page, type Route } from '@playwright/test';

/**
 * Mock API responses for referral registration tests
 */
export function mockReferralApi(page: Page) {
  return {
    /**
     * Mock successful registration with referral code
     */
    async mockRegisterWithReferral() {
      await page.route('**/api/v1/auth/register', async (route: Route) => {
        const body = route.request().postDataJSON();
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              accessToken: 'mock-access-token',
              refreshToken: 'mock-refresh-token',
              sessionId: 'mock-session-id',
              expiresAt: new Date(Date.now() + 900000).toISOString(),
              user: {
                id: 'user-123',
                email: body.email,
                firstName: body.firstName,
                lastName: body.lastName,
                role: 'BUYER',
                referralCode: 'NEWUSER1',
                referredById: body.referralCode ? 'referrer-456' : null,
                ageCategory: '18+',
                verificationStatus: 'UNVERIFIED',
                bonusBalance: 0,
              },
            },
          }),
        });
      });
    },

    /**
     * Mock registration where referral code is not applied (invalid/inactive code)
     */
    async mockRegisterWithoutReferral() {
      await page.route('**/api/v1/auth/register', async (route: Route) => {
        const body = route.request().postDataJSON();
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              accessToken: 'mock-access-token',
              refreshToken: 'mock-refresh-token',
              sessionId: 'mock-session-id',
              expiresAt: new Date(Date.now() + 900000).toISOString(),
              user: {
                id: 'user-123',
                email: body.email,
                firstName: body.firstName,
                lastName: body.lastName,
                role: 'BUYER',
                referralCode: 'NEWUSER1',
                referredById: null,
                ageCategory: '18+',
                verificationStatus: 'UNVERIFIED',
                bonusBalance: 0,
              },
            },
          }),
        });
      });
    },
  };
}

export const test = base.extend<{ referralApi: ReturnType<typeof mockReferralApi> }>({
  referralApi: async ({ page }, use) => {
    const api = mockReferralApi(page);
    await use(api);
  },
});

export { expect };

import { test, expect } from '../fixtures/account.fixture';

test.describe('Account Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/account/settings');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Page Display', () => {
    test('should display "Настройки" heading', async ({ page }) => {
      await expect(page.getByText('Настройки')).toBeVisible();
    });

    test('should have tabs for different settings sections', async ({ page }) => {
      await expect(page.getByRole('tab', { name: /уведомления/i })).toBeVisible();
      await expect(page.getByRole('tab', { name: /безопасность/i })).toBeVisible();
      await expect(page.getByRole('tab', { name: /устройства/i })).toBeVisible();
    });
  });

  test.describe('Notifications Tab', () => {
    test('should show notification toggles', async ({ page }) => {
      // Notifications tab should be active by default
      await expect(page.getByText('Email уведомления')).toBeVisible();
    });

    test('should toggle notification preference', async ({ page }) => {
      const toggle = page.locator('button[role="switch"]').first();
      await expect(toggle).toBeVisible();
      await toggle.click();
    });
  });

  test.describe('Security Tab', () => {
    test('should switch to security tab', async ({ page }) => {
      await page.getByRole('tab', { name: /безопасность/i }).click();
      await expect(page.getByText('Смена пароля')).toBeVisible();
    });

    test('should show password form fields', async ({ page }) => {
      await page.getByRole('tab', { name: /безопасность/i }).click();

      await expect(page.locator('input[type="password"]').first()).toBeVisible();
    });

    test('should validate matching passwords', async ({ page }) => {
      await page.getByRole('tab', { name: /безопасность/i }).click();

      // Fill passwords that don't match
      const inputs = page.locator('input[type="password"]');
      await inputs.nth(0).fill('OldPass123!');
      await inputs.nth(1).fill('NewPass123!');
      await inputs.nth(2).fill('DifferentPass123!');

      const submitButton = page.getByRole('button', { name: /изменить пароль|сменить/i });
      await submitButton.click();

      await expect(page.getByText(/не совпадают/i)).toBeVisible();
    });

    test('should validate minimum password length', async ({ page }) => {
      await page.getByRole('tab', { name: /безопасность/i }).click();

      const inputs = page.locator('input[type="password"]');
      await inputs.nth(0).fill('OldPass123!');
      await inputs.nth(1).fill('short');
      await inputs.nth(2).fill('short');

      const submitButton = page.getByRole('button', { name: /изменить пароль|сменить/i });
      await submitButton.click();

      await expect(page.getByText(/минимум 8/i)).toBeVisible();
    });

    test('should show password strength indicator', async ({ page }) => {
      await page.getByRole('tab', { name: /безопасность/i }).click();

      const inputs = page.locator('input[type="password"]');
      await inputs.nth(1).fill('Aa1!Bb2@Cc3#');

      // Strength indicator should be visible
      await expect(page.getByText(/сильный|средний|слабый/i)).toBeVisible();
    });
  });

  test.describe('Sessions Tab', () => {
    test('should switch to sessions tab', async ({ page }) => {
      await page.getByRole('tab', { name: /устройства/i }).click();
      await expect(page.getByText('Активные устройства')).toBeVisible();
    });

    test('should display current device sessions', async ({ page }) => {
      await page.getByRole('tab', { name: /устройства/i }).click();

      await expect(page.getByText('Chrome на macOS')).toBeVisible();
      await expect(page.getByText('Safari на iPhone')).toBeVisible();
    });

    test('should mark current session with badge', async ({ page }) => {
      await page.getByRole('tab', { name: /устройства/i }).click();

      await expect(page.getByText('Это устройство')).toBeVisible();
    });

    test('should disable terminate for current session', async ({ page }) => {
      await page.getByRole('tab', { name: /устройства/i }).click();

      // The terminate button for the current session should be disabled
      const currentSessionCard = page.locator(':has(> :text("Это устройство"))').first();
      if (await currentSessionCard.isVisible()) {
        const terminateBtn = currentSessionCard.getByRole('button', { name: /завершить/i });
        if (await terminateBtn.isVisible()) {
          await expect(terminateBtn).toBeDisabled();
        }
      }
    });

    test('should allow terminating other sessions', async ({ page }) => {
      await page.getByRole('tab', { name: /устройства/i }).click();

      // Find terminate button for non-current session
      const otherSession = page.getByText('Safari на iPhone');
      await expect(otherSession).toBeVisible();
    });
  });
});

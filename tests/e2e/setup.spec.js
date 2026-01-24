// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * E2E Tests: Setup Wizard
 * Tests the initial setup flow for new users
 */

test.describe('Setup Wizard', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('displays setup wizard on first launch', async ({ page }) => {
    await page.goto('/');

    // Setup screen should be visible
    await expect(page.locator('#setupScreen')).toBeVisible();
    await expect(page.locator('#mainApp')).toBeHidden();

    // First step should be active
    await expect(page.locator('#setupStep1')).toHaveClass(/active/);
  });

  test('shows progress steps', async ({ page }) => {
    await page.goto('/');

    const progressSteps = page.locator('.progress-step');
    await expect(progressSteps).toHaveCount(3);

    // First step should be active
    await expect(progressSteps.first()).toHaveClass(/active/);
  });

  test('requires company name to proceed', async ({ page }) => {
    await page.goto('/');

    // Try to proceed without entering company name
    await page.click('button:has-text("Continue")');

    // Should still be on step 1
    await expect(page.locator('#setupStep1')).toHaveClass(/active/);

    // Toast should appear
    await expect(page.locator('.toast')).toHaveClass(/active/);
  });

  test('advances to step 2 with valid company name', async ({ page }) => {
    await page.goto('/');

    // Enter company name
    await page.fill('#setupCompanyName', 'Diamond Dreams Jewelry');
    await page.click('button:has-text("Continue")');

    // Should be on step 2
    await expect(page.locator('#setupStep2')).toHaveClass(/active/);
    await expect(page.locator('#setupStep1')).not.toHaveClass(/active/);
  });

  test('can go back to previous step', async ({ page }) => {
    await page.goto('/');

    // Go to step 2
    await page.fill('#setupCompanyName', 'Diamond Dreams Jewelry');
    await page.click('button:has-text("Continue")');
    await expect(page.locator('#setupStep2')).toHaveClass(/active/);

    // Go back to step 1
    await page.click('button:has-text("Back")');
    await expect(page.locator('#setupStep1')).toHaveClass(/active/);
  });

  test('completes step 2 with address info', async ({ page }) => {
    await page.goto('/');

    // Step 1
    await page.fill('#setupCompanyName', 'Diamond Dreams Jewelry');
    await page.click('button:has-text("Continue")');

    // Step 2 - fill contact info
    await page.fill('#setupPhone', '(555) 123-4567');
    await page.fill('#setupEmail', 'info@diamonddreams.com');

    await page.click('button:has-text("Continue")');

    // Should be on step 3
    await expect(page.locator('#setupStep3')).toHaveClass(/active/);
  });

  test('completes full setup wizard', async ({ page }) => {
    await page.goto('/');

    // Step 1
    await page.fill('#setupCompanyName', 'Diamond Dreams Jewelry');
    await page.click('button:has-text("Continue")');

    // Step 2
    await page.fill('#setupPhone', '(555) 123-4567');
    await page.fill('#setupEmail', 'info@diamonddreams.com');
    await page.click('button:has-text("Continue")');

    // Step 3 - footer message (pre-filled)
    // Complete setup - button says "Get Started"
    await page.click('button:has-text("Get Started")');

    // Main app should now be visible
    await expect(page.locator('#mainApp')).toBeVisible();
    await expect(page.locator('#setupScreen')).toBeHidden();

    // Dashboard should show company name
    await expect(page.locator('#sidebarCompanyBadge')).toContainText('D'); // First letter
  });

  test('persists settings after setup completion', async ({ page }) => {
    await page.goto('/');

    // Complete setup
    await page.fill('#setupCompanyName', 'Test Jewelry Store');
    await page.click('button:has-text("Continue")');
    await page.click('button:has-text("Continue")');
    await page.click('button:has-text("Get Started")');

    // Reload page
    await page.reload();

    // Should go directly to main app, not setup
    await expect(page.locator('#mainApp')).toBeVisible();
    await expect(page.locator('#setupScreen')).toBeHidden();
  });

  test('can upload logo in setup', async ({ page }) => {
    await page.goto('/');

    // The logo upload area should be visible in step 3
    // Navigate to step 3 first
    await page.fill('#setupCompanyName', 'Test Store');
    await page.click('button:has-text("Continue")');
    await page.click('button:has-text("Continue")');

    await expect(page.locator('#logoUploadArea')).toBeVisible();
    await expect(page.locator('#uploadPlaceholder')).toBeVisible();
  });

  test('skips to main app if settings already exist', async ({ page }) => {
    // Pre-populate localStorage with settings
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('jewelryInvoiceSettings', JSON.stringify({
        companyName: 'Existing Store'
      }));
    });
    await page.reload();

    // Should show main app directly
    await expect(page.locator('#mainApp')).toBeVisible();
    await expect(page.locator('#setupScreen')).toBeHidden();
  });
});

test.describe('Setup Wizard - Progress Indicators', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('marks step 1 as completed when moving to step 2', async ({ page }) => {
    await page.goto('/');

    await page.fill('#setupCompanyName', 'Test Store');
    await page.click('button:has-text("Continue")');

    const step1 = page.locator('.progress-step').first();
    await expect(step1).toHaveClass(/completed/);
  });

  test('marks steps 1 and 2 as completed when on step 3', async ({ page }) => {
    await page.goto('/');

    // Go through to step 3
    await page.fill('#setupCompanyName', 'Test Store');
    await page.click('button:has-text("Continue")');
    await page.click('button:has-text("Continue")');

    const progressSteps = page.locator('.progress-step');
    await expect(progressSteps.nth(0)).toHaveClass(/completed/);
    await expect(progressSteps.nth(1)).toHaveClass(/completed/);
    await expect(progressSteps.nth(2)).toHaveClass(/active/);
  });
});

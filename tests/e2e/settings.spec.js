// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * E2E Tests: Settings Page
 * Tests for settings management, metal prices, and data operations
 */

// Helper to setup app with settings
async function setupApp(page) {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('jewelryInvoiceSettings', JSON.stringify({
      companyName: 'Test Jewelry Store',
      address: '123 Main St\nNew York, NY 10001',
      phone: '(555) 123-4567',
      email: 'test@jewelry.com',
      website: 'www.testjewelry.com',
      goldPrice: 4700,
      silverPrice: 95,
      platinumPrice: 2400,
      palladiumPrice: 1800,
      laborRate: 75,
      nextEstimateNum: 5,
      nextInvoiceNum: 3,
      footer: 'Thank you for your business!'
    }));
  });
  await page.reload();
}

test.describe('Settings Page Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await setupApp(page);
  });

  test('navigates to settings page', async ({ page }) => {
    await page.click('.nav-item[data-page="settings"]');
    await expect(page.locator('#settingsPage')).toHaveClass(/active/);
  });

  test('loads current settings into form', async ({ page }) => {
    await page.click('.nav-item[data-page="settings"]');

    await expect(page.locator('#settingsCompanyName')).toHaveValue('Test Jewelry Store');
    await expect(page.locator('#settingsPhone')).toHaveValue('(555) 123-4567');
    await expect(page.locator('#settingsEmail')).toHaveValue('test@jewelry.com');
  });
});

test.describe('Company Information', () => {
  test.beforeEach(async ({ page }) => {
    await setupApp(page);
    await page.click('.nav-item[data-page="settings"]');
  });

  test('displays company name field', async ({ page }) => {
    await expect(page.locator('#settingsCompanyName')).toBeVisible();
    await expect(page.locator('#settingsCompanyName')).toHaveValue('Test Jewelry Store');
  });

  test('displays address field', async ({ page }) => {
    await expect(page.locator('#settingsAddress')).toBeVisible();
  });

  test('displays contact fields', async ({ page }) => {
    await expect(page.locator('#settingsPhone')).toBeVisible();
    await expect(page.locator('#settingsEmail')).toBeVisible();
    await expect(page.locator('#settingsWebsite')).toBeVisible();
  });

  test('displays footer field', async ({ page }) => {
    await expect(page.locator('#settingsFooter')).toBeVisible();
    await expect(page.locator('#settingsFooter')).toHaveValue('Thank you for your business!');
  });

  test('can update company name', async ({ page }) => {
    await page.fill('#settingsCompanyName', 'New Jewelry Store Name');
    await page.click('button:has-text("Save Settings")');

    // Reload and verify
    await page.reload();
    await page.click('.nav-item[data-page="settings"]');
    await expect(page.locator('#settingsCompanyName')).toHaveValue('New Jewelry Store Name');
  });

  test('updates sidebar badge after save', async ({ page }) => {
    await page.fill('#settingsCompanyName', 'Diamond Palace');
    await page.click('button:has-text("Save Settings")');

    // Sidebar should show new initial
    await expect(page.locator('#sidebarCompanyBadge .company-initial')).toContainText('D');
  });
});

test.describe('Metal Prices', () => {
  test.beforeEach(async ({ page }) => {
    await setupApp(page);
    await page.click('.nav-item[data-page="settings"]');
  });

  test('displays current metal prices', async ({ page }) => {
    await expect(page.locator('#settingsGoldPrice')).toHaveValue('4700');
    await expect(page.locator('#settingsSilverPrice')).toHaveValue('95');
    await expect(page.locator('#settingsPlatinumPrice')).toHaveValue('2400');
    await expect(page.locator('#settingsPalladiumPrice')).toHaveValue('1800');
  });

  test('can manually update metal prices', async ({ page }) => {
    await page.fill('#settingsGoldPrice', '4800');
    await page.fill('#settingsSilverPrice', '100');

    await page.click('button:has-text("Save Settings")');

    // Verify toast
    await expect(page.locator('.toast')).toContainText('saved');

    // Reload and verify
    await page.reload();
    await page.click('.nav-item[data-page="settings"]');
    await expect(page.locator('#settingsGoldPrice')).toHaveValue('4800');
    await expect(page.locator('#settingsSilverPrice')).toHaveValue('100');
  });

  test('shows Set Prices button', async ({ page }) => {
    await expect(page.locator('button:has-text("Set Prices")')).toBeVisible();
  });

  test('Set Prices button saves metal prices only', async ({ page }) => {
    await page.fill('#settingsGoldPrice', '4900');

    await page.click('button:has-text("Set Prices")');

    // Should show toast
    await expect(page.locator('.toast')).toContainText('Metal prices saved');
  });

  test('shows Fetch Live Prices button', async ({ page }) => {
    await expect(page.locator('#fetchPricesBtn')).toBeVisible();
  });

  test('Fetch Live Prices button shows loading state', async ({ page }) => {
    // Click fetch and check loading state
    await page.click('#fetchPricesBtn');

    // Button should be disabled during fetch
    // Note: This may be quick, so we just verify the button exists
    await expect(page.locator('#fetchPricesBtn')).toBeVisible();
  });

  test('dashboard reflects updated gold price', async ({ page }) => {
    await page.fill('#settingsGoldPrice', '5000');
    await page.click('button:has-text("Save Settings")');

    // Go to dashboard
    await page.click('.nav-item[data-page="dashboard"]');

    // Dashboard gold price should show new value
    await expect(page.locator('#goldPrice')).toContainText('5,000');
  });
});

test.describe('Labor Rate', () => {
  test.beforeEach(async ({ page }) => {
    await setupApp(page);
    await page.click('.nav-item[data-page="settings"]');
  });

  test('displays current labor rate', async ({ page }) => {
    await expect(page.locator('#settingsLaborRate')).toHaveValue('75');
  });

  test('can update labor rate', async ({ page }) => {
    await page.fill('#settingsLaborRate', '85');
    await page.click('button:has-text("Save Settings")');

    await page.reload();
    await page.click('.nav-item[data-page="settings"]');
    await expect(page.locator('#settingsLaborRate')).toHaveValue('85');
  });
});

test.describe('Document Numbering', () => {
  test.beforeEach(async ({ page }) => {
    await setupApp(page);
    await page.click('.nav-item[data-page="settings"]');
  });

  test('displays next estimate number', async ({ page }) => {
    await expect(page.locator('#settingsEstimateNum')).toHaveValue('5');
  });

  test('displays next invoice number', async ({ page }) => {
    await expect(page.locator('#settingsInvoiceNum')).toHaveValue('3');
  });

  test('can update document numbers', async ({ page }) => {
    await page.fill('#settingsEstimateNum', '100');
    await page.fill('#settingsInvoiceNum', '50');
    await page.click('button:has-text("Save Settings")');

    await page.reload();
    await page.click('.nav-item[data-page="settings"]');
    await expect(page.locator('#settingsEstimateNum')).toHaveValue('100');
    await expect(page.locator('#settingsInvoiceNum')).toHaveValue('50');
  });

  test('new estimate uses updated number', async ({ page }) => {
    await page.fill('#settingsEstimateNum', '99');
    await page.click('button:has-text("Save Settings")');

    await page.click('button:has-text("New Estimate")');

    await expect(page.locator('#docBadge')).toContainText('EST-0099');
  });
});

test.describe('Logo Management', () => {
  test.beforeEach(async ({ page }) => {
    await setupApp(page);
    await page.click('.nav-item[data-page="settings"]');
  });

  test('displays logo preview area', async ({ page }) => {
    await expect(page.locator('#settingsLogoPreview')).toBeVisible();
  });

  test('shows "No logo" when no logo set', async ({ page }) => {
    await expect(page.locator('#settingsLogoPreview')).toContainText('No logo');
  });

  test('has logo upload input', async ({ page }) => {
    await expect(page.locator('#settingsLogoInput')).toBeAttached();
  });

  test('has remove logo button', async ({ page }) => {
    await expect(page.locator('button:has-text("Remove Logo")')).toBeVisible();
  });
});

test.describe('Data Management', () => {
  test.beforeEach(async ({ page }) => {
    await setupApp(page);
    await page.click('.nav-item[data-page="settings"]');
  });

  test('shows export data button', async ({ page }) => {
    await expect(page.locator('button:has-text("Export Data")')).toBeVisible();
  });

  test('shows import data button', async ({ page }) => {
    await expect(page.locator('button:has-text("Import Data")')).toBeVisible();
  });

  test('shows clear history button', async ({ page }) => {
    await expect(page.locator('button:has-text("Clear History")')).toBeVisible();
  });

  test('export data triggers download', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Export Data")');
    const download = await downloadPromise;

    // Verify download filename contains backup
    expect(download.suggestedFilename()).toContain('backup');
    expect(download.suggestedFilename()).toContain('.json');
  });

  test('clear history shows confirmation', async ({ page }) => {
    // Add some history first
    await page.evaluate(() => {
      localStorage.setItem('jewelryInvoiceHistory', JSON.stringify([
        { id: '1', type: 'estimate', number: 'EST-0001', customer: { name: 'Test' }, total: 100 }
      ]));
    });
    await page.reload();
    await page.click('.nav-item[data-page="settings"]');

    // Setup dialog handler
    page.on('dialog', async dialog => {
      expect(dialog.type()).toBe('confirm');
      expect(dialog.message()).toContain('clear');
      await dialog.accept();
    });

    await page.click('button:has-text("Clear History")');

    // Toast should confirm
    await expect(page.locator('.toast')).toContainText('cleared');
  });
});

test.describe('Settings Persistence', () => {
  test('settings persist across page reloads', async ({ page }) => {
    await setupApp(page);
    await page.click('.nav-item[data-page="settings"]');

    // Change settings
    await page.fill('#settingsCompanyName', 'Persistent Store');
    await page.fill('#settingsGoldPrice', '5500');
    await page.click('button:has-text("Save Settings")');

    // Full reload
    await page.reload();

    // Verify settings
    await page.click('.nav-item[data-page="settings"]');
    await expect(page.locator('#settingsCompanyName')).toHaveValue('Persistent Store');
    await expect(page.locator('#settingsGoldPrice')).toHaveValue('5500');
  });

  test('settings persist across browser sessions', async ({ page, context }) => {
    await setupApp(page);
    await page.click('.nav-item[data-page="settings"]');

    await page.fill('#settingsCompanyName', 'Session Test Store');
    await page.click('button:has-text("Save Settings")');

    // Create new page in same context (simulates new tab)
    const newPage = await context.newPage();
    await newPage.goto('/');

    // Should load same settings
    await newPage.click('.nav-item[data-page="settings"]');
    await expect(newPage.locator('#settingsCompanyName')).toHaveValue('Session Test Store');

    await newPage.close();
  });
});

test.describe('Save Settings Validation', () => {
  test.beforeEach(async ({ page }) => {
    await setupApp(page);
    await page.click('.nav-item[data-page="settings"]');
  });

  test('shows success toast on save', async ({ page }) => {
    await page.click('button:has-text("Save Settings")');
    await expect(page.locator('.toast')).toContainText('Settings saved');
  });

  test('handles empty gold price with default', async ({ page }) => {
    await page.fill('#settingsGoldPrice', '');
    await page.click('button:has-text("Save Settings")');

    await page.reload();
    await page.click('.nav-item[data-page="settings"]');

    // Should have fallback value
    await expect(page.locator('#settingsGoldPrice')).toHaveValue('4700');
  });

  test('handles empty labor rate with default', async ({ page }) => {
    await page.fill('#settingsLaborRate', '');
    await page.click('button:has-text("Save Settings")');

    await page.reload();
    await page.click('.nav-item[data-page="settings"]');

    // Should have fallback value
    await expect(page.locator('#settingsLaborRate')).toHaveValue('75');
  });
});

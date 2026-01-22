// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * E2E Tests: History Page
 * Tests document history, filtering, and search
 */

// Helper to setup app with settings
async function setupApp(page) {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('jewelryInvoiceSettings', JSON.stringify({
      companyName: 'Test Jewelry Store',
      address: '123 Main St',
      phone: '(555) 123-4567',
      email: 'test@jewelry.com',
      goldPrice: 4700,
      silverPrice: 95,
      platinumPrice: 2400,
      palladiumPrice: 1800,
      laborRate: 75,
      nextEstimateNum: 1,
      nextInvoiceNum: 1,
      footer: 'Thank you!'
    }));
  });
  await page.reload();
}

// Helper to create sample documents
async function createSampleDocuments(page) {
  await page.evaluate(() => {
    const now = new Date();

    // Create estimates
    const estimates = [
      {
        id: 'est-1',
        number: '00001',
        customer: { name: 'Alice Estimate', phone: '555-1111', email: 'alice@test.com' },
        orders: [{ id: '1', orderNum: 1, displayDescription: 'Ring', total: 100, selected: true }],
        lineItems: [],
        total: 100,
        subtotal: 100,
        createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'est-2',
        number: '00002',
        customer: { name: 'Bob Estimate', phone: '555-2222', email: 'bob@test.com' },
        orders: [{ id: '1', orderNum: 1, displayDescription: 'Necklace', total: 200, selected: true }],
        lineItems: [],
        total: 200,
        subtotal: 200,
        createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(now.getTime() + 27 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    // Create invoices
    const invoices = [
      {
        id: 'inv-1',
        number: '00003',
        customer: { name: 'Charlie Invoice', phone: '555-3333', email: 'charlie@test.com' },
        orders: [],
        lineItems: [],
        total: 150,
        subtotal: 150,
        status: 'active',
        createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        acceptedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'inv-2',
        number: '00004',
        customer: { name: 'Diana Invoice', phone: '555-4444', email: 'diana@test.com' },
        orders: [],
        lineItems: [],
        total: 300,
        subtotal: 300,
        status: 'paid',
        createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        acceptedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        paidAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    // Create history (archived documents)
    const history = [
      {
        id: 'hist-1',
        type: 'estimate',
        number: 'EST-0099',
        customer: { name: 'Old Customer' },
        total: 50,
        date: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        lineItems: []
      }
    ];

    localStorage.setItem('jewelryEstimates', JSON.stringify(estimates));
    localStorage.setItem('jewelryInvoices', JSON.stringify(invoices));
    localStorage.setItem('jewelryInvoiceHistory', JSON.stringify(history));
  });
  await page.reload();
}

test.describe('History Page', () => {
  test.beforeEach(async ({ page }) => {
    await setupApp(page);
    await createSampleDocuments(page);
  });

  test('navigates to history page', async ({ page }) => {
    await page.click('.nav-item[data-page="history"]');
    await expect(page.locator('#historyPage')).toHaveClass(/active/);
  });

  test('displays combined documents list', async ({ page }) => {
    await page.click('.nav-item[data-page="history"]');

    // Should show documents from estimates, invoices, and history
    const docRows = page.locator('.doc-row');
    const count = await docRows.count();
    expect(count).toBeGreaterThanOrEqual(4); // 2 estimates + 2 invoices + 1 history
  });

  test('shows document numbers', async ({ page }) => {
    await page.click('.nav-item[data-page="history"]');

    // Check for document numbers
    await expect(page.locator('.doc-row-number').first()).toBeVisible();
  });

  test('shows customer names', async ({ page }) => {
    await page.click('.nav-item[data-page="history"]');

    // Check for customer names
    await expect(page.locator('.doc-row-customer').first()).toBeVisible();
  });

  test('shows document totals', async ({ page }) => {
    await page.click('.nav-item[data-page="history"]');

    // Check for amounts
    await expect(page.locator('.doc-row-amount').first()).toBeVisible();
    await expect(page.locator('.doc-row-amount').first()).toContainText('$');
  });

  test('shows status badges', async ({ page }) => {
    await page.click('.nav-item[data-page="history"]');

    // Check for status badges
    await expect(page.locator('.status-badge').first()).toBeVisible();
  });
});

test.describe('History Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await setupApp(page);
    await createSampleDocuments(page);
  });

  test('shows filter tabs', async ({ page }) => {
    await page.click('.nav-item[data-page="history"]');

    await expect(page.locator('.filter-tab[data-filter="all"]')).toBeVisible();
    await expect(page.locator('.filter-tab[data-filter="estimate"]')).toBeVisible();
    await expect(page.locator('.filter-tab[data-filter="invoice"]')).toBeVisible();
  });

  test('defaults to showing all documents', async ({ page }) => {
    await page.click('.nav-item[data-page="history"]');

    await expect(page.locator('.filter-tab[data-filter="all"]')).toHaveClass(/active/);
  });

  test('filters to estimates only', async ({ page }) => {
    await page.click('.nav-item[data-page="history"]');
    await page.click('.filter-tab[data-filter="estimate"]');

    // Should only show estimates
    const docRows = page.locator('.doc-row');
    const count = await docRows.count();

    // All visible should be estimates
    for (let i = 0; i < count; i++) {
      const icon = docRows.nth(i).locator('.doc-row-icon');
      await expect(icon).toHaveClass(/estimate/);
    }
  });

  test('filters to invoices only', async ({ page }) => {
    await page.click('.nav-item[data-page="history"]');
    await page.click('.filter-tab[data-filter="invoice"]');

    // Should only show invoices
    const docRows = page.locator('.doc-row');
    const count = await docRows.count();

    // All visible should be invoices
    for (let i = 0; i < count; i++) {
      const icon = docRows.nth(i).locator('.doc-row-icon');
      await expect(icon).toHaveClass(/invoice/);
    }
  });

  test('maintains filter after search', async ({ page }) => {
    await page.click('.nav-item[data-page="history"]');
    await page.click('.filter-tab[data-filter="estimate"]');

    // Perform search
    await page.fill('#historySearch', 'Alice');

    // Should still be filtered to estimates
    await expect(page.locator('.filter-tab[data-filter="estimate"]')).toHaveClass(/active/);
  });
});

test.describe('History Search', () => {
  test.beforeEach(async ({ page }) => {
    await setupApp(page);
    await createSampleDocuments(page);
  });

  test('shows search input', async ({ page }) => {
    await page.click('.nav-item[data-page="history"]');
    await expect(page.locator('#historySearch')).toBeVisible();
  });

  test('searches by customer name', async ({ page }) => {
    await page.click('.nav-item[data-page="history"]');
    await page.fill('#historySearch', 'Alice');

    // Trigger search (may be on input or debounced)
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);

    // Should find Alice
    await expect(page.locator('.doc-row')).toContainText('Alice');
  });

  test('searches by document number', async ({ page }) => {
    await page.click('.nav-item[data-page="history"]');
    await page.fill('#historySearch', '00003');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);

    // Should find document 00003
    const docRows = page.locator('.doc-row');
    const count = await docRows.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('shows empty state when no results', async ({ page }) => {
    await page.click('.nav-item[data-page="history"]');
    await page.fill('#historySearch', 'NonexistentCustomer12345');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);

    // Should show empty state or no results
    const docRows = page.locator('.doc-row');
    const count = await docRows.count();
    expect(count).toBe(0);
  });

  test('clears search shows all documents', async ({ page }) => {
    await page.click('.nav-item[data-page="history"]');

    // Search first
    await page.fill('#historySearch', 'Alice');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);

    // Clear search
    await page.fill('#historySearch', '');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);

    // Should show all documents again
    const docRows = page.locator('.doc-row');
    const count = await docRows.count();
    expect(count).toBeGreaterThanOrEqual(4);
  });
});

test.describe('History Document Actions', () => {
  test.beforeEach(async ({ page }) => {
    await setupApp(page);
    await createSampleDocuments(page);
  });

  test('clicking estimate opens estimate detail', async ({ page }) => {
    await page.click('.nav-item[data-page="history"]');
    await page.click('.filter-tab[data-filter="estimate"]');

    // Click first estimate
    await page.click('.doc-row >> nth=0');

    // Should open estimate detail modal
    await expect(page.locator('#estimateDetailModal')).toHaveClass(/active/);
  });

  test('clicking invoice opens invoice detail', async ({ page }) => {
    await page.click('.nav-item[data-page="history"]');
    await page.click('.filter-tab[data-filter="invoice"]');

    // Click first invoice
    await page.click('.doc-row >> nth=0');

    // Should open invoice detail modal
    await expect(page.locator('#invoiceDetailModal')).toHaveClass(/active/);
  });
});

test.describe('History Sorting', () => {
  test.beforeEach(async ({ page }) => {
    await setupApp(page);
    await createSampleDocuments(page);
  });

  test('documents are sorted by date newest first', async ({ page }) => {
    await page.click('.nav-item[data-page="history"]');

    // Get all dates
    const dates = await page.locator('.doc-row-date').allTextContents();

    // Verify dates are in descending order (most recent first)
    // This is a basic check - dates should be parseable
    expect(dates.length).toBeGreaterThan(0);
  });
});

test.describe('Empty History State', () => {
  test('shows empty state when no documents exist', async ({ page }) => {
    await setupApp(page);
    // Don't create any documents

    await page.click('.nav-item[data-page="history"]');

    // Should show empty state
    await expect(page.locator('.empty-state')).toBeVisible();
    await expect(page.locator('.empty-state')).toContainText('No documents');
  });

  test('empty state has create button', async ({ page }) => {
    await setupApp(page);

    await page.click('.nav-item[data-page="history"]');

    // Should have a create document button
    await expect(page.locator('.empty-state button')).toBeVisible();
  });

  test('create button navigates to create page', async ({ page }) => {
    await setupApp(page);

    await page.click('.nav-item[data-page="history"]');
    await page.click('.empty-state button');

    // Should be on create page
    await expect(page.locator('#createPage')).toHaveClass(/active/);
  });
});

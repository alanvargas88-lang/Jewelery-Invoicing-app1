// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * E2E Tests: Estimate Workflow
 * Tests the complete estimate creation and management flow
 */

// Helper to complete setup and get to main app
async function completeSetup(page) {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('jewelryInvoiceSettings', JSON.stringify({
      companyName: 'Test Jewelry Store',
      address: '123 Main St\nNew York, NY 10001',
      phone: '(555) 123-4567',
      email: 'test@jewelry.com',
      goldPrice: 4700,
      silverPrice: 95,
      platinumPrice: 2400,
      palladiumPrice: 1800,
      laborRate: 75,
      nextEstimateNum: 1,
      nextInvoiceNum: 1,
      footer: 'Thank you for your business!'
    }));
  });
  await page.reload();
  await expect(page.locator('#mainApp')).toBeVisible();
  // Wait for dashboard to be fully loaded
  await expect(page.locator('#dashboardPage')).toHaveClass(/active/);
}

// Helper to click New Estimate - uses the quick action card on dashboard
async function clickNewEstimate(page) {
  await page.click('.quick-action-card:has-text("New Estimate")');
  await expect(page.locator('#createPage')).toHaveClass(/active/);
}

test.describe('Estimate Creation', () => {
  test.beforeEach(async ({ page }) => {
    await completeSetup(page);
  });

  test('navigates to create page from dashboard', async ({ page }) => {
    // Click new estimate button
    await clickNewEstimate(page);

    // Estimate should be selected
    await expect(page.locator('.doc-type-card[data-type="estimate"]')).toHaveClass(/active/);
  });

  test('displays correct document number', async ({ page }) => {
    await clickNewEstimate(page);

    // Doc badge should show EST-0001
    await expect(page.locator('#docBadge')).toContainText('EST-0001');
  });

  test('switches between estimate and invoice types', async ({ page }) => {
    await clickNewEstimate(page);

    // Switch to invoice
    await page.click('.doc-type-card[data-type="invoice"]');
    await expect(page.locator('#docBadge')).toContainText('INV');

    // Switch back to estimate
    await page.click('.doc-type-card[data-type="estimate"]');
    await expect(page.locator('#docBadge')).toContainText('EST');
  });

  test('requires customer name to proceed to step 3', async ({ page }) => {
    await clickNewEstimate(page);

    // Go to step 2
    await page.click('button:has-text("Continue")');
    await expect(page.locator('#createStep2')).toHaveClass(/active/);

    // Try to proceed without customer name
    await page.click('button:has-text("Continue")');

    // Should still be on step 2
    await expect(page.locator('#createStep2')).toHaveClass(/active/);

    // Toast should appear
    await expect(page.locator('.toast')).toContainText('customer name');
  });

  test('proceeds with valid customer info', async ({ page }) => {
    await clickNewEstimate(page);

    // Step 2
    await page.click('button:has-text("Continue")');
    await page.fill('#customerName', 'John Smith');
    await page.fill('#customerPhone', '(555) 987-6543');
    await page.fill('#customerEmail', 'john@email.com');
    await page.click('button:has-text("Continue")');

    // Should be on step 3
    await expect(page.locator('#createStep3')).toHaveClass(/active/);
  });
});

test.describe('Order Creation Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await completeSetup(page);
    // Navigate to step 3
    await clickNewEstimate(page);
    await page.click('button:has-text("Continue")');
    await page.fill('#customerName', 'John Smith');
    await page.click('button:has-text("Continue")');
  });

  test('shows empty orders message initially', async ({ page }) => {
    await expect(page.locator('#ordersListContainer')).toContainText('No orders created');
  });

  test('opens order detail modal when clicking Add Order', async ({ page }) => {
    await page.click('button:has-text("Add Order")');
    await expect(page.locator('#orderDetailModal')).toHaveClass(/active/);
  });

  test('requires jewelry type to save order', async ({ page }) => {
    await page.click('button:has-text("Add Order")');

    // Try to save without selecting jewelry type
    await page.click('button:has-text("Save & Add Services")');

    // Should show toast
    await expect(page.locator('.toast')).toContainText('jewelry type');
  });

  test('saves order details and shows services panel', async ({ page }) => {
    await page.click('button:has-text("Add Order")');

    // Fill order details
    await page.selectOption('#orderJewelryType', 'Ring');
    await page.selectOption('#orderMetalType', '14kt Gold');
    await page.selectOption('#orderMetalColor', 'Yellow');
    await page.fill('#orderCarat', '14k');
    await page.fill('#orderSize', '7');
    await page.fill('#orderDescription', 'Engagement ring');

    await page.click('button:has-text("Save & Add Services")');

    // Modal should close and services panel should show
    await expect(page.locator('#orderDetailModal')).not.toHaveClass(/active/);
    await expect(page.locator('#orderServicesPanel')).toBeVisible();
  });

  test('adds service to order', async ({ page }) => {
    // Create order
    await page.click('button:has-text("Add Order")');
    await page.selectOption('#orderJewelryType', 'Ring');
    await page.click('button:has-text("Save & Add Services")');

    // Add ring sizing service
    await page.click('.tab[data-category="ring-sizing"]');
    await page.selectOption('#sizingMetal', '10kt-14kt');
    await page.selectOption('#sizingWidth', 'medium');
    await page.selectOption('#sizingService', '1-up');
    await page.click('button:has-text("Add Service")');

    // Service should appear in current order services
    await expect(page.locator('#currentOrderServices')).toContainText('Ring Sizing');
  });

  test('completes order and shows in orders list', async ({ page }) => {
    // Create order
    await page.click('button:has-text("Add Order")');
    await page.selectOption('#orderJewelryType', 'Ring');
    await page.click('button:has-text("Save & Add Services")');

    // Add service
    await page.click('.tab[data-category="ring-sizing"]');
    await page.click('button:has-text("Add Service")');

    // Finish order
    await page.click('button:has-text("Done with Order")');

    // Order should appear in orders list
    await expect(page.locator('#ordersListContainer .order-card')).toBeVisible();
    await expect(page.locator('#ordersListContainer')).toContainText('Order #1');
  });

  test('cannot proceed to preview without finishing current order', async ({ page }) => {
    // Start an order but don't finish it
    await page.click('button:has-text("Add Order")');
    await page.selectOption('#orderJewelryType', 'Ring');
    await page.click('button:has-text("Save & Add Services")');

    // Try to go to step 4
    await page.click('button:has-text("Review Document")');

    // Should show toast about finishing order
    await expect(page.locator('.toast')).toContainText('finish');
  });

  test('cannot proceed to preview without any orders', async ({ page }) => {
    // Try to go to step 4 without orders
    await page.click('button:has-text("Review Document")');

    // Should show toast about adding orders
    await expect(page.locator('.toast')).toContainText('order');
  });
});

test.describe('Estimate Preview and Export', () => {
  test.beforeEach(async ({ page }) => {
    await completeSetup(page);
    // Create complete estimate
    await clickNewEstimate(page);
    await page.click('button:has-text("Continue")');
    await page.fill('#customerName', 'John Smith');
    await page.fill('#customerPhone', '(555) 987-6543');
    await page.click('button:has-text("Continue")');

    // Create order with service
    await page.click('button:has-text("Add Order")');
    await page.selectOption('#orderJewelryType', 'Ring');
    await page.click('button:has-text("Save & Add Services")');

    await page.click('.tab[data-category="ring-sizing"]');
    await page.click('button:has-text("Add Service")');
    await page.click('button:has-text("Done with Order")');
  });

  test('shows preview with all document info', async ({ page }) => {
    await page.click('button:has-text("Review Document")');
    await expect(page.locator('#createStep4')).toHaveClass(/active/);

    // Check preview content
    await expect(page.locator('#previewCompanyName')).toContainText('Test Jewelry Store');
    await expect(page.locator('#previewCustomerName')).toContainText('John Smith');
    await expect(page.locator('#previewDocType')).toContainText('ESTIMATE');
    await expect(page.locator('#previewDocNumber')).toContainText('EST-0001');
  });

  test('shows line items in preview', async ({ page }) => {
    await page.click('button:has-text("Review Document")');

    // Line items table should have content
    await expect(page.locator('#previewLineItems tr')).toHaveCount(1);
  });

  test('applies discount in preview', async ({ page }) => {
    // Go back and add discount
    await page.fill('#discountPercent', '10');

    await page.click('button:has-text("Review Document")');

    // Discount row should be visible
    await expect(page.locator('#previewDiscountRow')).toBeVisible();
    await expect(page.locator('#previewDiscountPercent')).toContainText('10');
  });

  test('exports and saves estimate', async ({ page }) => {
    await page.click('button:has-text("Review Document")');

    // Click export PDF (this may open download dialog)
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Save as PDF")');

    // Should show success modal
    await expect(page.locator('#successModal')).toHaveClass(/active/);
    await expect(page.locator('#successMessage')).toContainText('estimate');
  });
});

test.describe('Estimates Management', () => {
  test.beforeEach(async ({ page }) => {
    await completeSetup(page);

    // Pre-populate with an estimate
    await page.evaluate(() => {
      const estimate = {
        id: '123456',
        number: '00001',
        customer: { name: 'John Smith', phone: '555-1234', email: 'john@test.com' },
        orders: [{
          id: '123456-1',
          orderNum: 1,
          displayDescription: 'Gold Ring',
          services: [{ description: 'Ring Sizing', unitPrice: 50, quantity: 1, total: 50 }],
          total: 50,
          selected: true
        }],
        lineItems: [{ description: 'Ring Sizing', unitPrice: 50, quantity: 1, total: 50 }],
        total: 50,
        subtotal: 50,
        discountPercent: 0,
        discountAmount: 0,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        editHistory: []
      };
      localStorage.setItem('jewelryEstimates', JSON.stringify([estimate]));
    });
    await page.reload();
  });

  test('displays estimates list', async ({ page }) => {
    await page.click('.nav-item[data-page="estimates"]');
    await expect(page.locator('#estimatesPage')).toHaveClass(/active/);

    // Should show the estimate
    await expect(page.locator('.estimate-card')).toBeVisible();
    await expect(page.locator('.estimate-card')).toContainText('#00001');
    await expect(page.locator('.estimate-card')).toContainText('John Smith');
  });

  test('opens estimate detail modal', async ({ page }) => {
    await page.click('.nav-item[data-page="estimates"]');
    await page.click('.estimate-card');

    await expect(page.locator('#estimateDetailModal')).toHaveClass(/active/);
    await expect(page.locator('#estimateDetailContent')).toContainText('Estimate #00001');
  });

  test('shows orders with checkboxes for selection', async ({ page }) => {
    await page.click('.nav-item[data-page="estimates"]');
    await page.click('.estimate-card');

    // Should show order with checkbox
    await expect(page.locator('.order-item')).toBeVisible();
    await expect(page.locator('.order-item input[type="checkbox"]')).toBeChecked();
  });

  test('can toggle order selection', async ({ page }) => {
    await page.click('.nav-item[data-page="estimates"]');
    await page.click('.estimate-card');

    const checkbox = page.locator('.order-item input[type="checkbox"]');
    await checkbox.click();

    // Should be unchecked now
    await expect(checkbox).not.toBeChecked();
  });

  test('can accept estimate to create invoice', async ({ page }) => {
    await page.click('.nav-item[data-page="estimates"]');
    await page.click('.estimate-card');

    // Accept the estimate
    page.on('dialog', dialog => dialog.accept());
    await page.click('button:has-text("Accept Selected Orders")');

    // Should navigate to invoices page
    await expect(page.locator('#invoicesPage')).toHaveClass(/active/);

    // Invoice should be created
    await expect(page.locator('.invoice-card')).toBeVisible();
  });

  test('can delete estimate', async ({ page }) => {
    await page.click('.nav-item[data-page="estimates"]');
    await page.click('.estimate-card');

    // Delete the estimate
    page.on('dialog', dialog => dialog.accept());
    await page.click('button:has-text("Delete Estimate")');

    // Modal should close
    await expect(page.locator('#estimateDetailModal')).not.toHaveClass(/active/);

    // Toast should confirm deletion
    await expect(page.locator('.toast')).toContainText('deleted');
  });
});

test.describe('Estimate Partial Acceptance', () => {
  test.beforeEach(async ({ page }) => {
    await completeSetup(page);

    // Create estimate with multiple orders
    await page.evaluate(() => {
      const estimate = {
        id: '123456',
        number: '00001',
        customer: { name: 'John Smith', phone: '555-1234', email: 'john@test.com' },
        orders: [
          {
            id: '123456-1',
            orderNum: 1,
            displayDescription: 'Gold Ring - Sizing',
            services: [{ description: 'Ring Sizing', unitPrice: 50, quantity: 1, total: 50 }],
            total: 50,
            selected: true
          },
          {
            id: '123456-2',
            orderNum: 2,
            displayDescription: 'Silver Necklace - Repair',
            services: [{ description: 'Chain Solder', unitPrice: 12, quantity: 1, total: 12 }],
            total: 12,
            selected: true
          },
          {
            id: '123456-3',
            orderNum: 3,
            displayDescription: 'Bracelet - Clean',
            services: [{ description: 'Clean/Polish', unitPrice: 25, quantity: 1, total: 25 }],
            total: 25,
            selected: true
          }
        ],
        lineItems: [],
        total: 87,
        subtotal: 87,
        discountPercent: 0,
        discountAmount: 0,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        editHistory: []
      };
      localStorage.setItem('jewelryEstimates', JSON.stringify([estimate]));
    });
    await page.reload();
  });

  test('shows all orders for selection', async ({ page }) => {
    await page.click('.nav-item[data-page="estimates"]');
    await page.click('.estimate-card');

    // Should show 3 orders
    const orders = page.locator('.order-item');
    await expect(orders).toHaveCount(3);
  });

  test('partial acceptance keeps unselected orders in estimate', async ({ page }) => {
    await page.click('.nav-item[data-page="estimates"]');
    await page.click('.estimate-card');

    // Uncheck the third order
    const checkboxes = page.locator('.order-item input[type="checkbox"]');
    await checkboxes.nth(2).click();

    // Accept
    page.on('dialog', dialog => dialog.accept());
    await page.click('button:has-text("Accept Selected Orders")');

    // Navigate back to estimates
    await page.click('.nav-item[data-page="estimates"]');

    // Estimate should still exist with remaining order
    await expect(page.locator('.estimate-card')).toBeVisible();
  });
});

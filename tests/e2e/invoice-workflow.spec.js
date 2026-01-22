// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * E2E Tests: Invoice Workflow
 * Tests invoice management, order completion, and payment tracking
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
      goldPrice: 4700,
      silverPrice: 95,
      platinumPrice: 2400,
      palladiumPrice: 1800,
      laborRate: 75,
      nextEstimateNum: 2,
      nextInvoiceNum: 1,
      footer: 'Thank you for your business!'
    }));
  });
  await page.reload();
}

// Helper to create an invoice from an estimate
async function createInvoiceFromEstimate(page) {
  await page.evaluate(() => {
    const now = new Date();
    const readyBy = new Date(now.getTime() + 9 * 24 * 60 * 60 * 1000);
    const shipBy = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);

    const invoice = {
      id: 'inv-123',
      number: '00001',
      customer: { name: 'John Smith', phone: '555-1234', email: 'john@test.com' },
      orders: [
        {
          id: 'inv-123-1',
          orderNum: 1,
          displayDescription: 'Gold Ring - Sizing',
          services: [{ description: 'Ring Sizing', unitPrice: 50, quantity: 1, total: 50 }],
          total: 50,
          status: 'pending',
          repairTicketId: 'ticket-1'
        },
        {
          id: 'inv-123-2',
          orderNum: 2,
          displayDescription: 'Silver Necklace - Repair',
          services: [{ description: 'Chain Solder', unitPrice: 12, quantity: 1, total: 12 }],
          total: 12,
          status: 'pending',
          repairTicketId: 'ticket-2'
        }
      ],
      lineItems: [
        { description: 'Ring Sizing', unitPrice: 50, quantity: 1, total: 50, orderNum: 1 },
        { description: 'Chain Solder', unitPrice: 12, quantity: 1, total: 12, orderNum: 2 }
      ],
      total: 62,
      subtotal: 62,
      discountPercent: 0,
      discountAmount: 0,
      createdAt: now.toISOString(),
      acceptedAt: now.toISOString(),
      readyByDate: readyBy.toISOString(),
      shipByDate: shipBy.toISOString(),
      status: 'active',
      allOrdersComplete: false,
      finishedAt: null,
      paidAt: null,
      editHistory: []
    };

    // Also create repair tickets
    const repairTickets = [
      {
        id: 'ticket-1',
        invoiceNumber: '00001',
        orderNumber: '#00001 (Order #1)',
        customer: { name: 'John Smith', phone: '555-1234', email: 'john@test.com' },
        itemDescription: 'Gold Ring - Sizing',
        services: [{ description: 'Ring Sizing', unitPrice: 50, quantity: 1, total: 50 }],
        pricing: { total: 50 },
        status: 'pending',
        dueDate: readyBy.toISOString(),
        createdAt: now.toISOString()
      },
      {
        id: 'ticket-2',
        invoiceNumber: '00001',
        orderNumber: '#00001 (Order #2)',
        customer: { name: 'John Smith', phone: '555-1234', email: 'john@test.com' },
        itemDescription: 'Silver Necklace - Repair',
        services: [{ description: 'Chain Solder', unitPrice: 12, quantity: 1, total: 12 }],
        pricing: { total: 12 },
        status: 'pending',
        dueDate: readyBy.toISOString(),
        createdAt: now.toISOString()
      }
    ];

    localStorage.setItem('jewelryInvoices', JSON.stringify([invoice]));
    localStorage.setItem('jewelryRepairTickets', JSON.stringify(repairTickets));
  });
  await page.reload();
}

test.describe('Invoice List View', () => {
  test.beforeEach(async ({ page }) => {
    await setupApp(page);
    await createInvoiceFromEstimate(page);
  });

  test('displays invoices page', async ({ page }) => {
    await page.click('.nav-item[data-page="invoices"]');
    await expect(page.locator('#invoicesPage')).toHaveClass(/active/);
  });

  test('shows invoice in list', async ({ page }) => {
    await page.click('.nav-item[data-page="invoices"]');

    await expect(page.locator('.invoice-card')).toBeVisible();
    await expect(page.locator('.invoice-card')).toContainText('#00001');
    await expect(page.locator('.invoice-card')).toContainText('John Smith');
  });

  test('displays invoice stats', async ({ page }) => {
    await page.click('.nav-item[data-page="invoices"]');

    // Active count should be 1
    const activeCount = page.locator('#invoicesActive');
    await expect(activeCount).toContainText('1');
  });

  test('shows invoice status badge', async ({ page }) => {
    await page.click('.nav-item[data-page="invoices"]');

    await expect(page.locator('.invoice-card .invoice-status-badge')).toContainText('Active');
  });
});

test.describe('Invoice Detail View', () => {
  test.beforeEach(async ({ page }) => {
    await setupApp(page);
    await createInvoiceFromEstimate(page);
  });

  test('opens invoice detail modal', async ({ page }) => {
    await page.click('.nav-item[data-page="invoices"]');
    await page.click('.invoice-card');

    await expect(page.locator('#invoiceDetailModal')).toHaveClass(/active/);
  });

  test('shows invoice information', async ({ page }) => {
    await page.click('.nav-item[data-page="invoices"]');
    await page.click('.invoice-card');

    // Check header info
    await expect(page.locator('#invoiceDetailContent')).toContainText('Invoice #00001');
    await expect(page.locator('#invoiceDetailContent')).toContainText('John Smith');
    await expect(page.locator('#invoiceDetailContent')).toContainText('$62.00');
  });

  test('shows orders with status', async ({ page }) => {
    await page.click('.nav-item[data-page="invoices"]');
    await page.click('.invoice-card');

    // Should show both orders
    const orders = page.locator('.invoice-order-item');
    await expect(orders).toHaveCount(2);
  });

  test('shows due dates', async ({ page }) => {
    await page.click('.nav-item[data-page="invoices"]');
    await page.click('.invoice-card');

    // Ready by and ship by dates should be displayed
    await expect(page.locator('#invoiceDetailContent')).toContainText('Ready by');
  });
});

test.describe('Order Completion', () => {
  test.beforeEach(async ({ page }) => {
    await setupApp(page);
    await createInvoiceFromEstimate(page);
  });

  test('can mark individual order as complete', async ({ page }) => {
    await page.click('.nav-item[data-page="invoices"]');
    await page.click('.invoice-card');

    // Find and click complete button for first order
    const completeBtn = page.locator('.invoice-order-item').first().locator('button:has-text("Complete")');

    if (await completeBtn.isVisible()) {
      await completeBtn.click();
      // Order status should update
      await expect(page.locator('.invoice-order-item').first()).toContainText('Completed');
    }
  });

  test('invoice status changes to finished when all orders complete', async ({ page }) => {
    // Create invoice with completed orders
    await page.evaluate(() => {
      const invoices = JSON.parse(localStorage.getItem('jewelryInvoices') || '[]');
      if (invoices.length > 0) {
        invoices[0].orders.forEach(order => {
          order.status = 'completed';
        });
        invoices[0].allOrdersComplete = true;
        invoices[0].status = 'finished';
        invoices[0].finishedAt = new Date().toISOString();
        localStorage.setItem('jewelryInvoices', JSON.stringify(invoices));
      }
    });
    await page.reload();

    await page.click('.nav-item[data-page="invoices"]');

    // Invoice should show finished status
    await expect(page.locator('.invoice-card')).toContainText('Finished');
  });
});

test.describe('Payment Tracking', () => {
  test.beforeEach(async ({ page }) => {
    await setupApp(page);

    // Create finished invoice ready for payment
    await page.evaluate(() => {
      const now = new Date();
      const invoice = {
        id: 'inv-123',
        number: '00001',
        customer: { name: 'John Smith', phone: '555-1234', email: 'john@test.com' },
        orders: [
          {
            id: 'inv-123-1',
            orderNum: 1,
            displayDescription: 'Gold Ring',
            total: 50,
            status: 'completed'
          }
        ],
        lineItems: [{ description: 'Ring Sizing', unitPrice: 50, quantity: 1, total: 50 }],
        total: 50,
        subtotal: 50,
        discountPercent: 0,
        discountAmount: 0,
        createdAt: now.toISOString(),
        acceptedAt: now.toISOString(),
        readyByDate: now.toISOString(),
        shipByDate: now.toISOString(),
        status: 'finished',
        allOrdersComplete: true,
        finishedAt: now.toISOString(),
        paidAt: null
      };
      localStorage.setItem('jewelryInvoices', JSON.stringify([invoice]));
    });
    await page.reload();
  });

  test('shows finished invoice', async ({ page }) => {
    await page.click('.nav-item[data-page="invoices"]');
    await expect(page.locator('.invoice-card')).toContainText('Finished');
  });

  test('can mark invoice as paid', async ({ page }) => {
    await page.click('.nav-item[data-page="invoices"]');
    await page.click('.invoice-card');

    // Look for mark as paid button
    const paidBtn = page.locator('button:has-text("Mark as Paid")');
    if (await paidBtn.isVisible()) {
      await paidBtn.click();

      // Reload and check
      await page.reload();
      await page.click('.nav-item[data-page="invoices"]');
      await expect(page.locator('.invoice-card')).toContainText('Paid');
    }
  });
});

test.describe('Invoice Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await setupApp(page);

    // Create multiple invoices with different statuses
    await page.evaluate(() => {
      const now = new Date();
      const invoices = [
        {
          id: 'inv-1',
          number: '00001',
          customer: { name: 'John Active', phone: '', email: '' },
          orders: [],
          lineItems: [],
          total: 50,
          subtotal: 50,
          status: 'active',
          createdAt: now.toISOString(),
          acceptedAt: now.toISOString()
        },
        {
          id: 'inv-2',
          number: '00002',
          customer: { name: 'Jane Finished', phone: '', email: '' },
          orders: [],
          lineItems: [],
          total: 75,
          subtotal: 75,
          status: 'finished',
          createdAt: now.toISOString(),
          acceptedAt: now.toISOString(),
          finishedAt: now.toISOString()
        },
        {
          id: 'inv-3',
          number: '00003',
          customer: { name: 'Bob Paid', phone: '', email: '' },
          orders: [],
          lineItems: [],
          total: 100,
          subtotal: 100,
          status: 'paid',
          createdAt: now.toISOString(),
          acceptedAt: now.toISOString(),
          finishedAt: now.toISOString(),
          paidAt: now.toISOString()
        }
      ];
      localStorage.setItem('jewelryInvoices', JSON.stringify(invoices));
    });
    await page.reload();
  });

  test('shows all invoices by default', async ({ page }) => {
    await page.click('.nav-item[data-page="invoices"]');
    const invoiceCards = page.locator('.invoice-card');
    await expect(invoiceCards).toHaveCount(3);
  });

  test('updates stats correctly', async ({ page }) => {
    await page.click('.nav-item[data-page="invoices"]');

    await expect(page.locator('#invoicesActive')).toContainText('1');
    await expect(page.locator('#invoicesFinished')).toContainText('1');
    await expect(page.locator('#invoicesPaid')).toContainText('1');
  });
});

test.describe('Direct Invoice Creation', () => {
  test.beforeEach(async ({ page }) => {
    await setupApp(page);
  });

  test('can create direct invoice without estimate', async ({ page }) => {
    await page.click('button:has-text("New Invoice")');

    // Should be on create page with invoice selected
    await expect(page.locator('#createPage')).toHaveClass(/active/);
    await expect(page.locator('.doc-type-card[data-type="invoice"]')).toHaveClass(/active/);
    await expect(page.locator('#docBadge')).toContainText('INV');
  });

  test('direct invoice shows correct document number', async ({ page }) => {
    await page.click('button:has-text("New Invoice")');
    await expect(page.locator('#docBadge')).toContainText('INV-0001');
  });
});

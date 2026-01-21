// ============================================
// Jewelry Invoice Pro - Application Logic
// ============================================

// State Management
const state = {
    currentPage: 'dashboard',
    createStep: 1,
    docType: 'estimate',
    lineItems: [],
    attachments: [],
    customer: { name: '', phone: '', email: '' },
    // Order-first workflow
    orders: [],           // Orders being created in current document
    currentOrderIndex: -1, // Index of order being edited (-1 = none)
    currentOrder: null,   // Current order being built
    settings: {
        companyName: '',
        address: '',
        phone: '',
        email: '',
        website: '',
        logo: null,
        footer: 'Thank you for your business! Please allow 10 days for repairs and 4 weeks for custom jobs.',
        goldPrice: 4700,
        silverPrice: 95,
        platinumPrice: 2400,
        palladiumPrice: 1800,
        laborRate: 75,
        nextEstimateNum: 1,
        nextInvoiceNum: 1,
        nextRepairNum: 1,
        nextOrderNum: 1
    },
    history: [],
    estimates: [],      // Active estimates (not yet accepted)
    invoices: [],       // Accepted invoices with orders
    repairTickets: [],  // Individual repair tickets for each order
    repairs: [],
    currentCalendarDate: new Date(),
    beforePhotos: [],
    afterPhotos: [],
    currentRepairId: null,
    currentEstimateId: null,
    currentInvoiceId: null,
    editingOrderIndex: null
};

// ============================================
// Initialization
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    loadFromStorage();
    initEventListeners();
    checkSetupComplete();
});

function loadFromStorage() {
    const savedSettings = localStorage.getItem('jewelryInvoiceSettings');
    if (savedSettings) {
        state.settings = { ...state.settings, ...JSON.parse(savedSettings) };
    }

    const savedHistory = localStorage.getItem('jewelryInvoiceHistory');
    if (savedHistory) {
        state.history = JSON.parse(savedHistory);
    }

    const savedRepairs = localStorage.getItem('jewelryRepairs');
    if (savedRepairs) {
        state.repairs = JSON.parse(savedRepairs);
    }

    const savedEstimates = localStorage.getItem('jewelryEstimates');
    if (savedEstimates) {
        state.estimates = JSON.parse(savedEstimates);
    }

    const savedInvoices = localStorage.getItem('jewelryInvoices');
    if (savedInvoices) {
        state.invoices = JSON.parse(savedInvoices);
    }

    const savedRepairTickets = localStorage.getItem('jewelryRepairTickets');
    if (savedRepairTickets) {
        state.repairTickets = JSON.parse(savedRepairTickets);
    }

    // Clean up expired estimates (30 days)
    cleanupExpiredEstimates();

    // Check for weekly reminders
    checkEstimateReminders();
}

function saveToStorage() {
    localStorage.setItem('jewelryInvoiceSettings', JSON.stringify(state.settings));
    localStorage.setItem('jewelryInvoiceHistory', JSON.stringify(state.history));
    localStorage.setItem('jewelryRepairs', JSON.stringify(state.repairs));
    localStorage.setItem('jewelryEstimates', JSON.stringify(state.estimates));
    localStorage.setItem('jewelryInvoices', JSON.stringify(state.invoices));
    localStorage.setItem('jewelryRepairTickets', JSON.stringify(state.repairTickets));
}

function checkSetupComplete() {
    if (state.settings.companyName) {
        showMainApp();
        updateDashboard();
        loadSettingsForm();
    } else {
        document.getElementById('setupScreen').style.display = 'flex';
        document.getElementById('mainApp').style.display = 'none';
    }
}

function showMainApp() {
    document.getElementById('setupScreen').style.display = 'none';
    document.getElementById('mainApp').style.display = 'flex';
    updateSidebarBadge();
}

// ============================================
// Event Listeners
// ============================================
function initEventListeners() {
    // Logo upload in setup
    const logoUploadArea = document.getElementById('logoUploadArea');
    const setupLogoInput = document.getElementById('setupLogo');

    if (logoUploadArea) {
        logoUploadArea.addEventListener('click', () => setupLogoInput.click());
        setupLogoInput.addEventListener('change', handleSetupLogoUpload);
    }

    // Attachment upload
    const attachmentDrop = document.getElementById('attachmentDrop');
    const attachmentInput = document.getElementById('attachmentInput');

    if (attachmentDrop) {
        attachmentDrop.addEventListener('click', () => attachmentInput.click());
        attachmentInput.addEventListener('change', handleAttachmentUpload);

        attachmentDrop.addEventListener('dragover', (e) => {
            e.preventDefault();
            attachmentDrop.style.borderColor = 'var(--primary)';
        });

        attachmentDrop.addEventListener('dragleave', () => {
            attachmentDrop.style.borderColor = '';
        });

        attachmentDrop.addEventListener('drop', (e) => {
            e.preventDefault();
            attachmentDrop.style.borderColor = '';
            handleAttachmentUpload({ target: { files: e.dataTransfer.files } });
        });
    }

    // Settings logo upload
    const settingsLogoInput = document.getElementById('settingsLogoInput');
    if (settingsLogoInput) {
        settingsLogoInput.addEventListener('change', handleSettingsLogoUpload);
    }

    // Import data
    const importDataInput = document.getElementById('importDataInput');
    if (importDataInput) {
        importDataInput.addEventListener('change', handleImportData);
    }
}

// ============================================
// Setup Wizard
// ============================================
function nextSetupStep(step) {
    if (step === 2) {
        const companyName = document.getElementById('setupCompanyName').value.trim();
        if (!companyName) {
            showToast('Please enter your business name');
            return;
        }
    }

    updateSetupProgress(step);
    showSetupStep(step);
}

function prevSetupStep(step) {
    updateSetupProgress(step);
    showSetupStep(step);
}

function updateSetupProgress(activeStep) {
    document.querySelectorAll('.progress-step').forEach((el, index) => {
        el.classList.remove('active', 'completed');
        if (index + 1 < activeStep) {
            el.classList.add('completed');
        } else if (index + 1 === activeStep) {
            el.classList.add('active');
        }
    });
}

function showSetupStep(step) {
    document.querySelectorAll('.setup-step').forEach(el => el.classList.remove('active'));
    document.getElementById(`setupStep${step}`).classList.add('active');
}

function handleSetupLogoUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            state.settings.logo = e.target.result;
            document.getElementById('uploadPlaceholder').style.display = 'none';
            document.getElementById('logoPreviewContainer').style.display = 'block';
            document.getElementById('setupLogoPreview').src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

function removeSetupLogo(e) {
    e.stopPropagation();
    state.settings.logo = null;
    document.getElementById('uploadPlaceholder').style.display = 'block';
    document.getElementById('logoPreviewContainer').style.display = 'none';
    document.getElementById('setupLogo').value = '';
}

function completeSetup() {
    // Gather all setup data
    state.settings.companyName = document.getElementById('setupCompanyName').value.trim();

    const address1 = document.getElementById('setupAddress1').value.trim();
    const city = document.getElementById('setupCity').value.trim();
    const stateVal = document.getElementById('setupState').value.trim();
    const zip = document.getElementById('setupZip').value.trim();

    let addressParts = [];
    if (address1) addressParts.push(address1);
    if (city || stateVal || zip) {
        addressParts.push([city, stateVal, zip].filter(Boolean).join(', '));
    }
    state.settings.address = addressParts.join('\n');

    state.settings.phone = document.getElementById('setupPhone').value.trim();
    state.settings.email = document.getElementById('setupEmail').value.trim();
    state.settings.website = document.getElementById('setupWebsite').value.trim();
    state.settings.footer = document.getElementById('setupFooter').value.trim();

    saveToStorage();
    showMainApp();
    updateDashboard();
    loadSettingsForm();
    showToast('Setup complete! Welcome to Jewelry Invoice Pro');
}

// ============================================
// Navigation
// ============================================
function navigateTo(page) {
    state.currentPage = page;

    // Update nav
    document.querySelectorAll('.nav-item').forEach(el => {
        el.classList.remove('active');
        if (el.dataset.page === page) {
            el.classList.add('active');
        }
    });

    // Show page
    document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
    document.getElementById(`${page}Page`).classList.add('active');

    // Page-specific actions
    if (page === 'dashboard') {
        updateDashboard();
    } else if (page === 'create') {
        resetCreateForm();
    } else if (page === 'estimates') {
        initEstimatesPage();
    } else if (page === 'invoices') {
        initInvoicesPage();
    } else if (page === 'repairs') {
        initRepairsPage();
    } else if (page === 'history') {
        renderHistoryList();
    } else if (page === 'settings') {
        loadSettingsForm();
    }

    // Close mobile sidebar
    document.getElementById('sidebar').classList.remove('open');
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

function updateSidebarBadge() {
    const badge = document.getElementById('sidebarCompanyBadge');
    if (badge && state.settings.companyName) {
        badge.querySelector('.company-initial').textContent = state.settings.companyName.charAt(0).toUpperCase();
        badge.querySelector('.company-name-short').textContent = state.settings.companyName;
    }
}

// ============================================
// Dashboard
// ============================================
function updateDashboard() {
    const estimates = state.history.filter(d => d.type === 'estimate');
    const invoices = state.history.filter(d => d.type === 'invoice');
    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0);

    document.getElementById('totalEstimates').textContent = estimates.length;
    document.getElementById('totalInvoices').textContent = invoices.length;
    document.getElementById('totalRevenue').textContent = formatCurrency(totalRevenue);
    document.getElementById('goldPrice').textContent = formatCurrency(state.settings.goldPrice);

    renderRecentDocs();
}

function renderRecentDocs() {
    const container = document.getElementById('recentDocs');
    const recentDocs = state.history.slice(-5).reverse();

    if (recentDocs.length === 0) {
        container.innerHTML = `
            <div class="empty-state-small">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
                <p>No documents yet</p>
                <span>Create your first estimate or invoice to get started</span>
            </div>
        `;
        return;
    }

    container.innerHTML = recentDocs.map(doc => `
        <div class="doc-row" onclick="viewDocument('${doc.id}')">
            <div class="doc-row-icon ${doc.type}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <path d="M14 2v6h6"/>
                </svg>
            </div>
            <div class="doc-row-info">
                <div class="doc-row-number">${doc.number}</div>
                <div class="doc-row-customer">${doc.customer.name}</div>
            </div>
            <div>
                <div class="doc-row-amount">${formatCurrency(doc.total)}</div>
                <div class="doc-row-date">${formatDate(doc.date)}</div>
            </div>
        </div>
    `).join('');
}

function startNewDocument(type) {
    state.docType = type;
    navigateTo('create');
    selectDocType(type);
}

// ============================================
// Create Document
// ============================================
function resetCreateForm() {
    state.createStep = 1;
    state.lineItems = [];
    state.attachments = [];
    state.customer = { name: '', phone: '', email: '' };
    state.currentEstimateId = null; // Reset estimate editing state

    // Reset order-first workflow state
    state.orders = [];
    state.currentOrderIndex = -1;
    state.currentOrder = null;

    // Reset step indicator
    document.querySelectorAll('.step').forEach((el, index) => {
        el.classList.remove('active', 'completed');
        if (index === 0) el.classList.add('active');
    });

    // Show first step
    document.querySelectorAll('.create-step').forEach(el => el.classList.remove('active'));
    document.getElementById('createStep1').classList.add('active');

    // Reset forms
    document.getElementById('customerName').value = '';
    document.getElementById('customerPhone').value = '';
    document.getElementById('customerEmail').value = '';
    document.getElementById('discountPercent').value = '0';
    document.getElementById('invoiceNotes').value = '';
    document.getElementById('attachmentGrid').innerHTML = '';

    // Update document badge
    updateDocBadge();
    updateSummary();
    updateDefaultRateDisplay();
    renderOrdersList();
}

// ============================================
// Order-First Workflow Functions
// ============================================
function startNewOrder() {
    // Create a new order with default values
    const orderNum = state.orders.length + 1;
    state.currentOrder = {
        id: Date.now().toString(),
        orderNum: orderNum,
        jewelryDetails: {
            type: '',
            metalType: '',
            metalColor: '',
            carat: '',
            size: '',
            description: ''
        },
        services: [],
        total: 0,
        status: 'pending',
        selected: true // For partial acceptance
    };
    state.currentOrderIndex = state.orders.length;

    // Show order detail modal
    openOrderDetailModal();
}

function openOrderDetailModal() {
    const modal = document.getElementById('orderDetailModal');
    if (!modal) return;

    // Reset form
    const form = document.getElementById('orderDetailForm');
    if (form) form.reset();

    // If editing existing order, populate form
    if (state.currentOrder && state.currentOrder.jewelryDetails) {
        const jd = state.currentOrder.jewelryDetails;
        const typeEl = document.getElementById('orderJewelryType');
        const metalEl = document.getElementById('orderMetalType');
        const colorEl = document.getElementById('orderMetalColor');
        const caratEl = document.getElementById('orderCarat');
        const sizeEl = document.getElementById('orderSize');
        const descEl = document.getElementById('orderDescription');

        if (typeEl) typeEl.value = jd.type || '';
        if (metalEl) metalEl.value = jd.metalType || '';
        if (colorEl) colorEl.value = jd.metalColor || '';
        if (caratEl) caratEl.value = jd.carat || '';
        if (sizeEl) sizeEl.value = jd.size || '';
        if (descEl) descEl.value = jd.description || '';
    }

    modal.classList.add('active');
    updateOrderModalTitle();
}

function closeOrderDetailModal() {
    const modal = document.getElementById('orderDetailModal');
    if (modal) modal.classList.remove('active');
}

function updateOrderModalTitle() {
    const titleEl = document.getElementById('orderModalTitle');
    if (titleEl && state.currentOrder) {
        titleEl.textContent = `Order #${state.currentOrder.orderNum} - Jewelry Details`;
    }
}

function saveOrderDetails() {
    if (!state.currentOrder) return;

    // Get form values
    const type = document.getElementById('orderJewelryType')?.value || '';
    const metalType = document.getElementById('orderMetalType')?.value || '';
    const metalColor = document.getElementById('orderMetalColor')?.value || '';
    const carat = document.getElementById('orderCarat')?.value || '';
    const size = document.getElementById('orderSize')?.value || '';
    const description = document.getElementById('orderDescription')?.value || '';

    if (!type) {
        showToast('Please select a jewelry type');
        return;
    }

    // Save jewelry details
    state.currentOrder.jewelryDetails = {
        type, metalType, metalColor, carat, size, description
    };

    // Build display description
    state.currentOrder.displayDescription = buildOrderDisplayDescription(state.currentOrder.jewelryDetails);

    closeOrderDetailModal();

    // Show the services panel for this order
    showOrderServicesPanel();
}

function buildOrderDisplayDescription(jd) {
    const parts = [];
    if (jd.type) parts.push(jd.type);
    if (jd.metalType) parts.push(jd.metalType);
    if (jd.metalColor && jd.metalColor !== 'yellow') parts.push(jd.metalColor);
    if (jd.carat) parts.push(jd.carat);
    if (jd.size) parts.push(`Size ${jd.size}`);
    if (jd.description) parts.push(`- ${jd.description}`);
    return parts.join(' ') || 'Jewelry Item';
}

function showOrderServicesPanel() {
    // Show the services section with current order context
    const panel = document.getElementById('orderServicesPanel');
    const orderInfo = document.getElementById('currentOrderInfo');

    if (panel) panel.style.display = 'block';

    if (orderInfo && state.currentOrder) {
        orderInfo.innerHTML = `
            <div class="current-order-badge">
                <span class="order-num">Order #${state.currentOrder.orderNum}</span>
                <span class="order-desc">${state.currentOrder.displayDescription}</span>
                <button class="btn btn-ghost btn-sm" onclick="editCurrentOrderDetails()">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
            </div>
        `;
    }

    renderCurrentOrderServices();
}

function editCurrentOrderDetails() {
    openOrderDetailModal();
}

function renderCurrentOrderServices() {
    const container = document.getElementById('currentOrderServices');
    if (!container || !state.currentOrder) return;

    if (state.currentOrder.services.length === 0) {
        container.innerHTML = `
            <div class="empty-services">
                <p>No services added yet. Use the service forms below to add services to this order.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = state.currentOrder.services.map((service, index) => `
        <div class="service-item">
            <div class="service-info">
                <span class="service-desc">${service.description}</span>
                <span class="service-price">${formatCurrency(service.unitPrice)} × ${service.quantity}</span>
            </div>
            <div class="service-actions">
                <span class="service-total">${formatCurrency(service.total)}</span>
                <button class="btn btn-ghost btn-sm" onclick="removeServiceFromOrder(${index})">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
            </div>
        </div>
    `).join('');

    updateCurrentOrderTotal();
}

function addServiceToCurrentOrder(description, unitPrice, quantity) {
    if (!state.currentOrder) {
        showToast('Please create an order first');
        return false;
    }

    const total = unitPrice * quantity;
    state.currentOrder.services.push({
        id: Date.now(),
        description,
        unitPrice,
        quantity,
        total
    });

    renderCurrentOrderServices();
    showToast('Service added to order');
    return true;
}

function removeServiceFromOrder(index) {
    if (!state.currentOrder || !state.currentOrder.services[index]) return;

    state.currentOrder.services.splice(index, 1);
    renderCurrentOrderServices();
}

function updateCurrentOrderTotal() {
    if (!state.currentOrder) return;

    state.currentOrder.total = state.currentOrder.services.reduce((sum, s) => sum + s.total, 0);

    const totalEl = document.getElementById('currentOrderTotal');
    if (totalEl) {
        totalEl.textContent = formatCurrency(state.currentOrder.total);
    }
}

function finishCurrentOrder() {
    if (!state.currentOrder) return;

    if (state.currentOrder.services.length === 0) {
        showToast('Please add at least one service to this order');
        return;
    }

    // Calculate order total
    state.currentOrder.total = state.currentOrder.services.reduce((sum, s) => sum + s.total, 0);

    // Add or update order in orders array
    if (state.currentOrderIndex >= 0 && state.currentOrderIndex < state.orders.length) {
        state.orders[state.currentOrderIndex] = state.currentOrder;
    } else {
        state.orders.push(state.currentOrder);
    }

    // Also add services to lineItems for backward compatibility
    state.currentOrder.services.forEach(service => {
        state.lineItems.push({
            ...service,
            orderNum: state.currentOrder.orderNum,
            orderDescription: state.currentOrder.displayDescription
        });
    });

    // Reset current order state
    state.currentOrder = null;
    state.currentOrderIndex = -1;

    // Hide services panel
    const panel = document.getElementById('orderServicesPanel');
    if (panel) panel.style.display = 'none';

    // Update orders list
    renderOrdersList();
    updateSummary();

    showToast('Order completed! Add another order or continue to review.');
}

function renderOrdersList() {
    const container = document.getElementById('ordersListContainer');
    if (!container) return;

    if (state.orders.length === 0) {
        container.innerHTML = `
            <div class="empty-orders">
                <p>No orders created yet. Click "Add Order" to start.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = state.orders.map((order, index) => `
        <div class="order-card ${order.selected ? 'selected' : ''}" data-index="${index}">
            <div class="order-card-header">
                <label class="order-select-checkbox">
                    <input type="checkbox" ${order.selected ? 'checked' : ''} onchange="toggleOrderSelection(${index})">
                    <span class="order-num-badge">Order #${order.orderNum}</span>
                </label>
                <span class="order-total">${formatCurrency(order.total)}</span>
            </div>
            <div class="order-card-body">
                <div class="order-jewelry-desc">${order.displayDescription}</div>
                <div class="order-services-count">${order.services.length} service(s)</div>
            </div>
            <div class="order-card-actions">
                <button class="btn btn-ghost btn-sm" onclick="editOrder(${index})">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    Edit
                </button>
                <button class="btn btn-ghost btn-sm" onclick="removeOrder(${index})">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                    Remove
                </button>
            </div>
        </div>
    `).join('');
}

function toggleOrderSelection(index) {
    if (state.orders[index]) {
        state.orders[index].selected = !state.orders[index].selected;
        renderOrdersList();
    }
}

function editOrder(index) {
    if (!state.orders[index]) return;

    // Remove services from lineItems that belong to this order
    const orderNum = state.orders[index].orderNum;
    state.lineItems = state.lineItems.filter(item => item.orderNum !== orderNum);

    // Load order for editing
    state.currentOrder = { ...state.orders[index] };
    state.currentOrderIndex = index;

    openOrderDetailModal();
}

function removeOrder(index) {
    if (!state.orders[index]) return;

    if (!confirm('Remove this order and all its services?')) return;

    // Remove services from lineItems
    const orderNum = state.orders[index].orderNum;
    state.lineItems = state.lineItems.filter(item => item.orderNum !== orderNum);

    // Remove order
    state.orders.splice(index, 1);

    // Renumber remaining orders
    state.orders.forEach((order, i) => {
        order.orderNum = i + 1;
    });

    // Update lineItems order numbers
    state.lineItems.forEach(item => {
        const order = state.orders.find(o => o.id === item.orderId);
        if (order) item.orderNum = order.orderNum;
    });

    renderOrdersList();
    updateSummary();
    showToast('Order removed');
}

function getSelectedOrders() {
    return state.orders.filter(o => o.selected);
}

function selectDocType(type) {
    state.docType = type;
    document.querySelectorAll('.doc-type-card').forEach(el => {
        el.classList.toggle('active', el.dataset.type === type);
    });
    updateDocBadge();
}

function updateDocBadge() {
    const prefix = state.docType === 'estimate' ? 'EST' : 'INV';
    const num = state.docType === 'estimate' ? state.settings.nextEstimateNum : state.settings.nextInvoiceNum;
    const docNumber = `#${prefix}-${String(num).padStart(4, '0')}`;

    document.getElementById('docBadge').textContent = docNumber;
}

function goToCreateStep(step) {
    // Validation
    if (step === 3 && state.createStep === 2) {
        const name = document.getElementById('customerName').value.trim();
        if (!name) {
            showToast('Please enter customer name');
            return;
        }
        state.customer = {
            name: name,
            phone: document.getElementById('customerPhone').value.trim(),
            email: document.getElementById('customerEmail').value.trim()
        };
    }

    if (step === 4) {
        // Check if there's an unfinished order being built
        if (state.currentOrder) {
            showToast('Please finish the current order first (click "Done with Order")');
            return;
        }

        // Check for orders (new workflow) or lineItems (legacy)
        if (state.orders.length === 0 && state.lineItems.length === 0) {
            showToast('Please add at least one order');
            return;
        }
        updatePreview();
    }

    // Update step indicator
    document.querySelectorAll('.step').forEach((el, index) => {
        el.classList.remove('active', 'completed');
        if (index + 1 < step) {
            el.classList.add('completed');
        } else if (index + 1 === step) {
            el.classList.add('active');
        }
    });

    // Show step
    document.querySelectorAll('.create-step').forEach(el => el.classList.remove('active'));
    document.getElementById(`createStep${step}`).classList.add('active');

    state.createStep = step;
}

// ============================================
// Service Category Selection
// ============================================
function selectCategory(category) {
    document.querySelectorAll('.tab').forEach(el => {
        el.classList.toggle('active', el.dataset.category === category);
    });

    document.querySelectorAll('.service-form').forEach(el => el.classList.remove('active'));
    document.getElementById(`form-${category}`).classList.add('active');
}

// ============================================
// Ring Sizing
// ============================================
function handleMetalChange() {
    const metal = document.getElementById('sizingMetal').value;
    document.getElementById('goldOptionsRow').style.display = (metal === '10kt-14kt' || metal === '18kt') ? 'grid' : 'none';
    document.getElementById('silverOptionsRow').style.display = metal === 'silver' ? 'grid' : 'none';
    document.getElementById('platinumOptionsRow').style.display = metal === 'platinum' ? 'grid' : 'none';
}

function addRingSizing() {
    const metal = document.getElementById('sizingMetal').value;
    const width = document.getElementById('sizingWidth').value;
    const service = document.getElementById('sizingService').value;
    const qty = parseInt(document.getElementById('sizingQty').value) || 1;

    let price = getRingSizingPrice(metal, width, service);
    let description = buildRingSizingDescription(metal, width, service);

    addLineItem(description, price, qty);
}

function getRingSizingPrice(metal, width, service) {
    const prices = PRICE_DATA.ringSizing;

    // Map UI service values to price data keys
    const serviceMap = {
        'smaller': 'smaller',
        '1-up': 'oneUp',
        'addt-up': 'addtUp'
    };
    const priceKey = serviceMap[service] || service;

    if (metal === 'silver') {
        const stones = document.getElementById('sizingSilverStones').value;
        const stonesKey = stones === 'with' ? 'with' : 'without';
        // Silver uses width -> stones -> price
        return prices.silver?.[width]?.[stonesKey]?.[priceKey] || 0;
    }

    if (metal === 'platinum') {
        const stones = document.getElementById('sizingPlatinumStones').value;
        const stonesKey = stones === '5-20' ? '5-20' : '0-4';
        return prices.platinum?.[width]?.[stonesKey]?.[priceKey] || 0;
    }

    // Gold (10kt-14kt or 18kt)
    const color = document.getElementById('sizingColor').value;
    const stones = document.getElementById('sizingStones').value;
    const metalKey = metal === '18kt' ? '18kt' : '10kt-14kt';
    const colorKey = color === 'white-rose' ? 'white-rose' : 'yellow';
    const stonesKey = stones === '5-20' ? '5-20' : '0-4';

    return prices[metalKey]?.[width]?.[colorKey]?.[stonesKey]?.[priceKey] || 0;
}

function buildRingSizingDescription(metal, width, service) {
    const metalNames = {
        '10kt-14kt': '10kt/14kt Gold',
        '18kt': '18kt Gold',
        'platinum': 'Platinum',
        'silver': 'Sterling Silver'
    };
    const widthNames = {
        'thin': '<3mm',
        'medium': '3-5mm',
        'wide': '5-8mm'
    };
    const serviceNames = {
        'smaller': 'Size Down (up to 3)',
        '1-up': '1 Size Up',
        'addt-up': 'Each Addt\'l Size Up'
    };

    return `Ring Sizing - ${metalNames[metal]} ${widthNames[width]} - ${serviceNames[service]}`;
}

// ============================================
// Stone Setting
// ============================================
function handleShapeChange() {
    const shape = document.getElementById('stoneShape').value;
    const settingRow = document.getElementById('settingTypeRow');

    // Only round stones have setting type options
    if (shape === 'round') {
        settingRow.querySelector('.form-group:first-child').style.display = 'block';
    } else {
        settingRow.querySelector('.form-group:first-child').style.display = 'none';
    }
}

function addStoneSetting() {
    const shape = document.getElementById('stoneShape').value;
    const carats = document.getElementById('stoneCarats').value;
    const settingType = document.getElementById('settingType').value;
    const qty = parseInt(document.getElementById('stoneQty').value) || 1;

    const price = getStoneSettingPrice(shape, carats, settingType);
    const description = buildStoneSettingDescription(shape, carats, settingType);

    addLineItem(description, price, qty);
}

function getStoneSettingPrice(shape, carats, settingType) {
    if (shape === 'round') {
        const prices = PRICE_DATA.stoneSettingRound;
        return prices?.[carats]?.[settingType] || 0;
    }

    // Other shapes (oval-pear-heart, marquise-emerald, princess)
    const prices = PRICE_DATA.stoneSettingOther;
    return prices?.[carats]?.[shape] || 0;
}

function buildStoneSettingDescription(shape, carats, settingType) {
    const shapeNames = {
        'round': 'Round',
        'oval-pear-heart': 'Oval/Pear/Heart',
        'marquise-emerald': 'Marquise/Emerald',
        'princess': 'Princess'
    };
    const settingNames = {
        'prong': 'Prong',
        'channel': 'Channel/Tiffany',
        'bezel': 'Bezel'
    };

    let desc = `Stone Setting - ${shapeNames[shape]} (${carats} ct)`;
    if (shape === 'round') {
        desc += ` - ${settingNames[settingType]}`;
    }
    return desc;
}

// ============================================
// Tips/Prongs
// ============================================
function addTipProng() {
    const metal = document.getElementById('prongMetal').value;
    const type = document.getElementById('prongType').value;
    const additional = document.getElementById('prongAdditional').value;
    const qty = parseInt(document.getElementById('prongQty').value) || 1;

    const price = getTipProngPrice(metal, type, additional);
    const description = buildTipProngDescription(metal, type, additional);

    addLineItem(description, price, qty);
}

function getTipProngPrice(metal, type, additional) {
    const prices = PRICE_DATA.tipsAndProngs;
    const metalKey = metal === '18kt' ? '18kt' : '14kt-silver';
    // Structure is: prices[metalKey][first/additional][type]
    return prices?.[metalKey]?.[additional]?.[type] || 0;
}

function buildTipProngDescription(metal, type, additional) {
    const metalNames = { '14kt-silver': '14kt/Silver', '18kt': '18kt Gold' };
    const typeNames = { 'tip': 'Tip', 'prong': 'Prong', 'full-prong': 'Full Prong', 'v-prong': 'V Prong' };
    const addNames = { 'first': 'First', 'additional': 'Each Addt\'l' };

    return `${typeNames[type]} (${metalNames[metal]}) - ${addNames[additional]}`;
}

// ============================================
// Chain Services
// ============================================
function addChainService() {
    const service = document.getElementById('chainService').value;
    const qty = parseInt(document.getElementById('chainQty').value) || 1;

    const prices = {
        'solder': 12, 'solder-hollow': 17, 'rivet': 17, 'tube': 17,
        'figure8': 12, 'safety': 12, 'jumpring': 12, 'tighten': 12
    };
    const names = {
        'solder': 'Chain Solder', 'solder-hollow': 'Chain Solder (Hollow)',
        'rivet': 'Chain Rivet', 'tube': 'Chain Tube',
        'figure8': 'Figure 8 (SS)', 'safety': 'Safety Chain (SS)',
        'jumpring': 'Jump Ring + Solder', 'tighten': 'Tighten Clasp'
    };

    addLineItem(names[service], prices[service], qty);
}

// ============================================
// Misc Services
// ============================================
function addMiscService() {
    const service = document.getElementById('miscService').value;
    const qty = parseInt(document.getElementById('miscQty').value) || 1;

    const prices = {
        'clean-polish-rhodium': 25, 'reshape': 17, 'remove-stone': 6,
        'pearl-epoxy': 6, 'sizing-bumps': 35, 'unsolder': 46,
        'unsolder-addt': 23, 'straighten-head': 23, 'pearl-restring': 2,
        'satin-finish': 12, 'black-enamel': 17
    };
    const names = {
        'clean-polish-rhodium': 'Clean/Polish/Rhodium', 'reshape': 'Reshape Ring',
        'remove-stone': 'Remove Stone', 'pearl-epoxy': 'Pearl Post Epoxy',
        'sizing-bumps': 'Sizing Bumps', 'unsolder': 'Unsolder Two Rings',
        'unsolder-addt': 'Unsolder Each Addt\'l', 'straighten-head': 'Straighten Head',
        'pearl-restring': 'Pearl Re-String (per inch)', 'satin-finish': 'Satin Finish',
        'black-enamel': 'Black Enameling'
    };

    addLineItem(names[service], prices[service], qty);
}

// ============================================
// Labor
// ============================================
function updateDefaultRateDisplay() {
    const display = document.getElementById('defaultRateDisplay');
    if (display) {
        display.textContent = state.settings.laborRate;
    }
}

function addLaborCharge() {
    const description = document.getElementById('laborDescription').value.trim() || 'Labor';
    const hours = parseFloat(document.getElementById('laborHours').value) || 1;
    const rate = parseFloat(document.getElementById('laborRateInput').value) || state.settings.laborRate;

    const total = hours * rate;
    addLineItem(`${description} (${hours} hrs @ $${rate}/hr)`, total, 1, true);

    // Clear form
    document.getElementById('laborDescription').value = '';
    document.getElementById('laborHours').value = '1';
    document.getElementById('laborRateInput').value = '';
}

// ============================================
// Materials
// ============================================
function addMaterial() {
    const metal = document.getElementById('materialMetal').value;
    const unit = document.getElementById('materialUnit').value;
    const weight = parseFloat(document.getElementById('materialWeight').value) || 1;
    const includeFee = document.getElementById('materialFee').value === 'yes';
    const description = document.getElementById('materialDescription').value.trim();

    const price = calculateMaterialPrice(metal, unit, weight, includeFee);
    const desc = buildMaterialDescription(metal, unit, weight, includeFee, description);

    addLineItem(desc, price, 1, true);

    // Clear calc display
    document.getElementById('materialCalc').innerHTML = '';
    document.getElementById('materialDescription').value = '';
}

function calculateMaterialPrice(metal, unit, weight, includeFee) {
    const metalPrices = {
        'gold-24k': { base: 'gold', purity: 1.00 },
        'gold-22k': { base: 'gold', purity: 0.916 },
        'gold-18k': { base: 'gold', purity: 0.75 },
        'gold-14k': { base: 'gold', purity: 0.585 },
        'gold-10k': { base: 'gold', purity: 0.417 },
        'silver': { base: 'silver', purity: 0.925 },
        'platinum': { base: 'platinum', purity: 1.00 },
        'palladium': { base: 'palladium', purity: 1.00 }
    };

    const basePrices = {
        'gold': state.settings.goldPrice,
        'silver': state.settings.silverPrice,
        'platinum': state.settings.platinumPrice,
        'palladium': state.settings.palladiumPrice
    };

    // Convert to troy oz
    let ozWeight = weight;
    if (unit === 'dwt') ozWeight = weight / 20;
    if (unit === 'grams') ozWeight = weight / 31.1035;

    const metalInfo = metalPrices[metal];
    let price = basePrices[metalInfo.base] * metalInfo.purity * ozWeight;

    if (includeFee) price *= 1.15;

    return price;
}

function buildMaterialDescription(metal, unit, weight, includeFee, customDesc) {
    const metalNames = {
        'gold-24k': '24k Gold', 'gold-22k': '22k Gold', 'gold-18k': '18k Gold',
        'gold-14k': '14k Gold', 'gold-10k': '10k Gold', 'silver': 'Sterling Silver',
        'platinum': 'Platinum', 'palladium': 'Palladium'
    };
    const unitNames = { 'dwt': 'dwt', 'grams': 'g', 'oz': 'oz' };

    let desc = customDesc || `${metalNames[metal]} - ${weight} ${unitNames[unit]}`;
    if (includeFee) desc += ' (incl. 15% fee)';
    return desc;
}

// ============================================
// Custom Item
// ============================================
function addCustomItem() {
    const description = document.getElementById('customDescription').value.trim();
    const price = parseFloat(document.getElementById('customPrice').value) || 0;
    const qty = parseInt(document.getElementById('customQty').value) || 1;

    if (!description) {
        showToast('Please enter a description');
        return;
    }

    addLineItem(description, price, qty);

    document.getElementById('customDescription').value = '';
    document.getElementById('customPrice').value = '0';
    document.getElementById('customQty').value = '1';
}

// ============================================
// Line Items Management
// ============================================
function addLineItem(description, unitPrice, quantity, isPreCalc = false) {
    const total = isPreCalc ? unitPrice : unitPrice * quantity;
    const finalUnitPrice = isPreCalc ? total : unitPrice;
    const finalQty = isPreCalc ? 1 : quantity;

    // If building an order, add to current order instead
    if (state.currentOrder) {
        addServiceToCurrentOrder(description, finalUnitPrice, finalQty);
        return;
    }

    // Legacy: add directly to lineItems if no order context
    state.lineItems.push({
        id: Date.now(),
        description,
        unitPrice: finalUnitPrice,
        quantity: finalQty,
        total
    });

    updateSummary();
    showToast('Item added');
}

function removeLineItem(id) {
    state.lineItems = state.lineItems.filter(item => item.id !== id);
    updateSummary();
}

function updateSummary() {
    const container = document.getElementById('lineItemsContainer');

    if (state.lineItems.length === 0) {
        container.innerHTML = `
            <div class="empty-items">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
                <p>No items added</p>
                <span>Select a service to begin</span>
            </div>
        `;
    } else {
        container.innerHTML = state.lineItems.map(item => `
            <div class="line-item">
                <div class="line-item-info">
                    <div class="line-item-desc">${item.description}</div>
                    <div class="line-item-qty">${item.quantity > 1 ? `Qty: ${item.quantity} @ ${formatCurrency(item.unitPrice)}` : ''}</div>
                </div>
                <div class="line-item-price">${formatCurrency(item.total)}</div>
                <button class="line-item-remove" onclick="removeLineItem(${item.id})">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                        <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                </button>
            </div>
        `).join('');
    }

    // Calculate totals
    const subtotal = state.lineItems.reduce((sum, item) => sum + item.total, 0);
    const discountPercent = parseFloat(document.getElementById('discountPercent').value) || 0;
    const discountAmount = subtotal * (discountPercent / 100);
    const total = subtotal - discountAmount;

    document.getElementById('subtotalDisplay').textContent = formatCurrency(subtotal);
    document.getElementById('totalDisplay').textContent = formatCurrency(total);

    const discountLine = document.getElementById('discountLine');
    if (discountPercent > 0) {
        discountLine.style.display = 'flex';
        document.getElementById('discountPercentDisplay').textContent = discountPercent;
        document.getElementById('discountAmountDisplay').textContent = `-${formatCurrency(discountAmount)}`;
    } else {
        discountLine.style.display = 'none';
    }
}

// ============================================
// Attachments
// ============================================
function handleAttachmentUpload(e) {
    const files = Array.from(e.target.files);
    files.forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                state.attachments.push(e.target.result);
                renderAttachments();
            };
            reader.readAsDataURL(file);
        }
    });
}

function renderAttachments() {
    const grid = document.getElementById('attachmentGrid');
    grid.innerHTML = state.attachments.map((src, index) => `
        <div class="attachment-item">
            <img src="${src}" alt="Attachment">
            <button onclick="removeAttachment(${index})">×</button>
        </div>
    `).join('');
}

function removeAttachment(index) {
    state.attachments.splice(index, 1);
    renderAttachments();
}

// ============================================
// Preview
// ============================================
function updatePreview() {
    // Company info
    document.getElementById('previewCompanyName').textContent = state.settings.companyName;
    document.getElementById('previewAddress').textContent = state.settings.address;

    let contact = [];
    if (state.settings.phone) contact.push(state.settings.phone);
    if (state.settings.email) contact.push(state.settings.email);
    document.getElementById('previewContact').textContent = contact.join(' | ');

    // Logo
    const logoEl = document.getElementById('previewLogo');
    if (state.settings.logo) {
        logoEl.src = state.settings.logo;
        logoEl.style.display = 'block';
    } else {
        logoEl.style.display = 'none';
    }

    // Document info
    const prefix = state.docType === 'estimate' ? 'EST' : 'INV';
    const num = state.docType === 'estimate' ? state.settings.nextEstimateNum : state.settings.nextInvoiceNum;
    const docNumber = `#${prefix}-${String(num).padStart(4, '0')}`;

    document.getElementById('previewDocType').textContent = state.docType.toUpperCase();
    document.getElementById('previewDocNumber').textContent = docNumber;
    document.getElementById('previewDate').textContent = new Date().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    // Customer
    document.getElementById('previewCustomerName').textContent = state.customer.name;
    let customerContact = [];
    if (state.customer.phone) customerContact.push(state.customer.phone);
    if (state.customer.email) customerContact.push(state.customer.email);
    document.getElementById('previewCustomerContact').textContent = customerContact.join(' | ');

    // Line items
    const tbody = document.getElementById('previewLineItems');
    tbody.innerHTML = state.lineItems.map(item => `
        <tr>
            <td>${item.description}</td>
            <td>${item.quantity}</td>
            <td>${formatCurrency(item.unitPrice)}</td>
            <td>${formatCurrency(item.total)}</td>
        </tr>
    `).join('');

    // Totals
    const subtotal = state.lineItems.reduce((sum, item) => sum + item.total, 0);
    const discountPercent = parseFloat(document.getElementById('discountPercent').value) || 0;
    const discountAmount = subtotal * (discountPercent / 100);
    const total = subtotal - discountAmount;

    document.getElementById('previewSubtotal').textContent = formatCurrency(subtotal);
    document.getElementById('previewTotal').textContent = formatCurrency(total);
    document.getElementById('exportDocType').textContent = state.docType;

    const discountRow = document.getElementById('previewDiscountRow');
    if (discountPercent > 0) {
        discountRow.style.display = 'flex';
        document.getElementById('previewDiscountPercent').textContent = discountPercent;
        document.getElementById('previewDiscountAmount').textContent = `-${formatCurrency(discountAmount)}`;
    } else {
        discountRow.style.display = 'none';
    }

    // Notes
    const notes = document.getElementById('invoiceNotes').value.trim();
    const notesSection = document.getElementById('previewNotesSection');
    if (notes) {
        notesSection.style.display = 'block';
        document.getElementById('previewNotes').textContent = notes;
    } else {
        notesSection.style.display = 'none';
    }

    // Attachments
    const attachmentsSection = document.getElementById('previewAttachmentsSection');
    if (state.attachments.length > 0) {
        attachmentsSection.style.display = 'block';
        document.getElementById('previewAttachments').innerHTML = state.attachments.map(src =>
            `<img src="${src}" alt="Attachment">`
        ).join('');
    } else {
        attachmentsSection.style.display = 'none';
    }

    // Footer
    document.getElementById('previewFooter').textContent = state.settings.footer;
}

// ============================================
// Export
// ============================================
async function exportDocument(format) {
    const element = document.getElementById('invoiceDocument');

    try {
        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff'
        });

        const prefix = state.docType === 'estimate' ? 'EST' : 'INV';
        const num = state.docType === 'estimate' ? state.settings.nextEstimateNum : state.settings.nextInvoiceNum;
        const filename = `${prefix}-${String(num).padStart(4, '0')}`;

        if (format === 'pdf') {
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`${filename}.pdf`);
        } else if (format === 'png') {
            const link = document.createElement('a');
            link.download = `${filename}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } else if (format === 'jpg') {
            const link = document.createElement('a');
            link.download = `${filename}.jpg`;
            link.href = canvas.toDataURL('image/jpeg', 0.95);
            link.click();
        }

        // Save to history
        saveDocument();

    } catch (error) {
        console.error('Export error:', error);
        showToast('Export failed. Please try again.');
    }
}

function saveDocument() {
    // If editing an estimate, save the edit
    if (state.currentEstimateId) {
        const updatedEstimate = saveEstimateEdit(state.currentEstimateId);
        if (updatedEstimate) {
            showSuccessModal('edit');
            return;
        }
    }

    if (state.docType === 'estimate') {
        // Create a new estimate with orders (new workflow)
        const estimate = createEstimateWithOrders();
        showSuccessModal('estimate');
        return;
    }

    // For direct invoices (legacy flow), save to history
    const prefix = 'INV';
    const num = state.settings.nextInvoiceNum;

    const subtotal = state.lineItems.reduce((sum, item) => sum + item.total, 0);
    const discountPercent = parseFloat(document.getElementById('discountPercent').value) || 0;
    const discountAmount = subtotal * (discountPercent / 100);
    const total = subtotal - discountAmount;

    const doc = {
        id: Date.now().toString(),
        type: state.docType,
        number: `${prefix}-${String(num).padStart(4, '0')}`,
        date: new Date().toISOString(),
        customer: { ...state.customer },
        lineItems: [...state.lineItems],
        discountPercent,
        subtotal,
        discountAmount,
        total,
        notes: document.getElementById('invoiceNotes').value.trim()
    };

    state.history.push(doc);
    state.settings.nextInvoiceNum++;

    saveToStorage();
    showSuccessModal('invoice');
}

function showSuccessModal(type = 'document') {
    const modal = document.getElementById('successModal');
    modal.classList.add('active');

    let message = '';
    if (type === 'estimate') {
        message = 'Your estimate has been created. It will be valid for 30 days. View it in the Estimates section.';
    } else if (type === 'edit') {
        message = 'Your estimate has been updated. Changes have been saved to the edit history.';
    } else if (type === 'invoice') {
        message = 'Your invoice has been exported and saved to history.';
    } else {
        message = `Your ${state.docType} has been exported and saved.`;
    }

    document.getElementById('successMessage').textContent = message;
}

function closeSuccessModal() {
    document.getElementById('successModal').classList.remove('active');
    resetCreateForm();
}

function goToDashboard() {
    closeSuccessModal();
    navigateTo('dashboard');
}

// ============================================
// History
// ============================================
function renderHistoryList(filter = 'all', search = '') {
    const container = document.getElementById('documentsList');

    // Combine all document sources
    let docs = [];

    // Add active estimates
    if (state.estimates && state.estimates.length > 0) {
        state.estimates.forEach(est => {
            docs.push({
                id: est.id,
                type: 'estimate',
                number: `EST-${est.number}`,
                customer: est.customer,
                total: est.total,
                date: est.createdAt,
                status: 'pending',
                source: 'estimates'
            });
        });
    }

    // Add active invoices
    if (state.invoices && state.invoices.length > 0) {
        state.invoices.forEach(inv => {
            docs.push({
                id: inv.id,
                type: 'invoice',
                number: `INV-${inv.number}`,
                customer: inv.customer,
                total: inv.total,
                date: inv.createdAt,
                status: inv.status,
                source: 'invoices'
            });
        });
    }

    // Add history (completed/archived documents)
    if (state.history && state.history.length > 0) {
        state.history.forEach(doc => {
            // Avoid duplicates if already in estimates/invoices
            const isDuplicate = docs.some(d => d.id === doc.id);
            if (!isDuplicate) {
                docs.push({
                    ...doc,
                    status: 'completed',
                    source: 'history'
                });
            }
        });
    }

    // Sort by date (newest first)
    docs.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (filter !== 'all') {
        docs = docs.filter(d => d.type === filter);
    }

    if (search) {
        const searchLower = search.toLowerCase();
        docs = docs.filter(d =>
            d.number.toLowerCase().includes(searchLower) ||
            d.customer.name.toLowerCase().includes(searchLower)
        );
    }

    if (docs.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
                <h3>No documents found</h3>
                <p>${filter !== 'all' ? `No ${filter}s yet` : 'Create your first estimate or invoice'}</p>
                <button class="btn btn-primary" onclick="navigateTo('create')">Create Document</button>
            </div>
        `;
        return;
    }

    container.innerHTML = docs.map(doc => {
        const statusBadge = getDocStatusBadge(doc);
        return `
            <div class="doc-row" onclick="viewHistoryDocument('${doc.id}', '${doc.source}')">
                <div class="doc-row-icon ${doc.type}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                        <path d="M14 2v6h6"/>
                    </svg>
                </div>
                <div class="doc-row-info">
                    <div class="doc-row-number">${doc.number}</div>
                    <div class="doc-row-customer">${doc.customer.name}</div>
                </div>
                <div class="doc-row-status">
                    ${statusBadge}
                </div>
                <div class="doc-row-right">
                    <div class="doc-row-amount">${formatCurrency(doc.total)}</div>
                    <div class="doc-row-date">${formatDate(doc.date)}</div>
                </div>
            </div>
        `;
    }).join('');
}

function getDocStatusBadge(doc) {
    if (doc.type === 'estimate') {
        return `<span class="status-badge pending">Pending</span>`;
    }
    if (doc.type === 'invoice') {
        const statusLabels = {
            'active': 'Active',
            'finished': 'Finished',
            'paid': 'Paid',
            'completed': 'Completed'
        };
        const statusClass = doc.status || 'active';
        return `<span class="status-badge ${statusClass}">${statusLabels[statusClass] || statusClass}</span>`;
    }
    return `<span class="status-badge completed">Archived</span>`;
}

function viewHistoryDocument(id, source) {
    if (source === 'estimates') {
        openEstimateDetail(id);
    } else if (source === 'invoices') {
        openInvoiceDetail(id);
    } else {
        viewDocument(id);
    }
}

function filterHistory(filter) {
    document.querySelectorAll('.filter-tab').forEach(el => {
        el.classList.toggle('active', el.dataset.filter === filter);
    });
    renderHistoryList(filter, document.getElementById('historySearch').value);
}

function searchHistory() {
    const search = document.getElementById('historySearch').value;
    const activeFilter = document.querySelector('.filter-tab.active').dataset.filter;
    renderHistoryList(activeFilter, search);
}

function viewDocument(id) {
    const doc = state.history.find(d => d.id === id);
    if (!doc) return;

    // Load document data and show in preview
    state.docType = doc.type;
    state.customer = { ...doc.customer };
    state.lineItems = [...doc.lineItems];

    document.getElementById('discountPercent').value = doc.discountPercent || 0;
    document.getElementById('invoiceNotes').value = doc.notes || '';

    updatePreview();
    navigateTo('create');
    goToCreateStep(4);
}

// ============================================
// Settings
// ============================================
function loadSettingsForm() {
    document.getElementById('settingsCompanyName').value = state.settings.companyName;
    document.getElementById('settingsAddress').value = state.settings.address;
    document.getElementById('settingsPhone').value = state.settings.phone;
    document.getElementById('settingsEmail').value = state.settings.email;
    document.getElementById('settingsWebsite').value = state.settings.website;
    document.getElementById('settingsFooter').value = state.settings.footer;
    document.getElementById('settingsGoldPrice').value = state.settings.goldPrice;
    document.getElementById('settingsSilverPrice').value = state.settings.silverPrice;
    document.getElementById('settingsPlatinumPrice').value = state.settings.platinumPrice;
    document.getElementById('settingsPalladiumPrice').value = state.settings.palladiumPrice;
    document.getElementById('settingsLaborRate').value = state.settings.laborRate;
    document.getElementById('settingsEstimateNum').value = state.settings.nextEstimateNum;
    document.getElementById('settingsInvoiceNum').value = state.settings.nextInvoiceNum;

    const logoPreview = document.getElementById('settingsLogoPreview');
    if (state.settings.logo) {
        logoPreview.innerHTML = `<img src="${state.settings.logo}" alt="Logo">`;
    } else {
        logoPreview.innerHTML = '<span>No logo</span>';
    }
}

function handleSettingsLogoUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            state.settings.logo = e.target.result;
            document.getElementById('settingsLogoPreview').innerHTML = `<img src="${e.target.result}" alt="Logo">`;
        };
        reader.readAsDataURL(file);
    }
}

function removeLogo() {
    state.settings.logo = null;
    document.getElementById('settingsLogoPreview').innerHTML = '<span>No logo</span>';
    document.getElementById('settingsLogoInput').value = '';
}

function saveSettings() {
    state.settings.companyName = document.getElementById('settingsCompanyName').value.trim();
    state.settings.address = document.getElementById('settingsAddress').value.trim();
    state.settings.phone = document.getElementById('settingsPhone').value.trim();
    state.settings.email = document.getElementById('settingsEmail').value.trim();
    state.settings.website = document.getElementById('settingsWebsite').value.trim();
    state.settings.footer = document.getElementById('settingsFooter').value.trim();
    state.settings.goldPrice = parseFloat(document.getElementById('settingsGoldPrice').value) || 4700;
    state.settings.silverPrice = parseFloat(document.getElementById('settingsSilverPrice').value) || 95;
    state.settings.platinumPrice = parseFloat(document.getElementById('settingsPlatinumPrice').value) || 2400;
    state.settings.palladiumPrice = parseFloat(document.getElementById('settingsPalladiumPrice').value) || 1800;
    state.settings.laborRate = parseFloat(document.getElementById('settingsLaborRate').value) || 75;
    state.settings.nextEstimateNum = parseInt(document.getElementById('settingsEstimateNum').value) || 1;
    state.settings.nextInvoiceNum = parseInt(document.getElementById('settingsInvoiceNum').value) || 1;

    saveToStorage();
    updateSidebarBadge();
    updateDashboard();
    showToast('Settings saved');
}

function saveMetalPrices() {
    state.settings.goldPrice = parseFloat(document.getElementById('settingsGoldPrice').value) || 4700;
    state.settings.silverPrice = parseFloat(document.getElementById('settingsSilverPrice').value) || 95;
    state.settings.platinumPrice = parseFloat(document.getElementById('settingsPlatinumPrice').value) || 2400;
    state.settings.palladiumPrice = parseFloat(document.getElementById('settingsPalladiumPrice').value) || 1800;

    saveToStorage();
    updateDashboard();
    highlightPriceFields();
    showToast('Metal prices saved');
}

// ============================================
// Fetch Live Metal Prices
// ============================================
async function fetchLiveMetalPrices() {
    const btn = document.getElementById('fetchPricesBtn');
    const btnText = document.getElementById('fetchPricesBtnText');

    // Show loading state
    btn.disabled = true;
    btnText.textContent = 'Fetching...';

    try {
        let prices = null;
        let source = '';

        // Method 1: Try fetching Kitco via CORS proxy
        try {
            const proxyUrl = 'https://api.allorigins.win/raw?url=';
            const kitcoUrl = encodeURIComponent('https://www.kitco.com/price/precious-metals');
            const response = await fetch(proxyUrl + kitcoUrl, { timeout: 10000 });

            if (response.ok) {
                const html = await response.text();
                prices = parseKitcoPrices(html);
                if (prices && Object.keys(prices).length >= 2) {
                    source = 'Kitco';
                }
            }
        } catch (e) {
            console.log('Kitco proxy fetch error:', e);
        }

        // Method 2: Try alternative CORS proxy
        if (!prices) {
            try {
                const proxyUrl = 'https://corsproxy.io/?';
                const kitcoUrl = encodeURIComponent('https://www.kitco.com/price/precious-metals');
                const response = await fetch(proxyUrl + kitcoUrl);

                if (response.ok) {
                    const html = await response.text();
                    prices = parseKitcoPrices(html);
                    if (prices && Object.keys(prices).length >= 2) {
                        source = 'Kitco';
                    }
                }
            } catch (e) {
                console.log('Alternative proxy error:', e);
            }
        }

        // Method 3: Fallback to recent market prices
        if (!prices || Object.keys(prices).length < 4) {
            prices = {
                gold: 4700,
                silver: 95,
                platinum: 2400,
                palladium: 1800
            };
            source = 'fallback';
            showToast('Using recent market prices (live fetch unavailable)');
        } else {
            showToast(`Prices updated from ${source}!`);
        }

        // Update the form fields
        if (prices.gold) {
            document.getElementById('settingsGoldPrice').value = prices.gold.toFixed(2);
        }
        if (prices.silver) {
            document.getElementById('settingsSilverPrice').value = prices.silver.toFixed(2);
        }
        if (prices.platinum) {
            document.getElementById('settingsPlatinumPrice').value = prices.platinum.toFixed(2);
        }
        if (prices.palladium) {
            document.getElementById('settingsPalladiumPrice').value = prices.palladium.toFixed(2);
        }

        // Highlight updated fields
        highlightPriceFields();

    } catch (error) {
        console.error('Error fetching prices:', error);
        showToast('Could not fetch prices. Please enter manually.');
    } finally {
        // Reset button state
        btn.disabled = false;
        btnText.textContent = 'Fetch Live Prices';
    }
}

// Parse Kitco HTML for metal prices
function parseKitcoPrices(html) {
    try {
        const prices = {};

        // Kitco uses specific patterns for prices
        // Look for bid prices in the format: $X,XXX.XX

        // Gold - look for gold price pattern
        const goldPatterns = [
            /gold[^<]*<[^>]*>[^$]*\$\s*([\d,]+\.?\d*)/i,
            /XAU[^<]*<[^>]*>[^$]*\$\s*([\d,]+\.?\d*)/i,
            /class="[^"]*gold[^"]*"[^>]*>[^$]*\$\s*([\d,]+\.?\d*)/i,
            />Gold<[\s\S]*?\$\s*([\d,]+\.?\d*)/i,
            /gold[\s\S]{0,200}?([\d,]+\.\d{2})/i
        ];

        for (const pattern of goldPatterns) {
            const match = html.match(pattern);
            if (match) {
                const price = parseFloat(match[1].replace(/,/g, ''));
                if (price > 1000 && price < 10000) {
                    prices.gold = price;
                    break;
                }
            }
        }

        // Silver
        const silverPatterns = [
            /silver[^<]*<[^>]*>[^$]*\$\s*([\d,]+\.?\d*)/i,
            /XAG[^<]*<[^>]*>[^$]*\$\s*([\d,]+\.?\d*)/i,
            />Silver<[\s\S]*?\$\s*([\d,]+\.?\d*)/i,
            /silver[\s\S]{0,200}?([\d]+\.\d{2})/i
        ];

        for (const pattern of silverPatterns) {
            const match = html.match(pattern);
            if (match) {
                const price = parseFloat(match[1].replace(/,/g, ''));
                if (price > 10 && price < 500) {
                    prices.silver = price;
                    break;
                }
            }
        }

        // Platinum
        const platinumPatterns = [
            /platinum[^<]*<[^>]*>[^$]*\$\s*([\d,]+\.?\d*)/i,
            /XPT[^<]*<[^>]*>[^$]*\$\s*([\d,]+\.?\d*)/i,
            />Platinum<[\s\S]*?\$\s*([\d,]+\.?\d*)/i,
            /platinum[\s\S]{0,200}?([\d,]+\.\d{2})/i
        ];

        for (const pattern of platinumPatterns) {
            const match = html.match(pattern);
            if (match) {
                const price = parseFloat(match[1].replace(/,/g, ''));
                if (price > 500 && price < 5000) {
                    prices.platinum = price;
                    break;
                }
            }
        }

        // Palladium
        const palladiumPatterns = [
            /palladium[^<]*<[^>]*>[^$]*\$\s*([\d,]+\.?\d*)/i,
            /XPD[^<]*<[^>]*>[^$]*\$\s*([\d,]+\.?\d*)/i,
            />Palladium<[\s\S]*?\$\s*([\d,]+\.?\d*)/i,
            /palladium[\s\S]{0,200}?([\d,]+\.\d{2})/i
        ];

        for (const pattern of palladiumPatterns) {
            const match = html.match(pattern);
            if (match) {
                const price = parseFloat(match[1].replace(/,/g, ''));
                if (price > 500 && price < 5000) {
                    prices.palladium = price;
                    break;
                }
            }
        }

        console.log('Parsed prices:', prices);
        return Object.keys(prices).length > 0 ? prices : null;
    } catch (e) {
        console.log('Parse error:', e);
        return null;
    }
}

function highlightPriceFields() {
    const fields = ['settingsGoldPrice', 'settingsSilverPrice', 'settingsPlatinumPrice', 'settingsPalladiumPrice'];
    fields.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.parentElement.classList.add('price-updated');
            setTimeout(() => {
                input.parentElement.classList.remove('price-updated');
            }, 2000);
        }
    });
}

// ============================================
// Data Management
// ============================================
function exportAllData() {
    const data = {
        settings: state.settings,
        history: state.history,
        exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jewelry-invoice-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data exported');
}

function handleImportData(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (data.settings) state.settings = { ...state.settings, ...data.settings };
            if (data.history) state.history = data.history;
            saveToStorage();
            loadSettingsForm();
            updateSidebarBadge();
            updateDashboard();
            showToast('Data imported successfully');
        } catch (error) {
            showToast('Invalid backup file');
        }
    };
    reader.readAsText(file);
}

function clearAllHistory() {
    if (confirm('Are you sure you want to clear all document history? This cannot be undone.')) {
        state.history = [];
        saveToStorage();
        renderHistoryList();
        updateDashboard();
        showToast('History cleared');
    }
}

// ============================================
// Utilities
// ============================================
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.querySelector('.toast-message').textContent = message;
    toast.classList.add('active');
    setTimeout(() => toast.classList.remove('active'), 3000);
}

// ============================================
// Repair Workflow System
// ============================================

function initRepairsPage() {
    updateRepairStats();
    renderRepairsList();
    renderCalendar();
    initRepairPhotoUpload();
    checkRepairReminders();
}

function updateRepairStats() {
    // Use repair tickets from invoices (primary source), filter out cancelled
    const tickets = (state.repairTickets || []).filter(t => t.status !== 'cancelled');
    const pending = tickets.filter(r => r.status === 'pending').length;
    const inProgress = tickets.filter(r => r.status === 'in-progress').length;
    const completed = tickets.filter(r => r.status === 'completed').length;

    // Map to UI labels (pending = intake, in-progress, completed = delivered equivalent)
    const intakeEl = document.getElementById('repairsIntake');
    const inProgressEl = document.getElementById('repairsInProgress');
    const completedEl = document.getElementById('repairsCompleted');
    const deliveredEl = document.getElementById('repairsDelivered');

    if (intakeEl) intakeEl.textContent = pending;
    if (inProgressEl) inProgressEl.textContent = inProgress;
    if (completedEl) completedEl.textContent = completed;
    if (deliveredEl) deliveredEl.textContent = 0;
}

function renderRepairsList(filter = 'all') {
    const container = document.getElementById('repairsList');
    if (!container) return;

    // Use repair tickets from invoices (these are automatically created when invoices are made)
    // Filter out cancelled tickets
    let tickets = [...(state.repairTickets || [])]
        .filter(t => t.status !== 'cancelled')
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    // Map filter values to ticket status
    const filterMap = {
        'all': 'all',
        'intake': 'pending',
        'in-progress': 'in-progress',
        'completed': 'completed',
        'delivered': 'completed'
    };
    const mappedFilter = filterMap[filter] || filter;

    if (mappedFilter !== 'all') {
        tickets = tickets.filter(r => r.status === mappedFilter);
    }

    if (tickets.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
                </svg>
                <h3>No active repair orders</h3>
                <p>Repair orders are created automatically when invoices are made from accepted estimates.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = tickets.map(ticket => {
        const isOverdue = new Date(ticket.dueDate) < new Date() && ticket.status !== 'completed';
        const daysUntilDue = Math.ceil((new Date(ticket.dueDate) - new Date()) / (1000 * 60 * 60 * 24));

        // Get status label
        const statusLabels = {
            'pending': 'Pending',
            'in-progress': 'In Progress',
            'completed': 'Completed'
        };

        return `
            <div class="repair-card ${ticket.status} ${isOverdue ? 'overdue' : ''}" onclick="viewRepairTicket('${ticket.id}')">
                <div class="repair-card-header">
                    <div class="repair-number">${ticket.orderNumber}</div>
                    <div class="repair-status-badge ${ticket.status}">${statusLabels[ticket.status] || ticket.status}</div>
                </div>
                <div class="repair-card-body">
                    <div class="repair-customer-name">${ticket.customer.name}</div>
                    <div class="repair-item-desc">${ticket.itemDescription}</div>
                    <div class="repair-type-badge">Invoice #${ticket.invoiceNumber}</div>
                </div>
                <div class="repair-card-footer">
                    <div class="repair-due ${isOverdue ? 'overdue' : daysUntilDue <= 2 ? 'soon' : ''}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                            <line x1="16" y1="2" x2="16" y2="6"/>
                            <line x1="8" y1="2" x2="8" y2="6"/>
                            <line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        ${isOverdue ? 'Overdue!' : `Due: ${formatDate(ticket.dueDate)}`}
                    </div>
                    <span class="order-total-badge">${formatCurrency(ticket.pricing.total)}</span>
                </div>
            </div>
        `;
    }).join('');
}

function filterRepairs() {
    const filter = document.getElementById('repairStatusFilter').value;
    renderRepairsList(filter);
}

function getStatusLabel(status) {
    const labels = {
        'intake': 'Intake',
        'in-progress': 'In Progress',
        'completed': 'Completed',
        'delivered': 'Delivered'
    };
    return labels[status] || status;
}

function getRepairTypeLabel(type) {
    const labels = {
        'ring-sizing': 'Ring Sizing',
        'stone-setting': 'Stone Setting',
        'prong-repair': 'Prong Repair',
        'chain-repair': 'Chain Repair',
        'clasp-repair': 'Clasp Repair',
        'polishing': 'Cleaning & Polishing',
        'rhodium': 'Rhodium Plating',
        'engraving': 'Engraving',
        'custom': 'Custom Work',
        'other': 'Other'
    };
    return labels[type] || type;
}

// Calendar Functions
function renderCalendar() {
    const date = state.currentCalendarDate;
    const month = date.getMonth();
    const year = date.getFullYear();

    const calendarMonthEl = document.getElementById('calendarMonth');
    if (calendarMonthEl) {
        calendarMonthEl.textContent = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    let daysHtml = '';

    // Empty cells for days before first of month
    for (let i = 0; i < firstDay; i++) {
        daysHtml += '<div class="calendar-day empty"></div>';
    }

    // Use repair tickets from invoices (exclude cancelled)
    const tickets = (state.repairTickets || []).filter(t => t.status !== 'cancelled');

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(year, month, day);
        const ticketsOnDay = tickets.filter(r => {
            const dueDate = new Date(r.dueDate);
            return dueDate.getDate() === day && dueDate.getMonth() === month && dueDate.getFullYear() === year && r.status !== 'completed';
        });
        const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;

        let dayClass = 'calendar-day';
        if (isToday) dayClass += ' today';

        let indicators = '';
        if (ticketsOnDay.length > 0) {
            const hasOverdue = ticketsOnDay.some(r => new Date(r.dueDate) < today && r.status !== 'completed');
            const hasPending = ticketsOnDay.some(r => r.status === 'pending');
            const hasInProgress = ticketsOnDay.some(r => r.status === 'in-progress');

            if (hasOverdue) {
                indicators += '<span class="day-indicator overdue"></span>';
            } else if (hasPending) {
                indicators += '<span class="day-indicator intake"></span>';
            } else if (hasInProgress) {
                indicators += '<span class="day-indicator in-progress"></span>';
            }

            if (ticketsOnDay.length > 1) {
                indicators += `<span class="day-count">+${ticketsOnDay.length}</span>`;
            }
        }

        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        daysHtml += `
            <div class="${dayClass}" onclick="showDayRepairs('${dateStr}')">
                <span>${day}</span>
                <div class="day-indicators">${indicators}</div>
            </div>
        `;
    }

    const calendarDaysEl = document.getElementById('calendarDays');
    if (calendarDaysEl) {
        calendarDaysEl.innerHTML = daysHtml;
    }
}

function prevMonth() {
    state.currentCalendarDate.setMonth(state.currentCalendarDate.getMonth() - 1);
    renderCalendar();
}

function nextMonth() {
    state.currentCalendarDate.setMonth(state.currentCalendarDate.getMonth() + 1);
    renderCalendar();
}

function showDayRepairs(dateStr) {
    const tickets = state.repairTickets || [];
    const targetDate = new Date(dateStr);
    const ticketsOnDay = tickets.filter(r => {
        const dueDate = new Date(r.dueDate);
        return dueDate.toDateString() === targetDate.toDateString();
    });

    if (ticketsOnDay.length === 1) {
        viewRepairTicket(ticketsOnDay[0].id);
    } else if (ticketsOnDay.length > 1) {
        const filterEl = document.getElementById('repairStatusFilter');
        if (filterEl) filterEl.value = 'all';
        renderRepairsList('all');
        showToast(`${ticketsOnDay.length} repairs due on ${formatDate(dateStr)}`);
    }
}

// New Repair Modal - Repairs are now only created from invoices
function openNewRepairModal() {
    // Repair orders can only be created when invoices are made from accepted estimates
    showToast('Repair orders are created automatically when invoices are made from estimates.');
    navigateTo('estimates');
}

function closeNewRepairModal() {
    document.getElementById('newRepairModal').classList.remove('active');
    state.beforePhotos = [];
}

function initRepairPhotoUpload() {
    const beforeInput = document.getElementById('beforePhotosInput');
    if (beforeInput) {
        beforeInput.addEventListener('change', (e) => handleRepairPhotoUpload(e, 'before'));
    }
}

function handleRepairPhotoUpload(e, type) {
    const files = Array.from(e.target.files);
    files.forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                if (type === 'before') {
                    state.beforePhotos.push(e.target.result);
                    renderBeforePhotos();
                } else {
                    state.afterPhotos.push(e.target.result);
                    renderAfterPhotos();
                }
            };
            reader.readAsDataURL(file);
        }
    });
}

function renderBeforePhotos() {
    const grid = document.getElementById('beforePhotosGrid');
    grid.innerHTML = state.beforePhotos.map((src, index) => `
        <div class="photo-preview-item">
            <img src="${src}" alt="Before photo">
            <button type="button" onclick="removeBeforePhoto(${index})">×</button>
        </div>
    `).join('');
}

function removeBeforePhoto(index) {
    state.beforePhotos.splice(index, 1);
    renderBeforePhotos();
}

function createRepairJob(e) {
    e.preventDefault();

    const repair = {
        id: Date.now().toString(),
        number: `RPR-${String(state.settings.nextRepairNum).padStart(4, '0')}`,
        customer: {
            name: document.getElementById('repairCustomerName').value.trim(),
            phone: document.getElementById('repairCustomerPhone').value.trim(),
            email: document.getElementById('repairCustomerEmail').value.trim()
        },
        notifications: {
            sms: document.getElementById('notifySms').checked,
            email: document.getElementById('notifyEmail').checked
        },
        itemDescription: document.getElementById('repairItemDesc').value.trim(),
        repairType: document.getElementById('repairType').value,
        workDescription: document.getElementById('repairWorkDesc').value.trim(),
        estimatedPrice: parseFloat(document.getElementById('repairEstPrice').value) || 0,
        dueDate: document.getElementById('repairDueDate').value,
        priority: document.getElementById('repairPriority').value,
        status: 'intake',
        beforePhotos: [...state.beforePhotos],
        afterPhotos: [],
        createdAt: new Date().toISOString(),
        statusHistory: [{
            status: 'intake',
            timestamp: new Date().toISOString(),
            note: 'Repair job created'
        }],
        notificationLog: []
    };

    state.repairs.push(repair);
    state.settings.nextRepairNum++;
    saveToStorage();

    closeNewRepairModal();
    updateRepairStats();
    renderRepairsList();
    renderCalendar();

    showToast(`Repair job ${repair.number} created successfully!`);

    // Auto-send intake notification
    if (repair.notifications.sms || repair.notifications.email) {
        autoSendNotification(repair, 'intake');
    }
}

// Repair Detail Modal
function openRepairDetail(repairId) {
    const repair = state.repairs.find(r => r.id === repairId);
    if (!repair) return;

    state.currentRepairId = repairId;
    state.afterPhotos = repair.afterPhotos || [];

    const content = document.getElementById('repairDetailContent');
    const isOverdue = new Date(repair.dueDate) < new Date() && repair.status !== 'delivered' && repair.status !== 'completed';

    content.innerHTML = `
        <div class="repair-detail-header">
            <div class="repair-detail-title">
                <span class="repair-number-large">${repair.number}</span>
                <span class="repair-status-badge ${repair.status}">${getStatusLabel(repair.status)}</span>
                ${repair.priority !== 'normal' ? `<span class="priority-badge ${repair.priority}">${repair.priority.toUpperCase()}</span>` : ''}
                ${isOverdue ? '<span class="overdue-badge">OVERDUE</span>' : ''}
            </div>
            <div class="repair-detail-actions">
                <button class="btn btn-secondary btn-sm" onclick="openNotificationModal('${repair.id}')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                    </svg>
                    Notify Customer
                </button>
                ${repair.status === 'completed' ? `
                    <button class="btn btn-primary btn-sm" onclick="createInvoiceFromRepair('${repair.id}')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                            <path d="M14 2v6h6"/>
                        </svg>
                        Create Invoice
                    </button>
                ` : ''}
            </div>
        </div>

        <div class="repair-detail-grid">
            <div class="repair-detail-section">
                <h3>Customer Information</h3>
                <div class="detail-row">
                    <span class="detail-label">Name</span>
                    <span class="detail-value">${repair.customer.name}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Phone</span>
                    <span class="detail-value">${repair.customer.phone || 'Not provided'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Email</span>
                    <span class="detail-value">${repair.customer.email || 'Not provided'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Notifications</span>
                    <span class="detail-value">
                        ${repair.notifications.sms ? '<span class="notif-badge">SMS</span>' : ''}
                        ${repair.notifications.email ? '<span class="notif-badge">Email</span>' : ''}
                    </span>
                </div>
            </div>

            <div class="repair-detail-section">
                <h3>Repair Details</h3>
                <div class="detail-row">
                    <span class="detail-label">Item</span>
                    <span class="detail-value">${repair.itemDescription}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Type</span>
                    <span class="detail-value">${getRepairTypeLabel(repair.repairType)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Work Description</span>
                    <span class="detail-value">${repair.workDescription || 'Not specified'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Estimated Price</span>
                    <span class="detail-value">${formatCurrency(repair.estimatedPrice)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Due Date</span>
                    <span class="detail-value ${isOverdue ? 'overdue' : ''}">${formatDate(repair.dueDate)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Created</span>
                    <span class="detail-value">${formatDate(repair.createdAt)}</span>
                </div>
            </div>
        </div>

        <div class="repair-status-section">
            <h3>Update Status</h3>
            <div class="status-buttons">
                <button class="status-btn ${repair.status === 'intake' ? 'active' : ''}" onclick="updateRepairStatus('${repair.id}', 'intake')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                        <rect x="9" y="3" width="6" height="4" rx="1"/>
                    </svg>
                    Intake
                </button>
                <span class="status-arrow">→</span>
                <button class="status-btn ${repair.status === 'in-progress' ? 'active' : ''}" onclick="updateRepairStatus('${repair.id}', 'in-progress')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
                    </svg>
                    In Progress
                </button>
                <span class="status-arrow">→</span>
                <button class="status-btn ${repair.status === 'completed' ? 'active' : ''}" onclick="updateRepairStatus('${repair.id}', 'completed')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                        <path d="M22 4L12 14.01l-3-3"/>
                    </svg>
                    Completed
                </button>
                <span class="status-arrow">→</span>
                <button class="status-btn ${repair.status === 'delivered' ? 'active' : ''}" onclick="updateRepairStatus('${repair.id}', 'delivered')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="1" y="3" width="15" height="13"/>
                        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                        <circle cx="5.5" cy="18.5" r="2.5"/>
                        <circle cx="18.5" cy="18.5" r="2.5"/>
                    </svg>
                    Delivered
                </button>
            </div>
        </div>

        <div class="repair-photos-section">
            <div class="photos-column">
                <h3>Before Photos</h3>
                <div class="photos-grid">
                    ${repair.beforePhotos && repair.beforePhotos.length > 0
                        ? repair.beforePhotos.map(src => `<img src="${src}" alt="Before" onclick="viewPhoto('${src}')">`).join('')
                        : '<p class="no-photos">No before photos</p>'
                    }
                </div>
            </div>
            <div class="photos-column">
                <h3>After Photos</h3>
                <div class="photo-upload-area mini" id="afterPhotoArea">
                    <input type="file" id="afterPhotosInput" accept="image/*" multiple hidden>
                    <div class="upload-trigger mini" onclick="document.getElementById('afterPhotosInput').click()">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M12 5v14M5 12h14"/>
                        </svg>
                        <span>Add photos</span>
                    </div>
                </div>
                <div class="photos-grid" id="afterPhotosPreview">
                    ${repair.afterPhotos && repair.afterPhotos.length > 0
                        ? repair.afterPhotos.map((src, i) => `
                            <div class="photo-item">
                                <img src="${src}" alt="After" onclick="viewPhoto('${src}')">
                                <button onclick="removeAfterPhoto(${i})">×</button>
                            </div>
                        `).join('')
                        : '<p class="no-photos">No after photos yet</p>'
                    }
                </div>
            </div>
        </div>

        <div class="repair-history-section">
            <h3>Status History</h3>
            <div class="status-timeline">
                ${repair.statusHistory.map(entry => `
                    <div class="timeline-entry">
                        <div class="timeline-dot ${entry.status}"></div>
                        <div class="timeline-content">
                            <span class="timeline-status">${getStatusLabel(entry.status)}</span>
                            <span class="timeline-time">${formatDateTime(entry.timestamp)}</span>
                            ${entry.note ? `<span class="timeline-note">${entry.note}</span>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>

        ${repair.notificationLog && repair.notificationLog.length > 0 ? `
            <div class="repair-notifications-section">
                <h3>Notification Log</h3>
                <div class="notification-log">
                    ${repair.notificationLog.map(log => `
                        <div class="notification-entry">
                            <span class="notif-type">${log.type.toUpperCase()}</span>
                            <span class="notif-message">${log.message}</span>
                            <span class="notif-time">${formatDateTime(log.timestamp)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}

        <div class="repair-detail-footer">
            <button class="btn btn-danger btn-sm" onclick="deleteRepair('${repair.id}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                </svg>
                Delete Repair
            </button>
        </div>
    `;

    document.getElementById('repairDetailModal').classList.add('active');

    // Setup after photos upload
    setTimeout(() => {
        const afterInput = document.getElementById('afterPhotosInput');
        if (afterInput) {
            afterInput.addEventListener('change', (e) => {
                handleAfterPhotoUpload(e, repair.id);
            });
        }
    }, 100);
}

function closeRepairDetailModal() {
    document.getElementById('repairDetailModal').classList.remove('active');
    state.currentRepairId = null;
}

function handleAfterPhotoUpload(e, repairId) {
    const files = Array.from(e.target.files);
    const repair = state.repairs.find(r => r.id === repairId);
    if (!repair) return;

    files.forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (!repair.afterPhotos) repair.afterPhotos = [];
                repair.afterPhotos.push(event.target.result);
                saveToStorage();
                openRepairDetail(repairId);
            };
            reader.readAsDataURL(file);
        }
    });
}

function removeAfterPhoto(index) {
    const repair = state.repairs.find(r => r.id === state.currentRepairId);
    if (!repair) return;

    repair.afterPhotos.splice(index, 1);
    saveToStorage();
    openRepairDetail(state.currentRepairId);
}

function viewPhoto(src) {
    // Simple photo viewer - opens in new window
    const win = window.open('', '_blank');
    win.document.write(`
        <html>
            <head><title>Photo View</title></head>
            <body style="margin:0;background:#000;display:flex;align-items:center;justify-content:center;min-height:100vh;">
                <img src="${src}" style="max-width:100%;max-height:100vh;">
            </body>
        </html>
    `);
}

function updateRepairStatus(repairId, newStatus) {
    const repair = state.repairs.find(r => r.id === repairId);
    if (!repair || repair.status === newStatus) return;

    const oldStatus = repair.status;
    repair.status = newStatus;
    repair.statusHistory.push({
        status: newStatus,
        timestamp: new Date().toISOString(),
        note: `Status changed from ${getStatusLabel(oldStatus)} to ${getStatusLabel(newStatus)}`
    });

    saveToStorage();
    updateRepairStats();
    renderRepairsList();
    renderCalendar();
    openRepairDetail(repairId);

    showToast(`Repair status updated to ${getStatusLabel(newStatus)}`);

    // Auto-send notification for status change
    if (repair.notifications.sms || repair.notifications.email) {
        autoSendNotification(repair, newStatus);
    }
}

function deleteRepair(repairId) {
    if (!confirm('Are you sure you want to delete this repair job? This cannot be undone.')) return;

    state.repairs = state.repairs.filter(r => r.id !== repairId);
    saveToStorage();

    closeRepairDetailModal();
    updateRepairStats();
    renderRepairsList();
    renderCalendar();

    showToast('Repair job deleted');
}

// Notification System
function openNotificationModal(repairId) {
    document.getElementById('notificationRepairId').value = repairId;
    document.getElementById('notificationModal').classList.add('active');
    loadNotificationTemplate();
}

function closeNotificationModal() {
    document.getElementById('notificationModal').classList.remove('active');
}

function loadNotificationTemplate() {
    const template = document.getElementById('notificationTemplate').value;
    const repairId = document.getElementById('notificationRepairId').value;
    const repair = state.repairs.find(r => r.id === repairId);

    if (!repair) return;

    let message = '';
    const companyName = state.settings.companyName || 'Our jewelry shop';

    switch (template) {
        case 'status-update':
            message = `Hi ${repair.customer.name}, your repair (${repair.number}) is now ${getStatusLabel(repair.status).toLowerCase()}. ${companyName} - ${state.settings.phone || ''}`;
            break;
        case 'ready-pickup':
            message = `Great news, ${repair.customer.name}! Your ${repair.itemDescription} is ready for pickup. Please visit ${companyName} at your convenience. Thank you!`;
            break;
        case 'reminder':
            message = `Hi ${repair.customer.name}, this is a reminder about your repair (${repair.number}) at ${companyName}. Expected completion: ${formatDate(repair.dueDate)}. Questions? Call us at ${state.settings.phone || ''}.`;
            break;
        case 'custom':
            message = '';
            break;
    }

    document.getElementById('notificationMessage').value = message;
}

function sendNotification(e) {
    e.preventDefault();

    const repairId = document.getElementById('notificationRepairId').value;
    const repair = state.repairs.find(r => r.id === repairId);
    if (!repair) return;

    const sendSms = document.getElementById('sendSms').checked;
    const sendEmail = document.getElementById('sendEmail').checked;
    const message = document.getElementById('notificationMessage').value.trim();

    if (!message) {
        showToast('Please enter a message');
        return;
    }

    // Simulate sending notifications (in real app, would call SMS/Email API)
    if (sendSms && repair.customer.phone) {
        repair.notificationLog.push({
            type: 'sms',
            message: message,
            timestamp: new Date().toISOString(),
            to: repair.customer.phone
        });
        showToast(`SMS sent to ${repair.customer.phone}`);
    }

    if (sendEmail && repair.customer.email) {
        repair.notificationLog.push({
            type: 'email',
            message: message,
            timestamp: new Date().toISOString(),
            to: repair.customer.email
        });
        showToast(`Email sent to ${repair.customer.email}`);
    }

    saveToStorage();
    closeNotificationModal();

    if (state.currentRepairId === repairId) {
        openRepairDetail(repairId);
    }
}

function autoSendNotification(repair, status) {
    const companyName = state.settings.companyName || 'Our jewelry shop';
    let message = '';

    switch (status) {
        case 'intake':
            message = `Thank you, ${repair.customer.name}! We've received your ${repair.itemDescription} for repair (${repair.number}). Expected completion: ${formatDate(repair.dueDate)}. - ${companyName}`;
            break;
        case 'in-progress':
            message = `Hi ${repair.customer.name}, work has begun on your repair (${repair.number}). We'll notify you when it's ready! - ${companyName}`;
            break;
        case 'completed':
            message = `Great news, ${repair.customer.name}! Your ${repair.itemDescription} is ready for pickup at ${companyName}. See you soon!`;
            break;
        case 'delivered':
            message = `Thank you for choosing ${companyName}, ${repair.customer.name}! We hope you love your repaired ${repair.itemDescription}. Visit us again!`;
            break;
    }

    if (message) {
        if (repair.notifications.sms && repair.customer.phone) {
            repair.notificationLog.push({
                type: 'sms',
                message: message,
                timestamp: new Date().toISOString(),
                to: repair.customer.phone,
                auto: true
            });
        }

        if (repair.notifications.email && repair.customer.email) {
            repair.notificationLog.push({
                type: 'email',
                message: message,
                timestamp: new Date().toISOString(),
                to: repair.customer.email,
                auto: true
            });
        }

        saveToStorage();
    }
}

// Reminders
function checkRepairReminders() {
    const today = new Date();
    const reminders = [];
    const tickets = (state.repairTickets || []).filter(t => t.status !== 'cancelled');

    tickets.forEach(ticket => {
        if (ticket.status === 'completed') return;

        const dueDate = new Date(ticket.dueDate);
        const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

        if (daysUntilDue < 0) {
            reminders.push({
                type: 'overdue',
                ticket: ticket,
                message: `${ticket.orderNumber} is overdue by ${Math.abs(daysUntilDue)} day(s)!`
            });
        } else if (daysUntilDue <= 2) {
            reminders.push({
                type: 'due-soon',
                ticket: ticket,
                message: `${ticket.orderNumber} is due in ${daysUntilDue} day(s)`
            });
        }
    });

    if (reminders.length > 0) {
        const overdueCount = reminders.filter(r => r.type === 'overdue').length;
        const dueSoonCount = reminders.filter(r => r.type === 'due-soon').length;

        if (overdueCount > 0) {
            showToast(`Warning: ${overdueCount} repair order(s) are overdue!`);
        } else if (dueSoonCount > 0) {
            showToast(`${dueSoonCount} repair(s) due within 2 days`);
        }
    }
}

// Create Invoice from Repair
function createInvoiceFromRepair(repairId) {
    const repair = state.repairs.find(r => r.id === repairId);
    if (!repair) return;

    // Navigate to create page and pre-fill with repair data
    state.docType = 'invoice';
    state.customer = { ...repair.customer };
    state.lineItems = [{
        id: Date.now(),
        description: `Repair: ${repair.itemDescription} - ${getRepairTypeLabel(repair.repairType)}${repair.workDescription ? ` (${repair.workDescription})` : ''}`,
        unitPrice: repair.estimatedPrice,
        quantity: 1,
        total: repair.estimatedPrice
    }];

    // Include after photos as attachments
    if (repair.afterPhotos && repair.afterPhotos.length > 0) {
        state.attachments = [...repair.afterPhotos];
    }

    closeRepairDetailModal();
    navigateTo('create');

    // Go directly to services step
    setTimeout(() => {
        selectDocType('invoice');
        document.getElementById('customerName').value = repair.customer.name;
        document.getElementById('customerPhone').value = repair.customer.phone || '';
        document.getElementById('customerEmail').value = repair.customer.email || '';

        // Update UI
        updateDocBadge();
        updateSummary();

        // Render attachments if any
        if (state.attachments.length > 0) {
            renderAttachments();
        }

        goToCreateStep(3);
    }, 100);

    showToast(`Invoice created from repair ${repair.number}`);
}

// Utility function for datetime formatting
function formatDateTime(dateStr) {
    return new Date(dateStr).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

// ============================================
// ESTIMATES MANAGEMENT SYSTEM
// ============================================

function initEstimatesPage() {
    updateEstimateStats();
    renderEstimatesList();
    checkEstimateReminders();
}

function updateEstimateStats() {
    const total = state.estimates.length;
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    const expiring = state.estimates.filter(e => new Date(e.expiresAt) <= weekFromNow).length;

    const totalEl = document.getElementById('estimatesCount');
    const expiringEl = document.getElementById('estimatesExpiring');

    if (totalEl) totalEl.textContent = total;
    if (expiringEl) expiringEl.textContent = expiring;
}

function renderEstimatesList(filter = 'all') {
    const container = document.getElementById('estimatesList');
    if (!container) return;

    let estimates = [...state.estimates].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (filter === 'expiring') {
        const weekFromNow = new Date();
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        estimates = estimates.filter(e => new Date(e.expiresAt) <= weekFromNow);
    }

    if (estimates.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <h3>No active estimates</h3>
                <p>Create a new estimate to get started</p>
                <button class="btn btn-primary" onclick="navigateTo('create'); selectDocType('estimate');">Create Estimate</button>
            </div>
        `;
        return;
    }

    container.innerHTML = estimates.map(estimate => {
        const daysLeft = Math.ceil((new Date(estimate.expiresAt) - new Date()) / (1000 * 60 * 60 * 24));
        const isExpiringSoon = daysLeft <= 7;
        const editCount = estimate.editHistory ? estimate.editHistory.length : 0;

        return `
            <div class="estimate-card ${isExpiringSoon ? 'expiring-soon' : ''}" onclick="openEstimateDetail('${estimate.id}')">
                <div class="estimate-card-header">
                    <div class="estimate-number">#${estimate.number}</div>
                    <div class="estimate-status-badge pending">Pending</div>
                </div>
                <div class="estimate-card-body">
                    <div class="estimate-customer">${estimate.customer.name}</div>
                    <div class="estimate-items-count">${estimate.orders ? estimate.orders.length : 1} item(s)</div>
                    <div class="estimate-total">${formatCurrency(estimate.total)}</div>
                </div>
                <div class="estimate-card-footer">
                    <div class="estimate-expires ${isExpiringSoon ? 'warning' : ''}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M12 6v6l4 2"/>
                        </svg>
                        ${daysLeft > 0 ? `${daysLeft} days left` : 'Expires today!'}
                    </div>
                    ${editCount > 0 ? `<span class="edit-count">${editCount} edit(s)</span>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function createEstimateWithOrders() {
    // Create estimate from current document state
    const estimateNum = state.settings.nextEstimateNum;
    const estimateNumber = `${String(estimateNum).padStart(5, '0')}`;

    // Use the orders array from order-first workflow, or fallback to legacy lineItems
    let orders;
    if (state.orders.length > 0) {
        // New order-first workflow - use orders array directly
        orders = state.orders.map((order, index) => ({
            ...order,
            id: `${estimateNumber}-${order.orderNum}`,
            estimateNumber: estimateNumber,
            selected: true // For partial acceptance
        }));
    } else {
        // Legacy: create orders from line items
        orders = createOrdersFromLineItems(state.lineItems, estimateNumber);
    }

    const subtotal = orders.reduce((sum, order) => sum + order.total, 0);
    const discountPercent = parseFloat(document.getElementById('discountPercent').value) || 0;
    const discountAmount = subtotal * (discountPercent / 100);
    const total = subtotal - discountAmount;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const estimate = {
        id: Date.now().toString(),
        number: estimateNumber,
        customer: { ...state.customer },
        orders: orders,
        lineItems: [...state.lineItems], // Keep original line items for reference
        discountPercent,
        subtotal,
        discountAmount,
        total,
        notes: document.getElementById('invoiceNotes').value.trim(),
        attachments: [...state.attachments],
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
        lastReminderSent: null,
        editHistory: [],
        status: 'pending'
    };

    state.estimates.push(estimate);
    state.settings.nextEstimateNum++;
    saveToStorage();

    return estimate;
}

function createOrdersFromLineItems(lineItems, estimateNumber) {
    // Legacy: Group line items into orders - each "jewelry piece" description starts a new order
    const orders = lineItems.map((item, index) => {
        const orderNum = index + 1;
        return {
            id: `${estimateNumber}-${orderNum}`,
            orderNum: orderNum,
            displayDescription: item.orderDescription || item.description,
            jewelryDetails: { description: item.orderDescription || item.description },
            services: [item],
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            total: item.total,
            status: 'pending',
            selected: true,
            completedAt: null,
            repairTicketId: null
        };
    });
    return orders;
}

function openEstimateDetail(estimateId) {
    const estimate = state.estimates.find(e => e.id === estimateId);
    if (!estimate) return;

    state.currentEstimateId = estimateId;
    const modal = document.getElementById('estimateDetailModal');
    const content = document.getElementById('estimateDetailContent');

    const daysLeft = Math.ceil((new Date(estimate.expiresAt) - new Date()) / (1000 * 60 * 60 * 24));
    const selectedOrders = estimate.orders ? estimate.orders.filter(o => o.selected !== false) : [];
    const selectedTotal = selectedOrders.reduce((sum, o) => sum + o.total, 0);

    content.innerHTML = `
        <div class="estimate-detail-header">
            <div class="estimate-detail-title">
                <span class="estimate-number-large">Estimate #${estimate.number}</span>
                <span class="estimate-status-badge pending">Pending Acceptance</span>
            </div>
            <div class="estimate-detail-actions">
                <button class="btn btn-secondary btn-sm" onclick="editEstimate('${estimate.id}')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Edit
                </button>
                <button class="btn btn-primary btn-sm" onclick="acceptEstimate('${estimate.id}')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M5 13l4 4L19 7"/>
                    </svg>
                    Accept Selected Orders
                </button>
            </div>
        </div>

        <div class="estimate-info-grid">
            <div class="estimate-info-section">
                <h3>Customer</h3>
                <div class="info-row"><span>Name:</span><span>${estimate.customer.name}</span></div>
                <div class="info-row"><span>Phone:</span><span>${estimate.customer.phone || 'N/A'}</span></div>
                <div class="info-row"><span>Email:</span><span>${estimate.customer.email || 'N/A'}</span></div>
            </div>
            <div class="estimate-info-section">
                <h3>Details</h3>
                <div class="info-row"><span>Created:</span><span>${formatDate(estimate.createdAt)}</span></div>
                <div class="info-row"><span>Expires:</span><span class="${daysLeft <= 7 ? 'warning' : ''}">${formatDate(estimate.expiresAt)} (${daysLeft} days)</span></div>
                <div class="info-row"><span>Full Total:</span><span>${formatCurrency(estimate.total)}</span></div>
                <div class="info-row"><span>Selected Total:</span><span class="total-value" id="selectedOrdersTotal">${formatCurrency(selectedTotal)}</span></div>
            </div>
        </div>

        <div class="estimate-orders-section">
            <h3>Orders - Select for Acceptance (${estimate.orders ? estimate.orders.length : 0})</h3>
            <p class="section-hint">Check the orders you want to accept and convert to an invoice. Unselected orders will remain in the estimate.</p>
            <div class="orders-list">
                ${estimate.orders ? estimate.orders.map((order, index) => `
                    <div class="order-item selectable ${order.selected !== false ? 'selected' : ''}" onclick="toggleEstimateOrderSelection('${estimate.id}', ${index})">
                        <div class="order-header">
                            <label class="order-select-checkbox" onclick="event.stopPropagation()">
                                <input type="checkbox" ${order.selected !== false ? 'checked' : ''} onchange="toggleEstimateOrderSelection('${estimate.id}', ${index})">
                                <span class="order-number">#${estimate.number} (Order #${order.orderNum})</span>
                            </label>
                            <span class="order-total">${formatCurrency(order.total)}</span>
                        </div>
                        <div class="order-description">${order.displayDescription || order.description || 'No description'}</div>
                        ${order.services && order.services.length > 0 ? `
                            <div class="order-services-summary">
                                ${order.services.map(s => `<span class="service-tag">${s.description}</span>`).join('')}
                            </div>
                        ` : ''}
                    </div>
                `).join('') : '<p>No orders</p>'}
            </div>
        </div>

        ${estimate.editHistory && estimate.editHistory.length > 0 ? `
            <div class="estimate-history-section">
                <h3>Edit History</h3>
                <div class="edit-history-list">
                    ${estimate.editHistory.map(edit => `
                        <div class="edit-entry">
                            <span class="edit-time">${formatDateTime(edit.timestamp)}</span>
                            <span class="edit-desc">${edit.description}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}

        <div class="estimate-detail-footer">
            <button class="btn btn-ghost btn-sm" onclick="sendEstimateReminder('${estimate.id}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                </svg>
                Send Reminder
            </button>
            <button class="btn btn-danger btn-sm" onclick="deleteEstimate('${estimate.id}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                </svg>
                Delete Estimate
            </button>
        </div>
    `;

    modal.classList.add('active');
}

function toggleEstimateOrderSelection(estimateId, orderIndex) {
    const estimate = state.estimates.find(e => e.id === estimateId);
    if (!estimate || !estimate.orders[orderIndex]) return;

    estimate.orders[orderIndex].selected = !estimate.orders[orderIndex].selected;
    saveToStorage();

    // Refresh the modal
    openEstimateDetail(estimateId);
}

function closeEstimateDetailModal() {
    document.getElementById('estimateDetailModal').classList.remove('active');
    state.currentEstimateId = null;
}

function editEstimate(estimateId) {
    const estimate = state.estimates.find(e => e.id === estimateId);
    if (!estimate) return;

    // Load estimate into create form for editing
    state.docType = 'estimate';
    state.customer = { ...estimate.customer };
    state.lineItems = [...estimate.lineItems];
    state.attachments = estimate.attachments ? [...estimate.attachments] : [];
    state.currentEstimateId = estimateId;

    closeEstimateDetailModal();
    navigateTo('create');

    setTimeout(() => {
        document.getElementById('customerName').value = estimate.customer.name;
        document.getElementById('customerPhone').value = estimate.customer.phone || '';
        document.getElementById('customerEmail').value = estimate.customer.email || '';
        document.getElementById('discountPercent').value = estimate.discountPercent || 0;
        document.getElementById('invoiceNotes').value = estimate.notes || '';

        updateDocBadge();
        updateSummary();
        if (state.attachments.length > 0) {
            renderAttachments();
        }
        goToCreateStep(3);
    }, 100);
}

function saveEstimateEdit(estimateId) {
    const estimate = state.estimates.find(e => e.id === estimateId);
    if (!estimate) return;

    const subtotal = state.lineItems.reduce((sum, item) => sum + item.total, 0);
    const discountPercent = parseFloat(document.getElementById('discountPercent').value) || 0;
    const discountAmount = subtotal * (discountPercent / 100);
    const total = subtotal - discountAmount;

    // Record edit history
    estimate.editHistory.push({
        timestamp: new Date().toISOString(),
        description: 'Estimate modified',
        previousTotal: estimate.total,
        newTotal: total
    });

    // Update estimate
    estimate.customer = { ...state.customer };
    estimate.lineItems = [...state.lineItems];
    estimate.orders = createOrdersFromLineItems(state.lineItems, estimate.number);
    estimate.discountPercent = discountPercent;
    estimate.subtotal = subtotal;
    estimate.discountAmount = discountAmount;
    estimate.total = total;
    estimate.notes = document.getElementById('invoiceNotes').value.trim();
    estimate.attachments = [...state.attachments];

    saveToStorage();
    state.currentEstimateId = null;
    showToast('Estimate updated successfully');

    return estimate;
}

function acceptEstimate(estimateId) {
    const estimate = state.estimates.find(e => e.id === estimateId);
    if (!estimate) return;

    // Check which orders are selected
    const selectedOrders = estimate.orders ? estimate.orders.filter(o => o.selected !== false) : [];
    const unselectedOrders = estimate.orders ? estimate.orders.filter(o => o.selected === false) : [];

    if (selectedOrders.length === 0) {
        showToast('Please select at least one order to accept');
        return;
    }

    const isPartialAcceptance = unselectedOrders.length > 0;
    const confirmMsg = isPartialAcceptance
        ? `Accept ${selectedOrders.length} of ${estimate.orders.length} orders and convert to invoice? Unselected orders will remain in the estimate.`
        : 'Accept this estimate and convert it to an invoice? The invoice will retain the same order number.';

    if (!confirm(confirmMsg)) {
        return;
    }

    if (isPartialAcceptance) {
        // Partial acceptance: create invoice with selected orders only
        const invoice = createInvoiceFromSelectedOrders(estimate, selectedOrders);

        // Update estimate with remaining orders
        updateEstimateAfterPartialAcceptance(estimate, unselectedOrders);

        showToast(`Invoice #${invoice.number} created with ${selectedOrders.length} order(s). ${unselectedOrders.length} order(s) remain in estimate.`);
    } else {
        // Full acceptance: create invoice from entire estimate
        const invoice = createInvoiceFromEstimate(estimate);

        // Remove estimate from active estimates
        state.estimates = state.estimates.filter(e => e.id !== estimateId);

        showToast(`Invoice #${invoice.number} created from estimate`);
    }

    saveToStorage();
    closeEstimateDetailModal();
    navigateTo('invoices');
}

function createInvoiceFromEstimate(estimate) {
    // Calculate due dates: ready by day 9, ship by day 10
    const createdAt = new Date();
    const readyByDate = new Date(createdAt);
    readyByDate.setDate(readyByDate.getDate() + 9);
    const shipByDate = new Date(createdAt);
    shipByDate.setDate(shipByDate.getDate() + 10);

    // Create repair tickets for each order
    const ordersWithTickets = estimate.orders.map(order => {
        const repairTicket = createRepairTicketForOrder(estimate, order, readyByDate);
        return {
            ...order,
            status: 'pending',
            repairTicketId: repairTicket.id
        };
    });

    const invoice = {
        id: Date.now().toString(),
        number: estimate.number, // Same number as estimate!
        customer: { ...estimate.customer },
        orders: ordersWithTickets,
        lineItems: [...estimate.lineItems],
        discountPercent: estimate.discountPercent,
        subtotal: estimate.subtotal,
        discountAmount: estimate.discountAmount,
        total: estimate.total,
        notes: estimate.notes,
        attachments: estimate.attachments ? [...estimate.attachments] : [],
        createdAt: createdAt.toISOString(),
        acceptedAt: createdAt.toISOString(),
        readyByDate: readyByDate.toISOString(),
        shipByDate: shipByDate.toISOString(),
        status: 'active', // active, finished, paid
        allOrdersComplete: false,
        finishedAt: null,
        paidAt: null,
        editHistory: estimate.editHistory ? [...estimate.editHistory] : []
    };

    state.invoices.push(invoice);
    return invoice;
}

function createInvoiceFromSelectedOrders(estimate, selectedOrders) {
    // Calculate due dates: ready by day 9, ship by day 10
    const createdAt = new Date();
    const readyByDate = new Date(createdAt);
    readyByDate.setDate(readyByDate.getDate() + 9);
    const shipByDate = new Date(createdAt);
    shipByDate.setDate(shipByDate.getDate() + 10);

    // Renumber selected orders starting from 1
    const renumberedOrders = selectedOrders.map((order, index) => {
        const newOrderNum = index + 1;
        const repairTicket = createRepairTicketForOrder(
            { ...estimate, number: estimate.number },
            { ...order, orderNum: newOrderNum },
            readyByDate
        );
        return {
            ...order,
            orderNum: newOrderNum,
            status: 'pending',
            repairTicketId: repairTicket.id
        };
    });

    // Calculate totals for selected orders
    const subtotal = renumberedOrders.reduce((sum, order) => sum + order.total, 0);
    const discountPercent = estimate.discountPercent || 0;
    const discountAmount = subtotal * (discountPercent / 100);
    const total = subtotal - discountAmount;

    // Create line items from selected orders' services
    const lineItems = renumberedOrders.flatMap(order =>
        order.services ? order.services.map(s => ({
            ...s,
            orderNum: order.orderNum
        })) : []
    );

    const invoice = {
        id: Date.now().toString(),
        number: estimate.number,
        customer: { ...estimate.customer },
        orders: renumberedOrders,
        lineItems: lineItems,
        discountPercent: discountPercent,
        subtotal: subtotal,
        discountAmount: discountAmount,
        total: total,
        notes: estimate.notes,
        attachments: estimate.attachments ? [...estimate.attachments] : [],
        createdAt: createdAt.toISOString(),
        acceptedAt: createdAt.toISOString(),
        readyByDate: readyByDate.toISOString(),
        shipByDate: shipByDate.toISOString(),
        status: 'active',
        allOrdersComplete: false,
        finishedAt: null,
        paidAt: null,
        editHistory: estimate.editHistory ? [...estimate.editHistory] : [],
        partialAcceptance: true,
        originalOrderCount: estimate.orders.length,
        acceptedOrderCount: selectedOrders.length
    };

    state.invoices.push(invoice);
    return invoice;
}

function updateEstimateAfterPartialAcceptance(estimate, remainingOrders) {
    // Record the partial acceptance in edit history
    estimate.editHistory = estimate.editHistory || [];
    estimate.editHistory.push({
        timestamp: new Date().toISOString(),
        description: `Partial acceptance: ${estimate.orders.length - remainingOrders.length} order(s) converted to invoice`,
        previousTotal: estimate.total,
        newTotal: remainingOrders.reduce((sum, o) => sum + o.total, 0)
    });

    // Renumber remaining orders starting from 1
    const renumberedOrders = remainingOrders.map((order, index) => ({
        ...order,
        orderNum: index + 1,
        selected: true // Reset selection for remaining orders
    }));

    // Recalculate totals
    const subtotal = renumberedOrders.reduce((sum, order) => sum + order.total, 0);
    const discountPercent = estimate.discountPercent || 0;
    const discountAmount = subtotal * (discountPercent / 100);
    const total = subtotal - discountAmount;

    // Rebuild line items from remaining orders
    const lineItems = renumberedOrders.flatMap(order =>
        order.services ? order.services.map(s => ({
            ...s,
            orderNum: order.orderNum
        })) : []
    );

    // Update estimate
    estimate.orders = renumberedOrders;
    estimate.lineItems = lineItems;
    estimate.subtotal = subtotal;
    estimate.discountAmount = discountAmount;
    estimate.total = total;
}

function createRepairTicketForOrder(estimate, order, readyByDate) {
    const ticket = {
        id: Date.now().toString() + '-' + order.orderNum,
        invoiceNumber: estimate.number,
        orderNumber: `#${estimate.number} (Order #${order.orderNum})`,
        customer: { ...estimate.customer },
        itemDescription: order.displayDescription || order.description || 'Jewelry Item',
        services: order.services,
        pricing: {
            unitPrice: order.unitPrice,
            quantity: order.quantity,
            total: order.total
        },
        status: 'pending', // pending, in-progress, completed
        dueDate: readyByDate.toISOString(),
        createdAt: new Date().toISOString(),
        completedAt: null,
        notes: '',
        beforePhotos: [],
        afterPhotos: []
    };

    state.repairTickets.push(ticket);
    return ticket;
}

function deleteEstimate(estimateId) {
    if (!confirm('Delete this estimate? This cannot be undone.')) return;

    state.estimates = state.estimates.filter(e => e.id !== estimateId);
    saveToStorage();
    closeEstimateDetailModal();
    renderEstimatesList();
    showToast('Estimate deleted');
}

function sendEstimateReminder(estimateId) {
    const estimate = state.estimates.find(e => e.id === estimateId);
    if (!estimate) return;

    const daysLeft = Math.ceil((new Date(estimate.expiresAt) - new Date()) / (1000 * 60 * 60 * 24));

    // Simulate sending reminder
    const message = `Reminder: Your estimate #${estimate.number} for ${formatCurrency(estimate.total)} will expire in ${daysLeft} days. All estimates are cancelled after 30 days. Please contact us to accept or modify.`;

    estimate.lastReminderSent = new Date().toISOString();
    saveToStorage();

    showToast('Reminder sent to customer');
    console.log('Estimate reminder:', message);
}

function cleanupExpiredEstimates() {
    const now = new Date();
    const expiredEstimates = state.estimates.filter(e => new Date(e.expiresAt) < now);

    if (expiredEstimates.length > 0) {
        state.estimates = state.estimates.filter(e => new Date(e.expiresAt) >= now);
        saveToStorage();
        console.log(`Cleaned up ${expiredEstimates.length} expired estimates`);
    }
}

function checkEstimateReminders() {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);

    let remindersDue = 0;

    state.estimates.forEach(estimate => {
        const lastReminder = estimate.lastReminderSent ? new Date(estimate.lastReminderSent) : null;
        const expiresAt = new Date(estimate.expiresAt);
        const daysLeft = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));

        // Send weekly reminder if no reminder sent in last 7 days and estimate is still valid
        if ((!lastReminder || lastReminder < weekAgo) && daysLeft > 0) {
            remindersDue++;
        }
    });

    if (remindersDue > 0) {
        setTimeout(() => {
            showToast(`${remindersDue} estimate(s) due for weekly reminder`);
        }, 2000);
    }
}

// ============================================
// INVOICES MANAGEMENT SYSTEM
// ============================================

function initInvoicesPage() {
    renderInvoicesList();
    updateInvoiceStats();
}

function updateInvoiceStats() {
    const active = state.invoices.filter(i => i.status === 'active').length;
    const finished = state.invoices.filter(i => i.status === 'finished').length;
    const paid = state.invoices.filter(i => i.status === 'paid').length;

    const activeEl = document.getElementById('invoicesActive');
    const finishedEl = document.getElementById('invoicesFinished');
    const paidEl = document.getElementById('invoicesPaid');

    if (activeEl) activeEl.textContent = active;
    if (finishedEl) finishedEl.textContent = finished;
    if (paidEl) paidEl.textContent = paid;
}

function renderInvoicesList(filter = 'all') {
    const container = document.getElementById('invoicesList');
    if (!container) return;

    let invoices = [...state.invoices].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (filter !== 'all') {
        invoices = invoices.filter(i => i.status === filter);
    }

    if (invoices.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                </svg>
                <h3>No invoices</h3>
                <p>Accept an estimate to create an invoice</p>
                <button class="btn btn-primary" onclick="navigateTo('estimates')">View Estimates</button>
            </div>
        `;
        return;
    }

    container.innerHTML = invoices.map(invoice => {
        const completedOrders = invoice.orders.filter(o => o.status === 'completed').length;
        const totalOrders = invoice.orders.length;
        const progress = Math.round((completedOrders / totalOrders) * 100);

        return `
            <div class="invoice-card ${invoice.status}" onclick="openInvoiceDetail('${invoice.id}')">
                <div class="invoice-card-header">
                    <div class="invoice-number">#${invoice.number}</div>
                    <div class="invoice-status-badge ${invoice.status}">${getInvoiceStatusLabel(invoice.status)}</div>
                </div>
                <div class="invoice-card-body">
                    <div class="invoice-customer">${invoice.customer.name}</div>
                    <div class="invoice-orders-info">${completedOrders}/${totalOrders} orders complete</div>
                    <div class="invoice-progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <div class="invoice-total">${formatCurrency(invoice.total)}</div>
                </div>
                <div class="invoice-card-footer">
                    <div class="invoice-dates">
                        <span>Ready by: ${formatDate(invoice.readyByDate)}</span>
                        <span>Ship by: ${formatDate(invoice.shipByDate)}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function filterInvoices() {
    const filter = document.getElementById('invoiceStatusFilter').value;
    renderInvoicesList(filter);
}

function getInvoiceStatusLabel(status) {
    const labels = {
        'active': 'In Progress',
        'finished': 'Ready to Send',
        'paid': 'Paid'
    };
    return labels[status] || status;
}

function openInvoiceDetail(invoiceId) {
    const invoice = state.invoices.find(i => i.id === invoiceId);
    if (!invoice) return;

    state.currentInvoiceId = invoiceId;
    const modal = document.getElementById('invoiceDetailModal');
    const content = document.getElementById('invoiceDetailContent');

    const activeOrders = invoice.orders.filter(o => o.status !== 'cancelled');
    const completedOrders = activeOrders.filter(o => o.status === 'completed').length;
    const allComplete = activeOrders.length > 0 && completedOrders === activeOrders.length;

    content.innerHTML = `
        <div class="invoice-detail-header">
            <div class="invoice-detail-title">
                <span class="invoice-number-large">Invoice #${invoice.number}</span>
                <span class="invoice-status-badge ${invoice.status}">${getInvoiceStatusLabel(invoice.status)}</span>
            </div>
            <div class="invoice-detail-actions">
                ${invoice.status === 'active' && allComplete ? `
                    <button class="btn btn-primary btn-sm" onclick="finishInvoice('${invoice.id}')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 13l4 4L19 7"/></svg>
                        Invoice Finished
                    </button>
                ` : ''}
                ${invoice.status === 'finished' ? `
                    <button class="btn btn-secondary btn-sm" onclick="sendInvoiceToClient('${invoice.id}')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                        Send to Client
                    </button>
                    <button class="btn btn-success btn-sm" onclick="markInvoicePaid('${invoice.id}')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
                        Mark as PAID
                    </button>
                ` : ''}
                ${invoice.status === 'paid' ? `
                    <button class="btn btn-secondary btn-sm" onclick="sendPaidReceipt('${invoice.id}')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                        Send Paid Receipt
                    </button>
                ` : ''}
            </div>
        </div>

        <div class="invoice-info-grid">
            <div class="invoice-info-section">
                <h3>Customer</h3>
                <div class="info-row"><span>Name:</span><span>${invoice.customer.name}</span></div>
                <div class="info-row"><span>Phone:</span><span>${invoice.customer.phone || 'N/A'}</span></div>
                <div class="info-row"><span>Email:</span><span>${invoice.customer.email || 'N/A'}</span></div>
            </div>
            <div class="invoice-info-section">
                <h3>Timeline</h3>
                <div class="info-row"><span>Created:</span><span>${formatDate(invoice.createdAt)}</span></div>
                <div class="info-row"><span>Ready by:</span><span>${formatDate(invoice.readyByDate)}</span></div>
                <div class="info-row"><span>Ship by:</span><span>${formatDate(invoice.shipByDate)}</span></div>
                <div class="info-row"><span>Total:</span><span class="total-value">${formatCurrency(invoice.total)}</span></div>
            </div>
        </div>

        <div class="invoice-orders-section">
            <h3>Orders (${invoice.orders.filter(o => o.status !== 'cancelled').length} active${invoice.orders.filter(o => o.status === 'cancelled').length > 0 ? `, ${invoice.orders.filter(o => o.status === 'cancelled').length} cancelled` : ''})</h3>
            <p class="section-hint">Each order has its own repair ticket. Complete all orders to finalize the invoice.</p>
            <div class="orders-detail-list">
                ${invoice.orders.map(order => `
                    <div class="order-detail-item ${order.status}">
                        <div class="order-detail-header">
                            <div class="order-detail-info">
                                <span class="order-detail-number">#${invoice.number} (Order #${order.orderNum})</span>
                                <span class="order-status-badge ${order.status}">${getOrderStatusLabel(order.status)}</span>
                            </div>
                            <span class="order-detail-total">${order.status === 'cancelled' ? `<s>${formatCurrency(order.total)}</s>` : formatCurrency(order.total)}</span>
                        </div>
                        <div class="order-detail-desc">${order.description || order.displayDescription || 'No description'}</div>
                        ${order.status === 'cancelled' ? `
                            <div class="order-cancelled-info">
                                <span class="cancelled-badge">Cancelled ${order.cancelledAt ? formatDate(order.cancelledAt) : ''}</span>
                            </div>
                        ` : `
                        <div class="order-detail-actions">
                            <button class="btn btn-ghost btn-sm" onclick="viewRepairTicket('${order.repairTicketId}')">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>
                                View Repair Ticket
                            </button>
                            ${order.status !== 'completed' ? `
                                <button class="btn btn-success btn-sm" onclick="markOrderComplete('${invoice.id}', ${order.orderNum})">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 13l4 4L19 7"/></svg>
                                    Complete
                                </button>
                            ` : `
                                <span class="completed-badge">Completed ${order.completedAt ? formatDate(order.completedAt) : ''}</span>
                            `}
                        </div>
                        `}
                    </div>
                `).join('')}
            </div>
        </div>

        ${invoice.editHistory && invoice.editHistory.length > 0 ? `
            <div class="invoice-history-section">
                <h3>History</h3>
                <div class="edit-history-list">
                    ${invoice.editHistory.map(edit => `
                        <div class="edit-entry ${edit.action ? 'action-' + edit.action : ''}">
                            <span class="edit-time">${formatDateTime(edit.timestamp)}</span>
                            ${edit.action ? `<span class="action-badge ${edit.action}">${getActionBadgeLabel(edit.action)}</span>` : ''}
                            <span class="edit-desc">${edit.description}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}
    `;

    modal.classList.add('active');
}

function closeInvoiceDetailModal() {
    document.getElementById('invoiceDetailModal').classList.remove('active');
    state.currentInvoiceId = null;
}

function getOrderStatusLabel(status) {
    const labels = {
        'pending': 'Pending',
        'in-progress': 'In Progress',
        'completed': 'Complete',
        'cancelled': 'Cancelled'
    };
    return labels[status] || status;
}

function getActionBadgeLabel(action) {
    const labels = {
        'order_moved': 'Moved',
        'order_cancelled': 'Cancelled',
        'order_received': 'Received'
    };
    return labels[action] || action;
}

function markOrderComplete(invoiceId, orderNum) {
    const invoice = state.invoices.find(i => i.id === invoiceId);
    if (!invoice) return;

    const order = invoice.orders.find(o => o.orderNum === orderNum);
    if (!order) return;

    order.status = 'completed';
    order.completedAt = new Date().toISOString();

    // Update repair ticket
    const ticket = state.repairTickets.find(t => t.id === order.repairTicketId);
    if (ticket) {
        ticket.status = 'completed';
        ticket.completedAt = new Date().toISOString();
    }

    // Check if all active orders are complete (exclude cancelled)
    const activeOrders = invoice.orders.filter(o => o.status !== 'cancelled');
    const allComplete = activeOrders.length > 0 && activeOrders.every(o => o.status === 'completed');
    invoice.allOrdersComplete = allComplete;

    invoice.editHistory.push({
        timestamp: new Date().toISOString(),
        description: `Order #${orderNum} marked as complete`
    });

    saveToStorage();
    openInvoiceDetail(invoiceId);

    if (allComplete) {
        showToast('All orders complete! You can now finalize the invoice.');
    } else {
        showToast(`Order #${orderNum} marked complete`);
    }
}

function finishInvoice(invoiceId) {
    const invoice = state.invoices.find(i => i.id === invoiceId);
    if (!invoice) return;

    if (!invoice.allOrdersComplete) {
        showToast('Complete all orders before finishing the invoice');
        return;
    }

    invoice.status = 'finished';
    invoice.finishedAt = new Date().toISOString();
    invoice.editHistory.push({
        timestamp: new Date().toISOString(),
        description: 'Invoice marked as finished - ready to send to client'
    });

    saveToStorage();
    openInvoiceDetail(invoiceId);
    updateInvoiceStats();
    showToast('Invoice finished! Ready to send to client.');
}

function sendInvoiceToClient(invoiceId) {
    const invoice = state.invoices.find(i => i.id === invoiceId);
    if (!invoice) return;

    // Simulate sending
    const message = `Invoice #${invoice.number} for ${formatCurrency(invoice.total)} has been sent to ${invoice.customer.email || invoice.customer.phone || 'customer'}.`;

    invoice.editHistory.push({
        timestamp: new Date().toISOString(),
        description: 'Invoice sent to client'
    });

    saveToStorage();
    showToast('Invoice sent to client!');
    console.log(message);
}

function markInvoicePaid(invoiceId) {
    const invoice = state.invoices.find(i => i.id === invoiceId);
    if (!invoice) return;

    if (!confirm('Mark this invoice as PAID?')) return;

    invoice.status = 'paid';
    invoice.paidAt = new Date().toISOString();
    invoice.editHistory.push({
        timestamp: new Date().toISOString(),
        description: 'Invoice marked as PAID'
    });

    // Also save to history for records
    const historyDoc = {
        id: invoice.id,
        type: 'invoice',
        number: `INV-${invoice.number}`,
        date: invoice.paidAt,
        customer: { ...invoice.customer },
        lineItems: [...invoice.lineItems],
        discountPercent: invoice.discountPercent,
        subtotal: invoice.subtotal,
        discountAmount: invoice.discountAmount,
        total: invoice.total,
        notes: invoice.notes,
        status: 'paid'
    };
    state.history.push(historyDoc);

    saveToStorage();
    openInvoiceDetail(invoiceId);
    updateInvoiceStats();
    showToast('Invoice marked as PAID!');
}

function sendPaidReceipt(invoiceId) {
    const invoice = state.invoices.find(i => i.id === invoiceId);
    if (!invoice) return;

    const message = `Paid receipt for Invoice #${invoice.number} (${formatCurrency(invoice.total)}) sent to ${invoice.customer.email || invoice.customer.phone || 'customer'}.`;

    invoice.editHistory.push({
        timestamp: new Date().toISOString(),
        description: 'Paid receipt sent to client'
    });

    saveToStorage();
    showToast('Paid receipt sent!');
    console.log(message);
}

// ============================================
// REPAIR TICKETS SYSTEM
// ============================================

function viewRepairTicket(ticketId) {
    const ticket = state.repairTickets.find(t => t.id === ticketId);
    if (!ticket) {
        showToast('Repair ticket not found');
        return;
    }

    const modal = document.getElementById('repairTicketModal');
    const content = document.getElementById('repairTicketContent');

    const isOverdue = new Date(ticket.dueDate) < new Date() && ticket.status !== 'completed';

    content.innerHTML = `
        <div class="repair-ticket-print" id="repairTicketPrint">
            <div class="ticket-header">
                <div class="ticket-title">
                    <h2>REPAIR TICKET</h2>
                    <span class="ticket-number">${ticket.orderNumber}</span>
                </div>
                <div class="ticket-status ${ticket.status} ${isOverdue ? 'overdue' : ''}">
                    ${ticket.status === 'completed' ? 'COMPLETED' : isOverdue ? 'OVERDUE' : ticket.status.toUpperCase()}
                </div>
            </div>

            <div class="ticket-section">
                <h3>Customer Information</h3>
                <div class="ticket-info">
                    <div class="ticket-row"><strong>Name:</strong> ${ticket.customer.name}</div>
                    <div class="ticket-row"><strong>Phone:</strong> ${ticket.customer.phone || 'N/A'}</div>
                    <div class="ticket-row"><strong>Email:</strong> ${ticket.customer.email || 'N/A'}</div>
                </div>
            </div>

            <div class="ticket-section">
                <h3>Order Details</h3>
                <div class="ticket-info">
                    <div class="ticket-row"><strong>Invoice #:</strong> ${ticket.invoiceNumber}</div>
                    <div class="ticket-row"><strong>Item:</strong> ${ticket.itemDescription}</div>
                    <div class="ticket-row"><strong>Due Date:</strong> ${formatDate(ticket.dueDate)}</div>
                </div>
            </div>

            <div class="ticket-section">
                <h3>Services & Pricing</h3>
                <table class="ticket-services">
                    <thead>
                        <tr>
                            <th>Service</th>
                            <th>Qty</th>
                            <th>Price</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${ticket.services.map(s => `
                            <tr>
                                <td>${s.description}</td>
                                <td>${s.quantity}</td>
                                <td>${formatCurrency(s.unitPrice)}</td>
                                <td>${formatCurrency(s.total)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="3"><strong>Order Total</strong></td>
                            <td><strong>${formatCurrency(ticket.pricing.total)}</strong></td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <div class="ticket-footer">
                <p>Created: ${formatDateTime(ticket.createdAt)}</p>
                ${ticket.completedAt ? `<p>Completed: ${formatDateTime(ticket.completedAt)}</p>` : ''}
            </div>
        </div>

        <div class="ticket-actions">
            <button class="btn btn-secondary" onclick="printRepairTicket()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z"/></svg>
                Print Ticket
            </button>
            ${ticket.status !== 'completed' ? `
                <button class="btn btn-success" onclick="completeRepairTicket('${ticket.id}')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 13l4 4L19 7"/></svg>
                    Mark Complete
                </button>
            ` : ''}
        </div>

        ${ticket.status !== 'completed' ? `
        <div class="ticket-edit-section">
            <h3>Manage Order</h3>
            <div class="ticket-manage-actions">
                <button class="btn btn-primary btn-sm" onclick="editRepairTicketServices('${ticket.id}')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    Edit Services
                </button>
                <button class="btn btn-warning btn-sm" onclick="showMoveRepairOptions('${ticket.id}')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    Move to Invoice
                </button>
                <button class="btn btn-danger btn-sm" onclick="cancelRepairOrder('${ticket.id}')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    Cancel Order
                </button>
            </div>
        </div>

        <div id="moveRepairOptions" class="move-repair-options" style="display: none;">
            <h4>Move to:</h4>
            <div class="move-options-list">
                <button class="btn btn-outline btn-sm" onclick="moveRepairToNewInvoice('${ticket.id}')">
                    Create New Invoice
                </button>
                <div class="existing-invoices-list" id="existingInvoicesList">
                    <!-- Populated dynamically -->
                </div>
            </div>
        </div>
        ` : ''}

        <div id="editServicesPanel" class="edit-services-panel" style="display: none;">
            <h4>Edit Services</h4>
            <div id="editableServicesList"></div>
            <div class="add-service-row">
                <input type="text" id="newServiceDesc" placeholder="Service description">
                <input type="number" id="newServicePrice" placeholder="Price" step="0.01">
                <button class="btn btn-sm btn-primary" onclick="addServiceToRepairTicket('${ticket.id}')">Add</button>
            </div>
            <div class="edit-services-actions">
                <button class="btn btn-ghost btn-sm" onclick="cancelEditServices()">Cancel</button>
                <button class="btn btn-primary btn-sm" onclick="saveRepairTicketServices('${ticket.id}')">Save Changes</button>
            </div>
        </div>
    `;

    modal.classList.add('active');
}

function closeRepairTicketModal() {
    document.getElementById('repairTicketModal').classList.remove('active');
}

function printRepairTicket() {
    const printContent = document.getElementById('repairTicketPrint');
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Repair Ticket</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    .ticket-header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
                    .ticket-title h2 { margin: 0; }
                    .ticket-number { font-size: 1.5rem; font-weight: bold; }
                    .ticket-status { padding: 5px 15px; border: 2px solid; font-weight: bold; }
                    .ticket-section { margin-bottom: 20px; }
                    .ticket-section h3 { border-bottom: 1px solid #ccc; padding-bottom: 5px; }
                    .ticket-row { margin: 5px 0; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
                    th { background: #f0f0f0; }
                    tfoot td { font-weight: bold; background: #f9f9f9; }
                </style>
            </head>
            <body>${printContent.innerHTML}</body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

function completeRepairTicket(ticketId) {
    const ticket = state.repairTickets.find(t => t.id === ticketId);
    if (!ticket) return;

    ticket.status = 'completed';
    ticket.completedAt = new Date().toISOString();

    // Find and update the corresponding order
    for (const invoice of state.invoices) {
        const order = invoice.orders.find(o => o.repairTicketId === ticketId);
        if (order) {
            order.status = 'completed';
            order.completedAt = ticket.completedAt;

            // Check if all orders complete
            invoice.allOrdersComplete = invoice.orders.every(o => o.status === 'completed');

            invoice.editHistory.push({
                timestamp: new Date().toISOString(),
                description: `Repair ticket completed for Order #${order.orderNum}`
            });
            break;
        }
    }

    saveToStorage();
    closeRepairTicketModal();
    showToast('Repair ticket marked complete');

    if (state.currentInvoiceId) {
        openInvoiceDetail(state.currentInvoiceId);
    }
}

// Temporary storage for edited services
let editingServices = [];

function editRepairTicketServices(ticketId) {
    const ticket = state.repairTickets.find(t => t.id === ticketId);
    if (!ticket) return;

    // Copy services for editing
    editingServices = ticket.services.map(s => ({ ...s }));

    const panel = document.getElementById('editServicesPanel');
    panel.style.display = 'block';

    renderEditableServices();
}

function renderEditableServices() {
    const list = document.getElementById('editableServicesList');
    if (!list) return;

    list.innerHTML = editingServices.map((service, index) => `
        <div class="editable-service-item" data-index="${index}">
            <input type="text" value="${service.description}" onchange="updateEditingService(${index}, 'description', this.value)">
            <input type="number" value="${service.unitPrice}" step="0.01" onchange="updateEditingService(${index}, 'unitPrice', parseFloat(this.value))">
            <input type="number" value="${service.quantity}" min="1" onchange="updateEditingService(${index}, 'quantity', parseInt(this.value))">
            <span class="service-total">${formatCurrency(service.total)}</span>
            <button class="btn btn-icon btn-danger btn-xs" onclick="removeEditingService(${index})">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
        </div>
    `).join('');
}

function updateEditingService(index, field, value) {
    if (editingServices[index]) {
        editingServices[index][field] = value;
        editingServices[index].total = editingServices[index].unitPrice * editingServices[index].quantity;
        renderEditableServices();
    }
}

function removeEditingService(index) {
    editingServices.splice(index, 1);
    renderEditableServices();
}

function addServiceToRepairTicket(ticketId) {
    const desc = document.getElementById('newServiceDesc').value.trim();
    const price = parseFloat(document.getElementById('newServicePrice').value) || 0;

    if (!desc) {
        showToast('Please enter a service description');
        return;
    }

    editingServices.push({
        id: Date.now(),
        description: desc,
        unitPrice: price,
        quantity: 1,
        total: price
    });

    document.getElementById('newServiceDesc').value = '';
    document.getElementById('newServicePrice').value = '';

    renderEditableServices();
}

function cancelEditServices() {
    document.getElementById('editServicesPanel').style.display = 'none';
    editingServices = [];
}

function saveRepairTicketServices(ticketId) {
    const ticket = state.repairTickets.find(t => t.id === ticketId);
    if (!ticket) return;

    // Find associated invoice and order
    let invoice = null;
    let order = null;
    for (const inv of state.invoices) {
        const ord = inv.orders.find(o => o.repairTicketId === ticketId);
        if (ord) {
            invoice = inv;
            order = ord;
            break;
        }
    }

    // Calculate old total for history
    const oldTotal = ticket.pricing.total;

    // Update ticket services
    ticket.services = editingServices.map(s => ({ ...s }));
    const newTotal = editingServices.reduce((sum, s) => sum + s.total, 0);
    ticket.pricing.total = newTotal;

    // Update order if found
    if (order) {
        order.services = editingServices.map(s => ({ ...s }));
        order.total = newTotal;

        // Recalculate invoice totals
        if (invoice) {
            const subtotal = invoice.orders.reduce((sum, o) => sum + o.total, 0);
            const discountAmount = subtotal * ((invoice.discountPercent || 0) / 100);
            invoice.subtotal = subtotal;
            invoice.discountAmount = discountAmount;
            invoice.total = subtotal - discountAmount;

            // Record change in history
            invoice.editHistory = invoice.editHistory || [];
            invoice.editHistory.push({
                timestamp: new Date().toISOString(),
                description: `Services edited for Order #${order.orderNum}`,
                previousTotal: oldTotal,
                newTotal: newTotal
            });
        }
    }

    saveToStorage();
    cancelEditServices();
    viewRepairTicket(ticketId);
    showToast('Services updated');
}

function showMoveRepairOptions(ticketId) {
    const panel = document.getElementById('moveRepairOptions');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';

    // Populate existing invoices list
    const ticket = state.repairTickets.find(t => t.id === ticketId);
    const activeInvoices = state.invoices.filter(inv =>
        inv.status === 'active' && inv.number !== ticket.invoiceNumber
    );

    const list = document.getElementById('existingInvoicesList');
    if (activeInvoices.length > 0) {
        list.innerHTML = activeInvoices.map(inv => `
            <button class="btn btn-outline btn-sm" onclick="moveRepairToExistingInvoice('${ticketId}', '${inv.id}')">
                Invoice #${inv.number} - ${inv.customer.name}
            </button>
        `).join('');
    } else {
        list.innerHTML = '<p class="no-invoices">No other active invoices</p>';
    }
}

function moveRepairToNewInvoice(ticketId) {
    const ticket = state.repairTickets.find(t => t.id === ticketId);
    if (!ticket) return;

    if (!confirm('Create a new invoice with this order? The order will be removed from its current invoice.')) {
        return;
    }

    // Find source invoice and order
    let sourceInvoice = null;
    let order = null;
    let orderIndex = -1;

    for (const inv of state.invoices) {
        const idx = inv.orders.findIndex(o => o.repairTicketId === ticketId);
        if (idx >= 0) {
            sourceInvoice = inv;
            order = inv.orders[idx];
            orderIndex = idx;
            break;
        }
    }

    if (!sourceInvoice || !order) {
        showToast('Could not find associated invoice');
        return;
    }

    // Generate new invoice number
    const newNumber = String(state.settings.nextInvoiceNum++).padStart(5, '0');

    // Calculate due dates
    const createdAt = new Date();
    const readyByDate = new Date(createdAt);
    readyByDate.setDate(readyByDate.getDate() + 9);
    const shipByDate = new Date(createdAt);
    shipByDate.setDate(shipByDate.getDate() + 10);

    // Create new invoice
    const newInvoice = {
        id: Date.now().toString(),
        number: newNumber,
        customer: { ...ticket.customer },
        orders: [{
            ...order,
            orderNum: 1
        }],
        lineItems: order.services || [],
        discountPercent: 0,
        subtotal: order.total,
        discountAmount: 0,
        total: order.total,
        notes: `Order moved from Invoice #${sourceInvoice.number}`,
        attachments: [],
        createdAt: createdAt.toISOString(),
        acceptedAt: createdAt.toISOString(),
        readyByDate: readyByDate.toISOString(),
        shipByDate: shipByDate.toISOString(),
        status: 'active',
        allOrdersComplete: false,
        finishedAt: null,
        paidAt: null,
        editHistory: [{
            timestamp: createdAt.toISOString(),
            description: `Created from moved order (originally Invoice #${sourceInvoice.number}, Order #${order.orderNum})`
        }]
    };

    // Update ticket
    ticket.invoiceNumber = newNumber;
    ticket.orderNumber = `#${newNumber} (Order #1)`;

    // Record move in source invoice history
    sourceInvoice.editHistory = sourceInvoice.editHistory || [];
    sourceInvoice.editHistory.push({
        timestamp: createdAt.toISOString(),
        description: `Order #${order.orderNum} moved to new Invoice #${newNumber}`,
        action: 'order_moved',
        movedTo: newNumber
    });

    // Remove order from source invoice
    sourceInvoice.orders.splice(orderIndex, 1);

    // Renumber remaining orders
    sourceInvoice.orders.forEach((o, i) => {
        o.orderNum = i + 1;
    });

    // Recalculate source invoice totals
    const subtotal = sourceInvoice.orders.reduce((sum, o) => sum + o.total, 0);
    const discountAmount = subtotal * ((sourceInvoice.discountPercent || 0) / 100);
    sourceInvoice.subtotal = subtotal;
    sourceInvoice.discountAmount = discountAmount;
    sourceInvoice.total = subtotal - discountAmount;

    // Add new invoice
    state.invoices.push(newInvoice);

    saveToStorage();
    closeRepairTicketModal();
    showToast(`Order moved to new Invoice #${newNumber}`);
    navigateTo('invoices');
}

function moveRepairToExistingInvoice(ticketId, targetInvoiceId) {
    const ticket = state.repairTickets.find(t => t.id === ticketId);
    const targetInvoice = state.invoices.find(i => i.id === targetInvoiceId);
    if (!ticket || !targetInvoice) return;

    if (!confirm(`Move this order to Invoice #${targetInvoice.number} (${targetInvoice.customer.name})?`)) {
        return;
    }

    // Find source invoice and order
    let sourceInvoice = null;
    let order = null;
    let orderIndex = -1;

    for (const inv of state.invoices) {
        const idx = inv.orders.findIndex(o => o.repairTicketId === ticketId);
        if (idx >= 0) {
            sourceInvoice = inv;
            order = inv.orders[idx];
            orderIndex = idx;
            break;
        }
    }

    if (!sourceInvoice || !order) {
        showToast('Could not find associated invoice');
        return;
    }

    const timestamp = new Date().toISOString();
    const originalOrderNum = order.orderNum;

    // Assign new order number in target invoice
    const newOrderNum = targetInvoice.orders.length + 1;

    // Add order to target invoice
    targetInvoice.orders.push({
        ...order,
        orderNum: newOrderNum
    });

    // Update ticket
    ticket.invoiceNumber = targetInvoice.number;
    ticket.orderNumber = `#${targetInvoice.number} (Order #${newOrderNum})`;

    // Record in target invoice history
    targetInvoice.editHistory = targetInvoice.editHistory || [];
    targetInvoice.editHistory.push({
        timestamp: timestamp,
        description: `Order added (moved from Invoice #${sourceInvoice.number}, Order #${originalOrderNum})`,
        action: 'order_received',
        movedFrom: sourceInvoice.number
    });

    // Recalculate target invoice totals
    let subtotal = targetInvoice.orders.reduce((sum, o) => sum + o.total, 0);
    let discountAmount = subtotal * ((targetInvoice.discountPercent || 0) / 100);
    targetInvoice.subtotal = subtotal;
    targetInvoice.discountAmount = discountAmount;
    targetInvoice.total = subtotal - discountAmount;

    // Record move in source invoice history
    sourceInvoice.editHistory = sourceInvoice.editHistory || [];
    sourceInvoice.editHistory.push({
        timestamp: timestamp,
        description: `Order #${originalOrderNum} moved to Invoice #${targetInvoice.number}`,
        action: 'order_moved',
        movedTo: targetInvoice.number
    });

    // Remove order from source invoice
    sourceInvoice.orders.splice(orderIndex, 1);

    // Renumber remaining orders in source
    sourceInvoice.orders.forEach((o, i) => {
        o.orderNum = i + 1;
    });

    // Recalculate source invoice totals
    subtotal = sourceInvoice.orders.reduce((sum, o) => sum + o.total, 0);
    discountAmount = subtotal * ((sourceInvoice.discountPercent || 0) / 100);
    sourceInvoice.subtotal = subtotal;
    sourceInvoice.discountAmount = discountAmount;
    sourceInvoice.total = subtotal - discountAmount;

    saveToStorage();
    closeRepairTicketModal();
    showToast(`Order moved to Invoice #${targetInvoice.number}`);
    navigateTo('invoices');
}

function cancelRepairOrder(ticketId) {
    const ticket = state.repairTickets.find(t => t.id === ticketId);
    if (!ticket) return;

    if (!confirm('Cancel this order? The repair ticket will be removed and the order marked as cancelled in the invoice.')) {
        return;
    }

    // Find associated invoice and order
    let invoice = null;
    let orderIndex = -1;

    for (const inv of state.invoices) {
        const idx = inv.orders.findIndex(o => o.repairTicketId === ticketId);
        if (idx >= 0) {
            invoice = inv;
            orderIndex = idx;
            break;
        }
    }

    const timestamp = new Date().toISOString();

    if (invoice && orderIndex >= 0) {
        const order = invoice.orders[orderIndex];
        const orderNum = order.orderNum;
        const orderTotal = order.total;

        // Mark order as cancelled instead of removing
        order.status = 'cancelled';
        order.cancelledAt = timestamp;

        // Record in invoice history
        invoice.editHistory = invoice.editHistory || [];
        invoice.editHistory.push({
            timestamp: timestamp,
            description: `Order #${orderNum} cancelled (${formatCurrency(orderTotal)} removed from total)`,
            action: 'order_cancelled',
            removedAmount: orderTotal
        });

        // Recalculate invoice totals (exclude cancelled orders)
        const activeOrders = invoice.orders.filter(o => o.status !== 'cancelled');
        const subtotal = activeOrders.reduce((sum, o) => sum + o.total, 0);
        const discountAmount = subtotal * ((invoice.discountPercent || 0) / 100);
        invoice.subtotal = subtotal;
        invoice.discountAmount = discountAmount;
        invoice.total = subtotal - discountAmount;
    }

    // Mark ticket as cancelled
    ticket.status = 'cancelled';
    ticket.cancelledAt = timestamp;

    saveToStorage();
    closeRepairTicketModal();
    showToast('Order cancelled');

    if (state.currentInvoiceId) {
        openInvoiceDetail(state.currentInvoiceId);
    } else {
        renderRepairsList();
    }
}

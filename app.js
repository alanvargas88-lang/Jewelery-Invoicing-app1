// Jewelry Invoice Generator - Main Application
// Alan Vargas Jewelry LLC

// Global state
let state = {
    documentType: 'estimate',
    invoiceNumber: null,
    lineItems: [],
    attachments: [],
    logo: null,
    counters: {
        estimate: 1,
        invoice: 1
    }
};

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Load saved state from localStorage
    loadAppState();

    // Set today's date
    document.getElementById('invoiceDate').valueAsDate = new Date();

    // Initialize event listeners
    initializeEventListeners();

    // Generate initial document number
    generateDocumentNumber();

    // Update preview
    updatePreview();

    // Update invoice history display
    updateHistoryDisplay();
}

function initializeEventListeners() {
    // Document type toggle
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            state.documentType = this.dataset.type;
            generateDocumentNumber();
            updatePreview();
        });
    });

    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            document.getElementById(this.dataset.tab).classList.add('active');
        });
    });

    // Logo upload
    document.getElementById('logoUpload').addEventListener('change', handleLogoUpload);

    // Image attachments
    document.getElementById('imageAttachments').addEventListener('change', handleImageAttachments);

    // Load invoice file input
    document.getElementById('loadInvoiceInput').addEventListener('change', handleLoadInvoice);

    // Company info updates
    ['companyName', 'companyAddress', 'companyPhone', 'companyEmail', 'companyWebsite'].forEach(id => {
        document.getElementById(id).addEventListener('input', updatePreview);
    });

    // Customer info updates
    ['customerName', 'customerEmail', 'customerPhone', 'invoiceDate'].forEach(id => {
        document.getElementById(id).addEventListener('input', updatePreview);
    });

    // Footer message
    document.getElementById('footerMessage').addEventListener('input', updatePreview);

    // Notes
    document.getElementById('invoiceNotes').addEventListener('input', updatePreview);

    // Metal type change for ring sizing (show/hide relevant fields)
    document.getElementById('sizingMetal').addEventListener('change', handleMetalTypeChange);

    // Stone shape change (show/hide setting type for non-round)
    document.getElementById('stoneShape').addEventListener('change', handleStoneShapeChange);
}

// Section collapse toggle
function toggleSection(header) {
    const section = header.parentElement;
    section.classList.toggle('collapsed');
}

// Handle metal type change for ring sizing
function handleMetalTypeChange() {
    const metal = document.getElementById('sizingMetal').value;
    const goldColorGroup = document.getElementById('goldColorGroup');
    const stoneCountGroup = document.getElementById('stoneCountGroup');
    const silverStoneGroup = document.getElementById('silverStoneGroup');

    if (metal === 'silver') {
        goldColorGroup.style.display = 'none';
        stoneCountGroup.style.display = 'none';
        silverStoneGroup.style.display = 'block';
    } else if (metal === 'platinum') {
        goldColorGroup.style.display = 'none';
        stoneCountGroup.style.display = 'block';
        silverStoneGroup.style.display = 'none';
    } else {
        goldColorGroup.style.display = 'block';
        stoneCountGroup.style.display = 'block';
        silverStoneGroup.style.display = 'none';
    }
}

// Handle stone shape change
function handleStoneShapeChange() {
    const shape = document.getElementById('stoneShape').value;
    const settingTypeGroup = document.getElementById('settingTypeGroup');
    settingTypeGroup.style.display = shape === 'round' ? 'block' : 'none';
}

// Generate document number
function generateDocumentNumber() {
    const prefix = state.documentType === 'estimate' ? 'EST' : 'INV';
    const number = state.counters[state.documentType].toString().padStart(4, '0');
    state.invoiceNumber = `${prefix}-${number}`;
    updatePreview();
}

// Logo handling
function handleLogoUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            state.logo = event.target.result;
            updatePreview();
        };
        reader.readAsDataURL(file);
    }
}

function removeLogo() {
    state.logo = null;
    document.getElementById('logoUpload').value = '';
    updatePreview();
}

// Image attachment handling
function handleImageAttachments(e) {
    const files = e.target.files;
    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = function(event) {
            state.attachments.push({
                name: file.name,
                data: event.target.result
            });
            updateAttachmentPreview();
            updatePreview();
        };
        reader.readAsDataURL(file);
    });
    e.target.value = ''; // Reset input
}

function updateAttachmentPreview() {
    const container = document.getElementById('attachmentPreview');
    container.innerHTML = '';

    state.attachments.forEach((attachment, index) => {
        const item = document.createElement('div');
        item.className = 'attachment-item';
        item.innerHTML = `
            <img src="${attachment.data}" alt="${attachment.name}">
            <button class="remove-attachment" onclick="removeAttachment(${index})">×</button>
        `;
        container.appendChild(item);
    });
}

function removeAttachment(index) {
    state.attachments.splice(index, 1);
    updateAttachmentPreview();
    updatePreview();
}

// Add Ring Sizing Service
function addRingSizing() {
    const metal = document.getElementById('sizingMetal').value;
    const width = document.getElementById('sizingWidth').value;
    const service = document.getElementById('sizingService').value;
    const qty = parseInt(document.getElementById('sizingQty').value) || 1;

    let price = 0;
    let description = '';

    const metalName = SERVICE_DESCRIPTIONS.metalNames[metal];
    const widthName = SERVICE_DESCRIPTIONS.widthNames[width];
    const serviceName = SERVICE_DESCRIPTIONS.ringSizing[service];

    if (metal === 'silver') {
        const stones = document.getElementById('sizingSilverStones').value;
        const priceData = PRICE_DATA.ringSizing.silver[width];

        if (!priceData) {
            alert('Silver ring sizing is only available for widths up to 5.0mm');
            return;
        }

        const serviceKey = service === 'smaller' ? 'smaller' : (service === '1-up' ? 'oneUp' : 'addtUp');
        price = priceData[stones][serviceKey];
        description = `Ring Sizing - ${metalName} (${widthName}, ${stones === 'with' ? 'with stones' : 'without stones'}) - ${serviceName}`;
    } else if (metal === 'platinum') {
        const stones = document.getElementById('sizingStones').value;
        const serviceKey = service === 'smaller' ? 'smaller' : (service === '1-up' ? 'oneUp' : 'addtUp');
        price = PRICE_DATA.ringSizing.platinum[width][stones][serviceKey];
        description = `Ring Sizing - ${metalName} (${widthName}, ${stones} stones) - ${serviceName}`;
    } else {
        const color = document.getElementById('sizingColor').value;
        const stones = document.getElementById('sizingStones').value;
        const serviceKey = service === 'smaller' ? 'smaller' : (service === '1-up' ? 'oneUp' : 'addtUp');
        price = PRICE_DATA.ringSizing[metal][width][color][stones][serviceKey];
        const colorName = color === 'yellow' ? 'Yellow' : 'White/Rose';
        description = `Ring Sizing - ${metalName} ${colorName} (${widthName}, ${stones} stones) - ${serviceName}`;
    }

    addLineItem(description, price, qty);
}

// Add Stone Setting Service
function addStoneSetting() {
    const shape = document.getElementById('stoneShape').value;
    const carats = document.getElementById('stoneCarats').value;
    const qty = parseInt(document.getElementById('stoneQty').value) || 1;

    let price = 0;
    let description = '';

    const shapeName = SERVICE_DESCRIPTIONS.stoneShapes[shape];

    if (shape === 'round') {
        const settingType = document.getElementById('settingType').value;
        price = PRICE_DATA.stoneSettingRound[carats][settingType];
        const settingName = SERVICE_DESCRIPTIONS.settingTypes[settingType];
        description = `Stone Setting - ${shapeName} (${carats} ct) - ${settingName}`;
    } else {
        price = PRICE_DATA.stoneSettingOther[carats][shape];
        description = `Stone Setting - ${shapeName} (${carats} ct)`;
    }

    addLineItem(description, price, qty);
}

// Add Tip/Prong Service
function addTipProng() {
    const metal = document.getElementById('prongMetal').value;
    const type = document.getElementById('prongType').value;
    const isAdditional = document.getElementById('prongAdditional').value;
    const qty = parseInt(document.getElementById('prongQty').value) || 1;

    const priceKey = isAdditional === 'first' ? 'first' : 'additional';
    const price = PRICE_DATA.tipsAndProngs[metal][priceKey][type];

    const metalName = metal === '14kt-silver' ? '14kt/Silver' : '18kt';
    const typeName = SERVICE_DESCRIPTIONS.prongTypes[type];
    const addtText = isAdditional === 'additional' ? ' (Each Additional)' : '';

    const description = `${typeName} - ${metalName}${addtText}`;

    addLineItem(description, price, qty);
}

// Add Chain Service
function addChainService() {
    const service = document.getElementById('chainService').value;
    const qty = parseInt(document.getElementById('chainQty').value) || 1;

    const price = PRICE_DATA.chains[service];
    const description = SERVICE_DESCRIPTIONS.chainServices[service];

    addLineItem(description, price, qty);
}

// Add Miscellaneous Service
function addMiscService() {
    const service = document.getElementById('miscService').value;
    const qty = parseInt(document.getElementById('miscQty').value) || 1;

    const price = PRICE_DATA.miscellaneous[service];
    const description = SERVICE_DESCRIPTIONS.miscServices[service];

    addLineItem(description, price, qty);
}

// Add Labor Charge
function addLaborCharge() {
    const description = document.getElementById('laborDescription').value || 'Labor';
    const hours = parseFloat(document.getElementById('laborHours').value) || 1;
    const rateOverride = document.getElementById('laborRateOverride').value;
    const defaultRate = parseFloat(document.getElementById('laborRate').value) || 75;

    const rate = rateOverride ? parseFloat(rateOverride) : defaultRate;
    const totalPrice = rate * hours;

    const desc = `${description} (${hours} hrs @ $${rate.toFixed(2)}/hr)`;

    addLineItem(desc, totalPrice, 1, true); // true = already calculated total

    // Clear inputs
    document.getElementById('laborDescription').value = '';
    document.getElementById('laborRateOverride').value = '';
}

// Add Material Cost
function addMaterial() {
    const metalType = document.getElementById('materialMetal').value;
    const unit = document.getElementById('materialUnit').value;
    const weight = parseFloat(document.getElementById('materialWeight').value) || 0;
    const addFee = document.getElementById('materialFee').value === 'yes';
    const description = document.getElementById('materialDescription').value;

    // Get metal prices
    const goldPrice = parseFloat(document.getElementById('goldPrice').value) || 4000;
    const silverPrice = parseFloat(document.getElementById('silverPrice').value) || 30;
    const platinumPrice = parseFloat(document.getElementById('platinumPrice').value) || 1000;
    const palladiumPrice = parseFloat(document.getElementById('palladiumPrice').value) || 1100;

    // Determine base metal price per oz
    let basePrice = 0;
    if (metalType.startsWith('gold')) {
        basePrice = goldPrice;
    } else if (metalType === 'silver') {
        basePrice = silverPrice;
    } else if (metalType === 'platinum') {
        basePrice = platinumPrice;
    } else if (metalType === 'palladium') {
        basePrice = palladiumPrice;
    }

    // Get purity multiplier
    const purity = PRICE_DATA.metalPurity[metalType];

    // Convert to troy ounces
    const ozConversion = PRICE_DATA.unitConversions[unit];
    const weightInOz = weight * ozConversion;

    // Calculate material cost
    let materialCost = weightInOz * basePrice * purity;

    // Add 15% sourcing fee if applicable
    if (addFee) {
        materialCost *= 1.15;
    }

    const metalName = SERVICE_DESCRIPTIONS.materialMetals[metalType];
    const unitName = unit === 'dwt' ? 'dwt' : (unit === 'grams' ? 'g' : 'oz');
    const feeText = addFee ? ' (incl. 15% sourcing fee)' : '';
    const customDesc = description ? ` - ${description}` : '';

    const desc = `Material: ${metalName} (${weight} ${unitName})${feeText}${customDesc}`;

    // Show calculation result
    document.getElementById('materialCalcResult').innerHTML = `
        <strong>Calculation:</strong><br>
        ${weight} ${unitName} = ${weightInOz.toFixed(4)} oz<br>
        Base price: $${basePrice.toFixed(2)}/oz × ${(purity * 100).toFixed(1)}% purity<br>
        ${addFee ? '+ 15% sourcing fee<br>' : ''}
        <strong>Total: $${materialCost.toFixed(2)}</strong>
    `;

    addLineItem(desc, materialCost, 1, true);

    // Clear description
    document.getElementById('materialDescription').value = '';
}

// Add Custom Item
function addCustomItem() {
    const description = document.getElementById('customDescription').value;
    const price = parseFloat(document.getElementById('customPrice').value) || 0;
    const qty = parseInt(document.getElementById('customQty').value) || 1;

    if (!description) {
        alert('Please enter a description for the custom item');
        return;
    }

    addLineItem(description, price, qty);

    // Clear inputs
    document.getElementById('customDescription').value = '';
    document.getElementById('customPrice').value = '0';
    document.getElementById('customQty').value = '1';
}

// Add line item to invoice
function addLineItem(description, unitPrice, quantity, isPreCalculated = false) {
    const item = {
        id: Date.now(),
        description: description,
        unitPrice: isPreCalculated ? unitPrice : unitPrice,
        quantity: quantity,
        total: isPreCalculated ? unitPrice : unitPrice * quantity
    };

    state.lineItems.push(item);
    updatePreview();
}

// Remove line item
function removeLineItem(id) {
    state.lineItems = state.lineItems.filter(item => item.id !== id);
    updatePreview();
}

// Calculate totals
function calculateTotals() {
    const subtotal = state.lineItems.reduce((sum, item) => sum + item.total, 0);
    const discountPercent = parseFloat(document.getElementById('discountPercent').value) || 0;
    const discountAmount = subtotal * (discountPercent / 100);
    const total = subtotal - discountAmount;

    return {
        subtotal: subtotal,
        discountPercent: discountPercent,
        discountAmount: discountAmount,
        total: total
    };
}

// Update preview
function updatePreview() {
    // Logo
    const logoPreview = document.getElementById('logoPreview');
    if (state.logo) {
        logoPreview.src = state.logo;
        logoPreview.style.display = 'block';
    } else {
        logoPreview.style.display = 'none';
    }

    // Company info
    document.getElementById('companyNamePreview').textContent =
        document.getElementById('companyName').value || 'Your Company Name';

    const address = document.getElementById('companyAddress').value;
    document.getElementById('companyAddressPreview').textContent = address;

    const phone = document.getElementById('companyPhone').value;
    const email = document.getElementById('companyEmail').value;
    const website = document.getElementById('companyWebsite').value;
    let contactInfo = [];
    if (phone) contactInfo.push(phone);
    if (email) contactInfo.push(email);
    if (website) contactInfo.push(website);
    document.getElementById('companyContactPreview').textContent = contactInfo.join(' | ');

    // Document title and number
    document.getElementById('documentTitle').textContent =
        state.documentType === 'estimate' ? 'ESTIMATE' : 'INVOICE';
    document.getElementById('documentNumber').textContent = '#' + state.invoiceNumber;

    // Date
    const dateInput = document.getElementById('invoiceDate').value;
    if (dateInput) {
        const date = new Date(dateInput);
        document.getElementById('documentDate').textContent = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // Customer info
    document.getElementById('customerNamePreview').textContent =
        document.getElementById('customerName').value || 'Customer Name';

    const custPhone = document.getElementById('customerPhone').value;
    const custEmail = document.getElementById('customerEmail').value;
    let custContact = [];
    if (custPhone) custContact.push(custPhone);
    if (custEmail) custContact.push(custEmail);
    document.getElementById('customerContactPreview').textContent = custContact.join(' | ');

    // Line items
    const tbody = document.getElementById('lineItemsBody');
    if (state.lineItems.length === 0) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="4">No items added yet</td></tr>';
    } else {
        tbody.innerHTML = state.lineItems.map(item => `
            <tr>
                <td>
                    ${item.description}
                    <button class="remove-btn" onclick="removeLineItem(${item.id})" title="Remove">×</button>
                </td>
                <td>${item.quantity}</td>
                <td>$${item.unitPrice.toFixed(2)}</td>
                <td>$${item.total.toFixed(2)}</td>
            </tr>
        `).join('');
    }

    // Totals
    const totals = calculateTotals();
    document.getElementById('subtotalPreview').textContent = '$' + totals.subtotal.toFixed(2);

    const discountRow = document.getElementById('discountRow');
    if (totals.discountPercent > 0) {
        discountRow.style.display = 'flex';
        document.getElementById('discountPercentPreview').textContent = totals.discountPercent;
        document.getElementById('discountAmountPreview').textContent = '-$' + totals.discountAmount.toFixed(2);
    } else {
        discountRow.style.display = 'none';
    }

    document.getElementById('totalPreview').textContent = '$' + totals.total.toFixed(2);

    // Notes
    const notes = document.getElementById('invoiceNotes').value;
    const notesSection = document.getElementById('notesSection');
    if (notes) {
        notesSection.style.display = 'block';
        document.getElementById('notesPreview').textContent = notes;
    } else {
        notesSection.style.display = 'none';
    }

    // Attachments
    const attachmentsSection = document.getElementById('attachmentsSection');
    const attachmentsPreview = document.getElementById('attachmentsPreview');
    if (state.attachments.length > 0) {
        attachmentsSection.style.display = 'block';
        attachmentsPreview.innerHTML = state.attachments.map(att =>
            `<img src="${att.data}" alt="${att.name}">`
        ).join('');
    } else {
        attachmentsSection.style.display = 'none';
    }

    // Footer
    document.getElementById('footerPreview').textContent =
        document.getElementById('footerMessage').value || 'Thank you for your business!';
}

// Export as PDF
async function exportPDF() {
    const { jsPDF } = window.jspdf;
    const element = document.getElementById('invoicePreview');

    // Temporarily hide remove buttons
    const removeButtons = element.querySelectorAll('.remove-btn');
    removeButtons.forEach(btn => btn.style.display = 'none');

    try {
        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            logging: false
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'letter');

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        const imgWidth = pageWidth - 20;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, Math.min(imgHeight, pageHeight - 20));

        pdf.save(`${state.invoiceNumber}.pdf`);

        // Save to history
        saveToHistory();
    } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Error generating PDF. Please try again.');
    } finally {
        // Restore remove buttons
        removeButtons.forEach(btn => btn.style.display = '');
    }
}

// Export as Image (PNG or JPG)
async function exportImage(format) {
    const element = document.getElementById('invoicePreview');

    // Temporarily hide remove buttons
    const removeButtons = element.querySelectorAll('.remove-btn');
    removeButtons.forEach(btn => btn.style.display = 'none');

    try {
        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            logging: false
        });

        const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
        const extension = format === 'png' ? 'png' : 'jpg';

        const link = document.createElement('a');
        link.download = `${state.invoiceNumber}.${extension}`;
        link.href = canvas.toDataURL(mimeType, 0.95);
        link.click();

        // Save to history
        saveToHistory();
    } catch (error) {
        console.error('Error generating image:', error);
        alert('Error generating image. Please try again.');
    } finally {
        // Restore remove buttons
        removeButtons.forEach(btn => btn.style.display = '');
    }
}

// Save invoice to file
function saveInvoice() {
    const invoiceData = {
        version: '1.0',
        documentType: state.documentType,
        invoiceNumber: state.invoiceNumber,
        lineItems: state.lineItems,
        attachments: state.attachments,
        logo: state.logo,
        company: {
            name: document.getElementById('companyName').value,
            address: document.getElementById('companyAddress').value,
            phone: document.getElementById('companyPhone').value,
            email: document.getElementById('companyEmail').value,
            website: document.getElementById('companyWebsite').value
        },
        customer: {
            name: document.getElementById('customerName').value,
            email: document.getElementById('customerEmail').value,
            phone: document.getElementById('customerPhone').value
        },
        date: document.getElementById('invoiceDate').value,
        metalPrices: {
            gold: document.getElementById('goldPrice').value,
            silver: document.getElementById('silverPrice').value,
            platinum: document.getElementById('platinumPrice').value,
            palladium: document.getElementById('palladiumPrice').value
        },
        laborRate: document.getElementById('laborRate').value,
        discountPercent: document.getElementById('discountPercent').value,
        footerMessage: document.getElementById('footerMessage').value,
        notes: document.getElementById('invoiceNotes').value,
        totals: calculateTotals()
    };

    const dataStr = JSON.stringify(invoiceData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.download = `${state.invoiceNumber}.json`;
    link.href = url;
    link.click();

    URL.revokeObjectURL(url);

    // Save to history
    saveToHistory();
}

// Load invoice from file
function loadInvoice() {
    document.getElementById('loadInvoiceInput').click();
}

function handleLoadInvoice(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const data = JSON.parse(event.target.result);

            // Restore state
            state.documentType = data.documentType;
            state.invoiceNumber = data.invoiceNumber;
            state.lineItems = data.lineItems || [];
            state.attachments = data.attachments || [];
            state.logo = data.logo;

            // Update toggle buttons
            document.querySelectorAll('.toggle-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.type === data.documentType);
            });

            // Restore company info
            if (data.company) {
                document.getElementById('companyName').value = data.company.name || '';
                document.getElementById('companyAddress').value = data.company.address || '';
                document.getElementById('companyPhone').value = data.company.phone || '';
                document.getElementById('companyEmail').value = data.company.email || '';
                document.getElementById('companyWebsite').value = data.company.website || '';
            }

            // Restore customer info
            if (data.customer) {
                document.getElementById('customerName').value = data.customer.name || '';
                document.getElementById('customerEmail').value = data.customer.email || '';
                document.getElementById('customerPhone').value = data.customer.phone || '';
            }

            // Restore other fields
            if (data.date) document.getElementById('invoiceDate').value = data.date;

            if (data.metalPrices) {
                document.getElementById('goldPrice').value = data.metalPrices.gold || 4000;
                document.getElementById('silverPrice').value = data.metalPrices.silver || 30;
                document.getElementById('platinumPrice').value = data.metalPrices.platinum || 1000;
                document.getElementById('palladiumPrice').value = data.metalPrices.palladium || 1100;
            }

            if (data.laborRate) document.getElementById('laborRate').value = data.laborRate;
            if (data.discountPercent) document.getElementById('discountPercent').value = data.discountPercent;
            if (data.footerMessage) document.getElementById('footerMessage').value = data.footerMessage;
            if (data.notes) document.getElementById('invoiceNotes').value = data.notes;

            // Update attachment preview
            updateAttachmentPreview();

            // Update main preview
            updatePreview();

            alert('Invoice loaded successfully!');
        } catch (error) {
            console.error('Error loading invoice:', error);
            alert('Error loading invoice file. Please make sure it\'s a valid invoice file.');
        }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
}

// Clear all
function clearAll() {
    if (!confirm('Are you sure you want to clear all items and start fresh?')) return;

    state.lineItems = [];
    state.attachments = [];

    // Increment counter for new document
    state.counters[state.documentType]++;
    generateDocumentNumber();

    // Clear customer fields
    document.getElementById('customerName').value = '';
    document.getElementById('customerEmail').value = '';
    document.getElementById('customerPhone').value = '';
    document.getElementById('invoiceNotes').value = '';
    document.getElementById('discountPercent').value = '0';
    document.getElementById('invoiceDate').valueAsDate = new Date();

    // Clear attachment preview
    document.getElementById('attachmentPreview').innerHTML = '';
    document.getElementById('materialCalcResult').innerHTML = '';

    updatePreview();
    saveAppState();
}

// Save app state to localStorage
function saveAppState() {
    const appState = {
        counters: state.counters,
        company: {
            name: document.getElementById('companyName').value,
            address: document.getElementById('companyAddress').value,
            phone: document.getElementById('companyPhone').value,
            email: document.getElementById('companyEmail').value,
            website: document.getElementById('companyWebsite').value
        },
        logo: state.logo,
        metalPrices: {
            gold: document.getElementById('goldPrice').value,
            silver: document.getElementById('silverPrice').value,
            platinum: document.getElementById('platinumPrice').value,
            palladium: document.getElementById('palladiumPrice').value
        },
        laborRate: document.getElementById('laborRate').value,
        footerMessage: document.getElementById('footerMessage').value,
        history: getHistory()
    };

    localStorage.setItem('jewelryInvoiceApp', JSON.stringify(appState));
}

// Load app state from localStorage
function loadAppState() {
    const saved = localStorage.getItem('jewelryInvoiceApp');
    if (!saved) return;

    try {
        const appState = JSON.parse(saved);

        // Restore counters
        if (appState.counters) {
            state.counters = appState.counters;
        }

        // Restore company info
        if (appState.company) {
            document.getElementById('companyName').value = appState.company.name || 'Alan Vargas Jewelry LLC';
            document.getElementById('companyAddress').value = appState.company.address || '';
            document.getElementById('companyPhone').value = appState.company.phone || '';
            document.getElementById('companyEmail').value = appState.company.email || '';
            document.getElementById('companyWebsite').value = appState.company.website || 'https://alanvjewelry.com';
        }

        // Restore logo
        if (appState.logo) {
            state.logo = appState.logo;
        }

        // Restore metal prices
        if (appState.metalPrices) {
            document.getElementById('goldPrice').value = appState.metalPrices.gold || 4000;
            document.getElementById('silverPrice').value = appState.metalPrices.silver || 30;
            document.getElementById('platinumPrice').value = appState.metalPrices.platinum || 1000;
            document.getElementById('palladiumPrice').value = appState.metalPrices.palladium || 1100;
        }

        // Restore labor rate
        if (appState.laborRate) {
            document.getElementById('laborRate').value = appState.laborRate;
        }

        // Restore footer message
        if (appState.footerMessage) {
            document.getElementById('footerMessage').value = appState.footerMessage;
        }
    } catch (error) {
        console.error('Error loading app state:', error);
    }
}

// Invoice history management
function getHistory() {
    const saved = localStorage.getItem('jewelryInvoiceHistory');
    return saved ? JSON.parse(saved) : [];
}

function saveToHistory() {
    const history = getHistory();
    const totals = calculateTotals();

    // Check if this invoice already exists
    const existingIndex = history.findIndex(h => h.number === state.invoiceNumber);

    const historyItem = {
        number: state.invoiceNumber,
        type: state.documentType,
        customer: document.getElementById('customerName').value || 'Unknown',
        date: document.getElementById('invoiceDate').value,
        total: totals.total,
        savedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
        history[existingIndex] = historyItem;
    } else {
        history.unshift(historyItem);
        // Increment counter for next document
        state.counters[state.documentType]++;
    }

    // Keep only last 50 items
    if (history.length > 50) {
        history.pop();
    }

    localStorage.setItem('jewelryInvoiceHistory', JSON.stringify(history));
    saveAppState();
    updateHistoryDisplay();
}

function updateHistoryDisplay() {
    const history = getHistory();
    const container = document.getElementById('invoiceHistory');

    if (history.length === 0) {
        container.innerHTML = '<p style="color: #999; font-size: 0.85rem;">No invoices saved yet.</p>';
        return;
    }

    container.innerHTML = history.slice(0, 20).map(item => `
        <div class="history-item">
            <div class="history-info">
                <span class="history-number">${item.number}</span>
                <span class="history-date">${item.customer} - ${new Date(item.date).toLocaleDateString()}</span>
            </div>
            <span class="history-total">$${item.total.toFixed(2)}</span>
        </div>
    `).join('');
}

// Initialize metal type change handler
handleMetalTypeChange();
handleStoneShapeChange();

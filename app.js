// ============================================
// Jewelry Invoice Pro - Application Logic
// ============================================

// Global State
const state = {
    isSetupComplete: false,
    documentType: 'estimate',
    currentDocNumber: null,
    lineItems: [],
    attachments: [],
    company: {
        name: '',
        address: '',
        phone: '',
        email: '',
        website: '',
        logo: null,
        footer: 'Thank you for your business! Please allow 10 days for repairs and 4 weeks for custom jobs.'
    },
    settings: {
        goldPrice: 4000,
        silverPrice: 30,
        platinumPrice: 1000,
        palladiumPrice: 1100,
        laborRate: 75,
        nextEstimate: 1,
        nextInvoice: 1
    }
};

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    loadState();
    initEventListeners();

    if (state.isSetupComplete) {
        showScreen('mainScreen');
        initMainScreen();
    } else {
        showScreen('setupScreen');
    }
});

function loadState() {
    const saved = localStorage.getItem('jewelryInvoicePro');
    if (saved) {
        const data = JSON.parse(saved);
        Object.assign(state, data);
        state.lineItems = [];
        state.attachments = [];
    }
}

function saveState() {
    const toSave = {
        isSetupComplete: state.isSetupComplete,
        company: state.company,
        settings: state.settings
    };
    localStorage.setItem('jewelryInvoicePro', JSON.stringify(toSave));
}

// ============================================
// SCREEN MANAGEMENT
// ============================================
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    document.getElementById(screenId).style.display = 'block';

    if (screenId === 'settingsScreen') {
        populateSettings();
    } else if (screenId === 'mainScreen') {
        initMainScreen();
    }
}

// ============================================
// SETUP WIZARD
// ============================================
function nextSetupStep(step) {
    // Update progress
    document.querySelectorAll('.progress-step').forEach((el, i) => {
        el.classList.remove('active', 'completed');
        if (i + 1 < step) el.classList.add('completed');
        if (i + 1 === step) el.classList.add('active');
    });

    // Show step
    document.querySelectorAll('.setup-step').forEach(s => s.classList.remove('active'));
    document.getElementById(`setupStep${step}`).classList.add('active');
}

function prevSetupStep(step) {
    nextSetupStep(step);
}

function completeSetup() {
    // Gather setup data
    const name = document.getElementById('setupCompanyName').value.trim();
    if (!name) {
        alert('Please enter your business name');
        nextSetupStep(1);
        return;
    }

    const address1 = document.getElementById('setupAddress1').value.trim();
    const city = document.getElementById('setupCity').value.trim();
    const stateVal = document.getElementById('setupState').value.trim();
    const zip = document.getElementById('setupZip').value.trim();

    let fullAddress = address1;
    if (city || stateVal || zip) {
        fullAddress += fullAddress ? '\n' : '';
        fullAddress += [city, stateVal, zip].filter(Boolean).join(', ');
    }

    state.company.name = name;
    state.company.address = fullAddress;
    state.company.phone = document.getElementById('setupPhone').value.trim();
    state.company.email = document.getElementById('setupEmail').value.trim();
    state.company.website = document.getElementById('setupWebsite').value.trim();
    state.company.footer = document.getElementById('setupFooter').value.trim();

    state.isSetupComplete = true;
    saveState();

    showScreen('mainScreen');
}

// Setup Logo Upload
document.getElementById('logoUploadArea')?.addEventListener('click', () => {
    document.getElementById('setupLogo').click();
});

document.getElementById('setupLogo')?.addEventListener('change', (e) => {
    handleLogoUpload(e, 'setup');
});

function handleLogoUpload(e, context) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        state.company.logo = event.target.result;

        if (context === 'setup') {
            document.getElementById('uploadPlaceholder').style.display = 'none';
            document.getElementById('logoPreviewContainer').style.display = 'block';
            document.getElementById('setupLogoPreview').src = event.target.result;
        } else {
            updateSettingsLogoPreview();
        }
        saveState();
    };
    reader.readAsDataURL(file);
}

function removeSetupLogo() {
    state.company.logo = null;
    document.getElementById('uploadPlaceholder').style.display = 'block';
    document.getElementById('logoPreviewContainer').style.display = 'none';
    document.getElementById('setupLogo').value = '';
    saveState();
}

// ============================================
// MAIN SCREEN
// ============================================
function initMainScreen() {
    generateDocNumber();
    updateSummary();
    document.getElementById('defaultRateDisplay').textContent = state.settings.laborRate;
}

function initEventListeners() {
    // Attachment drop zone
    const dropZone = document.getElementById('attachmentDrop');
    if (dropZone) {
        dropZone.addEventListener('click', () => {
            document.getElementById('attachmentInput').click();
        });

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = 'var(--primary)';
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.style.borderColor = '';
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = '';
            handleAttachmentFiles(e.dataTransfer.files);
        });
    }

    document.getElementById('attachmentInput')?.addEventListener('change', (e) => {
        handleAttachmentFiles(e.target.files);
        e.target.value = '';
    });

    // Settings logo
    document.getElementById('settingsLogoInput')?.addEventListener('change', (e) => {
        handleLogoUpload(e, 'settings');
    });

    // Import data
    document.getElementById('importDataInput')?.addEventListener('change', handleImportData);
}

// Document Type
function selectDocType(type) {
    state.documentType = type;
    document.querySelectorAll('.doc-type-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type === type);
    });
    generateDocNumber();
}

function generateDocNumber() {
    const prefix = state.documentType === 'estimate' ? 'EST' : 'INV';
    const num = state.documentType === 'estimate' ? state.settings.nextEstimate : state.settings.nextInvoice;
    state.currentDocNumber = `${prefix}-${num.toString().padStart(4, '0')}`;
    document.getElementById('docNumberDisplay').textContent = '#' + state.currentDocNumber;
}

// Category Selection
function selectCategory(category) {
    document.querySelectorAll('.pill').forEach(p => {
        p.classList.toggle('active', p.dataset.category === category);
    });
    document.querySelectorAll('.service-form').forEach(f => {
        f.classList.toggle('active', f.id === `form-${category}`);
    });
}

// Metal type change handler
function handleMetalChange() {
    const metal = document.getElementById('sizingMetal').value;
    document.getElementById('goldOptionsRow').style.display =
        (metal === '10kt-14kt' || metal === '18kt') ? 'grid' : 'none';
    document.getElementById('silverOptionsRow').style.display =
        metal === 'silver' ? 'grid' : 'none';
    document.getElementById('platinumOptionsRow').style.display =
        metal === 'platinum' ? 'grid' : 'none';
}

// Stone shape change handler
function handleShapeChange() {
    const shape = document.getElementById('stoneShape').value;
    document.getElementById('settingTypeRow').style.display =
        shape === 'round' ? 'grid' : 'none';
}

// ============================================
// ADD SERVICES
// ============================================
function addRingSizing() {
    const metal = document.getElementById('sizingMetal').value;
    const width = document.getElementById('sizingWidth').value;
    const service = document.getElementById('sizingService').value;
    const qty = parseInt(document.getElementById('sizingQty').value) || 1;

    let price = 0;
    let desc = '';

    const metalNames = { '10kt-14kt': '10kt/14kt', '18kt': '18kt', 'platinum': 'Platinum', 'silver': 'Silver' };
    const widthNames = { thin: '<3mm', medium: '3-5mm', wide: '5-8mm' };
    const serviceNames = { smaller: 'Size Down', '1-up': '1 Size Up', 'addt-up': 'Addt\'l Size Up' };

    try {
        if (metal === 'silver') {
            const stones = document.getElementById('sizingSilverStones').value;
            const priceData = PRICE_DATA.ringSizing.silver[width];
            if (!priceData) throw new Error('Invalid width for silver');
            const key = service === 'smaller' ? 'smaller' : (service === '1-up' ? 'oneUp' : 'addtUp');
            price = priceData[stones][key];
            desc = `Ring Sizing - ${metalNames[metal]} (${widthNames[width]}, ${stones} stones) - ${serviceNames[service]}`;
        } else if (metal === 'platinum') {
            const stones = document.getElementById('sizingPlatinumStones').value;
            const key = service === 'smaller' ? 'smaller' : (service === '1-up' ? 'oneUp' : 'addtUp');
            price = PRICE_DATA.ringSizing.platinum[width][stones][key];
            desc = `Ring Sizing - ${metalNames[metal]} (${widthNames[width]}, ${stones} stones) - ${serviceNames[service]}`;
        } else {
            const color = document.getElementById('sizingColor').value;
            const stones = document.getElementById('sizingStones').value;
            const key = service === 'smaller' ? 'smaller' : (service === '1-up' ? 'oneUp' : 'addtUp');
            price = PRICE_DATA.ringSizing[metal][width][color][stones][key];
            const colorName = color === 'yellow' ? 'Yellow' : 'White/Rose';
            desc = `Ring Sizing - ${metalNames[metal]} ${colorName} (${widthNames[width]}, ${stones} stones) - ${serviceNames[service]}`;
        }
    } catch (e) {
        alert('Invalid combination selected');
        return;
    }

    addLineItem(desc, price, qty);
}

function addStoneSetting() {
    const shape = document.getElementById('stoneShape').value;
    const carats = document.getElementById('stoneCarats').value;
    const qty = parseInt(document.getElementById('stoneQty').value) || 1;

    let price = 0;
    const shapeNames = { round: 'Round', 'oval-pear-heart': 'Oval/Pear/Heart', 'marquise-emerald': 'Marquise/Emerald', princess: 'Princess' };

    if (shape === 'round') {
        const setting = document.getElementById('settingType').value;
        price = PRICE_DATA.stoneSettingRound[carats][setting];
        const settingNames = { prong: 'Prong', channel: 'Channel/Tiffany', bezel: 'Bezel' };
        addLineItem(`Stone Setting - ${shapeNames[shape]} (${carats}ct) - ${settingNames[setting]}`, price, qty);
    } else {
        price = PRICE_DATA.stoneSettingOther[carats][shape];
        addLineItem(`Stone Setting - ${shapeNames[shape]} (${carats}ct)`, price, qty);
    }
}

function addTipProng() {
    const metal = document.getElementById('prongMetal').value;
    const type = document.getElementById('prongType').value;
    const isAddt = document.getElementById('prongAdditional').value;
    const qty = parseInt(document.getElementById('prongQty').value) || 1;

    const priceKey = isAddt === 'first' ? 'first' : 'additional';
    const price = PRICE_DATA.tipsAndProngs[metal][priceKey][type];

    const metalName = metal === '14kt-silver' ? '14kt/Silver' : '18kt';
    const typeNames = { tip: 'Tip', prong: 'Prong', 'full-prong': 'Full Prong', 'v-prong': 'V Prong' };
    const addtText = isAddt === 'additional' ? ' (ea. addt\'l)' : '';

    addLineItem(`${typeNames[type]} - ${metalName}${addtText}`, price, qty);
}

function addChainService() {
    const service = document.getElementById('chainService').value;
    const qty = parseInt(document.getElementById('chainQty').value) || 1;

    const price = PRICE_DATA.chains[service];
    const names = {
        solder: 'Chain Solder', 'solder-hollow': 'Chain Solder (Hollow)',
        rivet: 'Rivet', tube: 'Tube', figure8: 'Figure 8 (SS)',
        safety: 'Safety Chain (SS)', jumpring: 'Jump Ring + Solder', tighten: 'Tighten Clasp'
    };

    addLineItem(names[service], price, qty);
}

function addMiscService() {
    const service = document.getElementById('miscService').value;
    const qty = parseInt(document.getElementById('miscQty').value) || 1;

    const price = PRICE_DATA.miscellaneous[service];
    const names = {
        'clean-polish-rhodium': 'Clean/Polish/Rhodium', reshape: 'Reshape Ring',
        'remove-stone': 'Remove Stone', 'pearl-epoxy': 'Pearl Post Epoxy',
        'sizing-bumps': 'Sizing Bumps', unsolder: 'Unsolder Two Rings',
        'unsolder-addt': 'Unsolder Ea. Addt\'l', 'straighten-head': 'Straighten Head',
        'pearl-restring': 'Pearl Re-String (per in)', 'satin-finish': 'Satin Finish',
        'black-enamel': 'Black Enameling'
    };

    addLineItem(names[service], price, qty);
}

function addLaborCharge() {
    const desc = document.getElementById('laborDescription').value.trim() || 'Labor';
    const hours = parseFloat(document.getElementById('laborHours').value) || 1;
    const rateInput = document.getElementById('laborRateInput').value;
    const rate = rateInput ? parseFloat(rateInput) : state.settings.laborRate;

    const total = hours * rate;
    addLineItem(`${desc} (${hours}hrs @ $${rate}/hr)`, total, 1, true);

    document.getElementById('laborDescription').value = '';
    document.getElementById('laborRateInput').value = '';
}

function addMaterial() {
    const metal = document.getElementById('materialMetal').value;
    const unit = document.getElementById('materialUnit').value;
    const weight = parseFloat(document.getElementById('materialWeight').value) || 0;
    const addFee = document.getElementById('materialFee').value === 'yes';
    const desc = document.getElementById('materialDescription').value.trim();

    // Get base price
    let basePrice = 0;
    if (metal.startsWith('gold')) basePrice = state.settings.goldPrice;
    else if (metal === 'silver') basePrice = state.settings.silverPrice;
    else if (metal === 'platinum') basePrice = state.settings.platinumPrice;
    else if (metal === 'palladium') basePrice = state.settings.palladiumPrice;

    const purity = PRICE_DATA.metalPurity[metal];
    const ozConv = PRICE_DATA.unitConversions[unit];
    const weightOz = weight * ozConv;

    let cost = weightOz * basePrice * purity;
    if (addFee) cost *= 1.15;

    const metalNames = {
        'gold-24k': '24k Gold', 'gold-22k': '22k Gold', 'gold-18k': '18k Gold',
        'gold-14k': '14k Gold', 'gold-10k': '10k Gold', silver: 'Sterling Silver',
        platinum: 'Platinum', palladium: 'Palladium'
    };
    const unitNames = { dwt: 'dwt', grams: 'g', oz: 'oz' };
    const feeText = addFee ? ' +15% fee' : '';
    const descText = desc ? ` - ${desc}` : '';

    document.getElementById('materialCalc').innerHTML = `
        <strong>Calculation:</strong> ${weight} ${unitNames[unit]} = ${weightOz.toFixed(4)} oz<br>
        $${basePrice}/oz × ${(purity * 100).toFixed(1)}% purity${feeText} = <strong>$${cost.toFixed(2)}</strong>
    `;

    addLineItem(`Material: ${metalNames[metal]} (${weight}${unitNames[unit]})${feeText}${descText}`, cost, 1, true);
    document.getElementById('materialDescription').value = '';
}

function addCustomItem() {
    const desc = document.getElementById('customDescription').value.trim();
    const price = parseFloat(document.getElementById('customPrice').value) || 0;
    const qty = parseInt(document.getElementById('customQty').value) || 1;

    if (!desc) {
        alert('Please enter a description');
        return;
    }

    addLineItem(desc, price, qty);
    document.getElementById('customDescription').value = '';
    document.getElementById('customPrice').value = '0';
    document.getElementById('customQty').value = '1';
}

// ============================================
// LINE ITEMS MANAGEMENT
// ============================================
function addLineItem(description, unitPrice, quantity, isPreCalc = false) {
    const item = {
        id: Date.now(),
        description,
        unitPrice: isPreCalc ? unitPrice : unitPrice,
        quantity,
        total: isPreCalc ? unitPrice : unitPrice * quantity
    };

    state.lineItems.push(item);
    updateSummary();
}

function removeLineItem(id) {
    state.lineItems = state.lineItems.filter(item => item.id !== id);
    updateSummary();
}

function updateSummary() {
    const container = document.getElementById('lineItemsContainer');

    if (state.lineItems.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
                <p>No items added yet</p>
                <span>Select a service category to begin</span>
            </div>
        `;
        document.getElementById('reviewBtn').disabled = true;
    } else {
        container.innerHTML = state.lineItems.map(item => `
            <div class="line-item">
                <div class="line-item-info">
                    <div class="line-item-desc">${item.description}</div>
                    <div class="line-item-qty">Qty: ${item.quantity} × $${item.unitPrice.toFixed(2)}</div>
                </div>
                <div class="line-item-price">$${item.total.toFixed(2)}</div>
                <button class="line-item-remove" onclick="removeLineItem(${item.id})">×</button>
            </div>
        `).join('');
        document.getElementById('reviewBtn').disabled = false;
    }

    // Calculate totals
    const subtotal = state.lineItems.reduce((sum, item) => sum + item.total, 0);
    const discountPercent = parseFloat(document.getElementById('discountPercent')?.value) || 0;
    const discountAmount = subtotal * (discountPercent / 100);
    const total = subtotal - discountAmount;

    document.getElementById('subtotalDisplay').textContent = '$' + subtotal.toFixed(2);
    document.getElementById('totalDisplay').textContent = '$' + total.toFixed(2);

    const discountRow = document.getElementById('discountRow');
    if (discountPercent > 0) {
        discountRow.style.display = 'flex';
        document.getElementById('discountPercentDisplay').textContent = discountPercent;
        document.getElementById('discountAmountDisplay').textContent = '-$' + discountAmount.toFixed(2);
    } else {
        discountRow.style.display = 'none';
    }
}

// ============================================
// ATTACHMENTS
// ============================================
function handleAttachmentFiles(files) {
    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            state.attachments.push({
                name: file.name,
                data: e.target.result
            });
            updateAttachmentGrid();
        };
        reader.readAsDataURL(file);
    });
}

function updateAttachmentGrid() {
    const grid = document.getElementById('attachmentGrid');
    grid.innerHTML = state.attachments.map((att, i) => `
        <div class="attachment-item">
            <img src="${att.data}" alt="${att.name}">
            <button onclick="removeAttachment(${i})">×</button>
        </div>
    `).join('');
}

function removeAttachment(index) {
    state.attachments.splice(index, 1);
    updateAttachmentGrid();
}

// ============================================
// CLEAR DOCUMENT
// ============================================
function clearDocument() {
    if (!confirm('Clear all items and start a new document?')) return;

    state.lineItems = [];
    state.attachments = [];

    // Increment counter
    if (state.documentType === 'estimate') {
        state.settings.nextEstimate++;
    } else {
        state.settings.nextInvoice++;
    }
    saveState();

    // Reset form
    document.getElementById('customerName').value = '';
    document.getElementById('customerPhone').value = '';
    document.getElementById('customerEmail').value = '';
    document.getElementById('invoiceNotes').value = '';
    document.getElementById('discountPercent').value = '0';
    document.getElementById('attachmentGrid').innerHTML = '';
    document.getElementById('materialCalc').innerHTML = '';

    generateDocNumber();
    updateSummary();
}

// ============================================
// REVIEW SCREEN
// ============================================
function reviewDocument() {
    populateReviewPreview();
    showScreen('reviewScreen');
}

function populateReviewPreview() {
    // Company info
    if (state.company.logo) {
        document.getElementById('previewLogo').src = state.company.logo;
        document.getElementById('previewLogo').style.display = 'block';
    } else {
        document.getElementById('previewLogo').style.display = 'none';
    }

    document.getElementById('previewCompanyName').textContent = state.company.name;
    document.getElementById('previewAddress').textContent = state.company.address;

    const contact = [state.company.phone, state.company.email, state.company.website].filter(Boolean).join(' | ');
    document.getElementById('previewContact').textContent = contact;

    // Document info
    document.getElementById('previewDocType').textContent = state.documentType.toUpperCase();
    document.getElementById('previewDocNumber').textContent = '#' + state.currentDocNumber;
    document.getElementById('previewDate').textContent = new Date().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });
    document.getElementById('reviewDocType').textContent = state.documentType;

    // Customer info
    const custName = document.getElementById('customerName').value || 'Customer';
    const custPhone = document.getElementById('customerPhone').value;
    const custEmail = document.getElementById('customerEmail').value;
    document.getElementById('previewCustomerName').textContent = custName;
    document.getElementById('previewCustomerContact').textContent = [custPhone, custEmail].filter(Boolean).join(' | ');

    // Line items
    const tbody = document.getElementById('previewLineItems');
    tbody.innerHTML = state.lineItems.map(item => `
        <tr>
            <td>${item.description}</td>
            <td>${item.quantity}</td>
            <td>$${item.unitPrice.toFixed(2)}</td>
            <td>$${item.total.toFixed(2)}</td>
        </tr>
    `).join('');

    // Totals
    const subtotal = state.lineItems.reduce((sum, item) => sum + item.total, 0);
    const discountPercent = parseFloat(document.getElementById('discountPercent').value) || 0;
    const discountAmount = subtotal * (discountPercent / 100);
    const total = subtotal - discountAmount;

    document.getElementById('previewSubtotal').textContent = '$' + subtotal.toFixed(2);
    document.getElementById('previewTotal').textContent = '$' + total.toFixed(2);

    if (discountPercent > 0) {
        document.getElementById('previewDiscountRow').style.display = 'flex';
        document.getElementById('previewDiscountPercent').textContent = discountPercent;
        document.getElementById('previewDiscountAmount').textContent = '-$' + discountAmount.toFixed(2);
    } else {
        document.getElementById('previewDiscountRow').style.display = 'none';
    }

    // Notes
    const notes = document.getElementById('invoiceNotes').value;
    if (notes) {
        document.getElementById('previewNotesSection').style.display = 'block';
        document.getElementById('previewNotes').textContent = notes;
    } else {
        document.getElementById('previewNotesSection').style.display = 'none';
    }

    // Attachments
    if (state.attachments.length > 0) {
        document.getElementById('previewAttachmentsSection').style.display = 'block';
        document.getElementById('previewAttachments').innerHTML = state.attachments.map(att =>
            `<img src="${att.data}" alt="${att.name}">`
        ).join('');
    } else {
        document.getElementById('previewAttachmentsSection').style.display = 'none';
    }

    // Footer
    document.getElementById('previewFooter').textContent = state.company.footer;
}

// ============================================
// EXPORT
// ============================================
async function confirmAndExport(format) {
    const element = document.getElementById('invoiceDocument');

    try {
        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });

        if (format === 'pdf') {
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'letter');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = pageWidth - 20;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 10, 10, imgWidth, Math.min(imgHeight, pageHeight - 20));
            pdf.save(`${state.currentDocNumber}.pdf`);
        } else {
            const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
            const link = document.createElement('a');
            link.download = `${state.currentDocNumber}.${format}`;
            link.href = canvas.toDataURL(mimeType, 0.95);
            link.click();
        }

        // Increment counter
        if (state.documentType === 'estimate') {
            state.settings.nextEstimate++;
        } else {
            state.settings.nextInvoice++;
        }
        saveState();

        // Show success
        document.getElementById('successMessage').textContent =
            `Your ${state.documentType} #${state.currentDocNumber} has been saved successfully.`;
        document.getElementById('successModal').classList.add('active');

    } catch (error) {
        console.error('Export error:', error);
        alert('Error exporting document. Please try again.');
    }
}

function closeSuccessModal() {
    document.getElementById('successModal').classList.remove('active');
    clearDocument();
    showScreen('mainScreen');
}

// ============================================
// SETTINGS
// ============================================
function populateSettings() {
    document.getElementById('settingsCompanyName').value = state.company.name;
    document.getElementById('settingsAddress').value = state.company.address;
    document.getElementById('settingsPhone').value = state.company.phone;
    document.getElementById('settingsEmail').value = state.company.email;
    document.getElementById('settingsWebsite').value = state.company.website;
    document.getElementById('settingsFooter').value = state.company.footer;

    document.getElementById('settingsGoldPrice').value = state.settings.goldPrice;
    document.getElementById('settingsSilverPrice').value = state.settings.silverPrice;
    document.getElementById('settingsPlatinumPrice').value = state.settings.platinumPrice;
    document.getElementById('settingsPalladiumPrice').value = state.settings.palladiumPrice;
    document.getElementById('settingsLaborRate').value = state.settings.laborRate;
    document.getElementById('settingsEstimateNum').value = state.settings.nextEstimate;
    document.getElementById('settingsInvoiceNum').value = state.settings.nextInvoice;

    updateSettingsLogoPreview();
}

function updateSettingsLogoPreview() {
    const preview = document.getElementById('settingsLogoPreview');
    if (state.company.logo) {
        preview.innerHTML = `<img src="${state.company.logo}" alt="Logo">`;
    } else {
        preview.innerHTML = '<span>No logo</span>';
    }
}

function removeLogo() {
    state.company.logo = null;
    updateSettingsLogoPreview();
    saveState();
}

function saveSettings() {
    state.company.name = document.getElementById('settingsCompanyName').value.trim();
    state.company.address = document.getElementById('settingsAddress').value.trim();
    state.company.phone = document.getElementById('settingsPhone').value.trim();
    state.company.email = document.getElementById('settingsEmail').value.trim();
    state.company.website = document.getElementById('settingsWebsite').value.trim();
    state.company.footer = document.getElementById('settingsFooter').value.trim();

    state.settings.goldPrice = parseFloat(document.getElementById('settingsGoldPrice').value) || 4000;
    state.settings.silverPrice = parseFloat(document.getElementById('settingsSilverPrice').value) || 30;
    state.settings.platinumPrice = parseFloat(document.getElementById('settingsPlatinumPrice').value) || 1000;
    state.settings.palladiumPrice = parseFloat(document.getElementById('settingsPalladiumPrice').value) || 1100;
    state.settings.laborRate = parseFloat(document.getElementById('settingsLaborRate').value) || 75;
    state.settings.nextEstimate = parseInt(document.getElementById('settingsEstimateNum').value) || 1;
    state.settings.nextInvoice = parseInt(document.getElementById('settingsInvoiceNum').value) || 1;

    saveState();
    showScreen('mainScreen');
}

// ============================================
// DATA IMPORT/EXPORT
// ============================================
function exportAllData() {
    const data = {
        version: '2.0',
        exportDate: new Date().toISOString(),
        company: state.company,
        settings: state.settings
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.download = `jewelry-invoice-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
}

function handleImportData(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = JSON.parse(event.target.result);
            if (data.company) Object.assign(state.company, data.company);
            if (data.settings) Object.assign(state.settings, data.settings);
            saveState();
            populateSettings();
            alert('Data imported successfully!');
        } catch (error) {
            alert('Error importing data. Invalid file format.');
        }
    };
    reader.readAsText(file);
    e.target.value = '';
}

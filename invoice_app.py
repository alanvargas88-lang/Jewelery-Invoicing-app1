import json
import os
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
from PIL import Image, ImageDraw, ImageFont

# Hardcoded prices from your site (structured to match tables)
PRICES = {
    'ring_sizing': {
        '10kt_14kt': {
            'widths': {
                '<3.0': {
                    'small_3': {'yellow_04': 29, 'white_rose_04': 41, 'yellow_520': 35, 'white_rose_520': 47},
                    '1_up': {'yellow_04': 55, 'white_rose_04': 68, 'yellow_520': 61, 'white_rose_520': 74},
                    'add_up': {'yellow_04': 27, 'white_rose_04': 27, 'yellow_520': 27, 'white_rose_520': 27}
                },
                '3.01-5.0': {
                    'small_3': {'yellow_04': 34, 'white_rose_04': 47, 'yellow_520': 40, 'white_rose_520': 53},
                    '1_up': {'yellow_04': 61, 'white_rose_04': 74, 'yellow_520': 67, 'white_rose_520': 79},
                    'add_up': {'yellow_04': 40, 'white_rose_04': 40, 'yellow_520': 40, 'white_rose_520': 40}
                },
                '5.01-8.0': {
                    'small_3': {'yellow_04': 40, 'white_rose_04': 53, 'yellow_520': 46, 'white_rose_520': 58},
                    '1_up': {'yellow_04': 67, 'white_rose_04': 79, 'yellow_520': 73, 'white_rose_520': 85},
                    'add_up': {'yellow_04': 53, 'white_rose_04': 53, 'yellow_520': 53, 'white_rose_520': 53}
                }
            }
        },
        '18kt': {
            'widths': {
                '<3.0': {
                    'small_3': {'yellow_04': 34, 'white_rose_04': 47, 'yellow_520': 40, 'white_rose_520': 53},
                    '1_up': {'yellow_04': 61, 'white_rose_04': 74, 'yellow_520': 67, 'white_rose_520': 79},
                    'add_up': {'yellow_04': 40, 'white_rose_04': 40, 'yellow_520': 40, 'white_rose_520': 40}
                },
                '3.01-5.0': {
                    'small_3': {'yellow_04': 40, 'white_rose_04': 53, 'yellow_520': 46, 'white_rose_520': 58},
                    '1_up': {'yellow_04': 67, 'white_rose_04': 79, 'yellow_520': 73, 'white_rose_520': 85},
                    'add_up': {'yellow_04': 53, 'white_rose_04': 53, 'yellow_520': 53, 'white_rose_520': 53}
                },
                '5.01-8.0': {
                    'small_3': {'yellow_04': 46, 'white_rose_04': 58, 'yellow_520': 52, 'white_rose_520': 64},
                    '1_up': {'yellow_04': 73, 'white_rose_04': 85, 'yellow_520': 78, 'white_rose_520': 91},
                    'add_up': {'yellow_04': 67, 'white_rose_04': 67, 'yellow_520': 67, 'white_rose_520': 67}
                }
            }
        },
        'platinum': {
            'widths': {
                '<3.0': {
                    'small_3': {'04': 40, '520': 50},
                    '1_up': {'04': 75, '520': 90},
                    'add_up': {'04': 35, '520': 35}
                },
                '3.01-5.0': {
                    'small_3': {'04': 45, '520': 60},
                    '1_up': {'04': 120, '520': 130},
                    'add_up': {'04': 65, '520': 65}
                },
                '5.01-8.0': {
                    'small_3': {'04': 50, '520': 65},
                    '1_up': {'04': 150, '520': 165},
                    'add_up': {'04': 80, '520': 80}
                }
            }
        },
        'silver': {
            'widths': {
                '<3.0': {
                    'small_3': {'no': 17, 'with': 25},
                    '1_up': {'no': 29, 'with': 35},
                    'add_up': {'no': 12, 'with': 12}
                },
                '3.01-5.0': {
                    'small_3': {'no': 23, 'with': 30},
                    '1_up': {'no': 35, 'with': 41},
                    'add_up': {'no': 17, 'with': 17}
                }
            }
        }
    },
    'stone_setting_round': [
        {'min_ct': 0.01, 'max_ct': 0.07, 'min_mm': 0.005, 'max_mm': 2.6, 'prong': 10, 'chanel': 17, 'bezel': 14},
        {'min_ct': 0.08, 'max_ct': 0.15, 'min_mm': 2.7, 'max_mm': 3.3, 'prong': 14, 'chanel': 23, 'bezel': 17},
        {'min_ct': 0.16, 'max_ct': 0.50, 'min_mm': 3.4, 'max_mm': 5.2, 'prong': 18, 'chanel': 31, 'bezel': 25},
        {'min_ct': 0.51, 'max_ct': 0.75, 'min_mm': 5.2, 'max_mm': 5.8, 'prong': 20, 'chanel': 41, 'bezel': 30},
        {'min_ct': 0.76, 'max_ct': 1.00, 'min_mm': 5.8, 'max_mm': 6.5, 'prong': 36, 'chanel': 54, 'bezel': 38},
        {'min_ct': 1.01, 'max_ct': 1.50, 'min_mm': 6.5, 'max_mm': 7.4, 'prong': 40, 'chanel': 62, 'bezel': 45},
        {'min_ct': 1.51, 'max_ct': 2.00, 'min_mm': 7.4, 'max_mm': 8.2, 'prong': 47, 'chanel': 71, 'bezel': 53},
        {'min_ct': 2.01, 'max_ct': 3.00, 'min_mm': 8.2, 'max_mm': 9.4, 'prong': 54, 'chanel': 97, 'bezel': 60},
        {'min_ct': 3.01, 'max_ct': 4.00, 'min_mm': 9.4, 'max_mm': 10.4, 'prong': 62, 'chanel': 115, 'bezel': 69},
        {'min_ct': 4.01, 'max_ct': 5.00, 'min_mm': 10.4, 'max_mm': 11.2, 'prong': 69, 'chanel': 128, 'bezel': 72},
        {'min_ct': 5.01, 'max_ct': float('inf'), 'min_mm': 11.2, 'max_mm': float('inf'), 'prong': 110, 'chanel': 133, 'bezel': 76}
    ],
    'stone_setting_other': {
        'oval_pear_heart': [
            {'min_ct': 0.01, 'max_ct': 0.07, 'price': 15},
            {'min_ct': 0.08, 'max_ct': 0.15, 'price': 20},
            {'min_ct': 0.16, 'max_ct': 0.50, 'price': 30},
            {'min_ct': 0.51, 'max_ct': 0.75, 'price': 31},
            {'min_ct': 0.76, 'max_ct': 1.00, 'price': 55},
            {'min_ct': 1.01, 'max_ct': 1.50, 'price': 62},
            {'min_ct': 1.51, 'max_ct': 2.00, 'price': 72},
            {'min_ct': 2.01, 'max_ct': 3.00, 'price': 85},
            {'min_ct': 3.01, 'max_ct': 4.00, 'price': 95},
            {'min_ct': 4.01, 'max_ct': 5.00, 'price': 107},
            {'min_ct': 5.01, 'max_ct': float('inf'), 'price': 115}
        ],
        'marquise_emerald': [
            {'min_ct': 0.01, 'max_ct': 0.07, 'price': 17},
            {'min_ct': 0.08, 'max_ct': 0.15, 'price': 25},
            {'min_ct': 0.16, 'max_ct': 0.50, 'price': 32},
            {'min_ct': 0.51, 'max_ct': 0.75, 'price': 36},
            {'min_ct': 0.76, 'max_ct': 1.00, 'price': 65},
            {'min_ct': 1.01, 'max_ct': 1.50, 'price': 71},
            {'min_ct': 1.51, 'max_ct': 2.00, 'price': 85},
            {'min_ct': 2.01, 'max_ct': 3.00, 'price': 95},
            {'min_ct': 3.01, 'max_ct': 4.00, 'price': 108},
            {'min_ct': 4.01, 'max_ct': 5.00, 'price': 121},
            {'min_ct': 5.01, 'max_ct': float('inf'), 'price': 127}
        ],
        'princess': [
            {'min_ct': 0.01, 'max_ct': 0.07, 'price': 18},
            {'min_ct': 0.08, 'max_ct': 0.15, 'price': 25},
            {'min_ct': 0.16, 'max_ct': 0.50, 'price': 37},
            {'min_ct': 0.51, 'max_ct': 0.75, 'price': 40},
            {'min_ct': 0.76, 'max_ct': 1.00, 'price': 72},
            {'min_ct': 1.01, 'max_ct': 1.50, 'price': 81},
            {'min_ct': 1.51, 'max_ct': 2.00, 'price': 95},
            {'min_ct': 2.01, 'max_ct': 3.00, 'price': 108},
            {'min_ct': 3.01, 'max_ct': 4.00, 'price': 125},
            {'min_ct': 4.01, 'max_ct': 5.00, 'price': 140},
            {'min_ct': 5.01, 'max_ct': float('inf'), 'price': 155}
        ]
    },
    'tips_prongs': {
        '14kt_silver': {'tip': 15, 'prong': 17, 'full_prong': 25, 'v_prong': 35, 'ea_add': [10, 12, 15, 25]},
        '18kt': {'tip': 18, 'prong': 25, 'full_prong': 30, 'v_prong': 40, 'ea_add': [12, 15, 21, 30]}
    },
    'chains': {
        'ea_solder': 12,
        'ea_solder_hollow': 17,
        'rivet': 17,
        'tube': 17,
        'figure8': 'est',
        'figure8_ss': 12,
        'safety_chain': 'est',
        'safety_chain_ss': 12,
        'jump_ring_solder': 'est',
        'jump_ring_solder_ss': 12,
        'tighten_clasp': 12
    },
    'misc': {
        'clean_polish_rhodium': 25,
        'reshape_ring': 17,
        'remove_stone': 6,
        'pearl_post_epoxy': 6,
        'sizing_bumps': 35,
        'unsolder_two_rings': 46,  # addtl 23 per extra
        'straighten_head': 23,
        'pearl_restringing': 2,  # per inch
        'satin_finish': 12,
        'black_enameling': 17
    }
}

def load_json(file):
    if os.path.exists(file):
        with open(file, 'r') as f:
            return json.load(f)
    return None

def save_json(file, data):
    with open(file, 'w') as f:
        json.dump(data, f)

def get_number(type_):
    state_file = 'state.json'
    state = load_json(state_file) or {'last_invoice': 0, 'last_estimate': 0}
    if type_ == 'invoice':
        state['last_invoice'] += 1
        num = state['last_invoice']
        prefix = 'I'
    else:
        state['last_estimate'] += 1
        num = state['last_estimate']
        prefix = 'E'
    save_json(state_file, state)
    return f"{prefix}-{num:04d}"

def get_input(prompt, type_=str, default=None):
    while True:
        val = input(prompt).strip()
        if not val and default is not None:
            return default
        try:
            return type_(val)
        except ValueError:
            print("Bad input. Try again.")

def get_company_info():
    config_file = 'config.json'
    config = load_json(config_file) or {}
    if not config:
        config['name'] = get_input("Company name: ")
        config['address'] = get_input("Company address: ")
        config['phone'] = get_input("Company phone: ")
        config['email'] = get_input("Company email: ")
        config['logo_path'] = get_input("Logo image path (optional, leave blank for none): ", default="")
        save_json(config_file, config)
    return config

def select_category():
    print("Categories:")
    print("1. Ring Sizing")
    print("2. Stone Setting (Round)")
    print("3. Stone Setting (Other Shapes)")
    print("4. Tips and Prongs")
    print("5. Chains")
    print("6. Miscellaneous")
    print("7. Custom")
    return get_input("Select (1-7): ", int)

def get_item(category):
    desc = ""
    price = 0.0
    qty = 1

    if category == 1:  # Ring Sizing
        karat = get_input("Karat (10kt_14kt, 18kt, platinum, silver): ")
        if karat not in PRICES['ring_sizing']:
            print("Invalid. Defaulting to 10kt_14kt.")
            karat = '10kt_14kt'
        width = get_input("Width (<3.0, 3.01-5.0, 5.01-8.0): ")
        service = get_input("Service (small_3, 1_up, add_up): ")
        if karat in ['10kt_14kt', '18kt']:
            color = get_input("Color (yellow, white_rose): ")
            stones = get_input("Stones (04, 520): ")
            key = f"{color}_{stones}"
        elif karat == 'platinum':
            stones = get_input("Stones (04, 520): ")
            key = stones
        else:  # silver
            stones = get_input("Stones (no, with): ")
            key = stones
        try:
            price = PRICES['ring_sizing'][karat]['widths'][width][service][key]
        except KeyError:
            print("Invalid options. Price set to 0.")
            price = 0.0
        desc = f"Ring Sizing {karat} {width} {service} {key}"
        if service == 'add_up':
            qty = get_input("Number of additional sizes: ", int, 1)

    elif category == 2:  # Stone Setting Round
        ct = get_input("Carats: ", float)
        type_ = get_input("Type (prong, chanel, bezel): ")
        for row in PRICES['stone_setting_round']:
            if row['min_ct'] <= ct <= row['max_ct']:
                price = row[type_]
                break
        else:
            price = 0.0
        desc = f"Stone Setting Round {ct}ct {type_}"
        qty = get_input("Quantity (stones): ", int, 1)

    elif category == 3:  # Stone Setting Other
        shape = get_input("Shape (oval_pear_heart, marquise_emerald, princess): ")
        ct = get_input("Carats: ", float)
        for row in PRICES['stone_setting_other'][shape]:
            if row['min_ct'] <= ct <= row['max_ct']:
                price = row['price']
                break
        else:
            price = 0.0
        desc = f"Stone Setting {shape} {ct}ct"
        qty = get_input("Quantity (stones): ", int, 1)

    elif category == 4:  # Tips Prongs
        metal = get_input("Metal (14kt_silver, 18kt): ")
        type_ = get_input("Type (tip, prong, full_prong, v_prong): ")
        idx = ['tip', 'prong', 'full_prong', 'v_prong'].index(type_)
        base = PRICES['tips_prongs'][metal][type_]
        add = PRICES['tips_prongs'][metal]['ea_add'][idx]
        qty = get_input("Quantity: ", int, 1)
        price = base + (qty - 1) * add if qty > 1 else base
        desc = f"{type_.capitalize()} {metal} x{qty}"

    elif category == 5:  # Chains
        service = get_input("Service (ea_solder, ea_solder_hollow, rivet, tube, figure8, figure8_ss, safety_chain, safety_chain_ss, jump_ring_solder, jump_ring_solder_ss, tighten_clasp): ")
        price_val = PRICES['chains'][service]
        if price_val == 'est':
            price = get_input("Enter estimated price: ", float)
        else:
            price = price_val
        desc = f"Chain {service}"
        qty = get_input("Quantity: ", int, 1)

    elif category == 6:  # Misc
        service = get_input("Service (clean_polish_rhodium, reshape_ring, remove_stone, pearl_post_epoxy, sizing_bumps, unsolder_two_rings, straighten_head, pearl_restringing, satin_finish, black_enameling): ")
        price = PRICES['misc'][service]
        if service == 'unsolder_two_rings':
            extra = get_input("Additional rings beyond two: ", int, 0)
            price += extra * 23
        elif service == 'pearl_restringing':
            inches = get_input("Inches: ", int)
            price *= inches
            qty = inches
        else:
            qty = get_input("Quantity: ", int, 1)
        desc = f"{service.capitalize()}"

    elif category == 7:  # Custom
        desc = get_input("Description: ")
        price = get_input("Price: ", float)
        qty = get_input("Quantity: ", int, 1)

    override = get_input(f"Suggested price per unit: ${price:.2f}. Override? (y/n): ", default='n')
    if override.lower() == 'y':
        price = get_input("New price per unit: ", float)
    return desc, qty, price

def generate_pdf(filename, type_, num, company, client_name, client_address, items, subtotal, discount_perc, discount_amt, total, footer, attachments):
    doc = SimpleDocTemplate(filename, pagesize=letter)
    elements = []
    styles = getSampleStyleSheet()

    # Header
    header = Paragraph(f"{company['name']}<br/>{company['address']}<br/>{company['phone']}<br/>{company['email']}", styles['Normal'])
    elements.append(header)
    elements.append(Paragraph("<br/>", styles['Normal']))

    # Title
    title = Paragraph(f"{type_.upper()} {num}", styles['Heading1'])
    elements.append(title)

    # To
    to = Paragraph(f"To: {client_name}<br/>{client_address}", styles['Normal'])
    elements.append(to)
    elements.append(Paragraph("<br/>", styles['Normal']))

    # Items table
    table_data = [['Description', 'Qty', 'Price', 'Total']]
    for desc, qty, price in items:
        total_item = qty * price
        table_data.append([desc, qty, f"${price:.2f}", f"${total_item:.2f}"])
    table_data.append(['', '', 'Subtotal', f"${subtotal:.2f}"])
    table_data.append(['', '', 'Discount ({discount_perc}%)', f"-${discount_amt:.2f}"])
    table_data.append(['', '', 'Total', f"${total:.2f}"])

    t = Table(table_data)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    elements.append(t)
    elements.append(Paragraph("<br/>", styles['Normal']))

    # Footer
    elements.append(Paragraph(footer, styles['Normal']))

    doc.build(elements)

    # Attachments as extra pages
    if attachments:
        c = canvas.Canvas(filename, pagesize=letter)  # Reopen to append? Wait, SimpleDocTemplate builds single, but for images, better use canvas for append.
        # Actually, to append images, we'll use canvas separately but since DocTemplate, perhaps build with flowables including images.
        # For simplicity, we'll add images as new flowables.
        for att in attachments:
            if os.path.exists(att):
                elements.append(Paragraph("<br/>Attachment:", styles['Normal']))
                # Reportlab Image flowable
                from reportlab.platypus import Image as RLImage
                img = RLImage(att, width=4*inch, height=4*inch)  # Scale
                elements.append(img)
        doc.build(elements)  # Rebuild with attachments

def generate_png(filename, type_, num, company, client_name, client_address, items, subtotal, discount_perc, discount_amt, total, footer, attachments):
    width, height = 800, 1200
    img = Image.new('RGB', (width, height), color='white')
    draw = ImageDraw.Draw(img)
    font = ImageFont.load_default()  # Or load truetype if you want better

    y = 50
    draw.text((50, y), company['name'], fill='black', font=font)
    y += 20
    draw.text((50, y), company['address'], fill='black', font=font)
    y += 20
    draw.text((50, y), company['phone'], fill='black', font=font)
    y += 20
    draw.text((50, y), company['email'], fill='black', font=font)
    y += 50

    draw.text((50, y), f"{type_.upper()} {num}", fill='black', font=font)
    y += 50

    draw.text((50, y), f"To: {client_name}", fill='black', font=font)
    y += 20
    draw.text((50, y), client_address, fill='black', font=font)
    y += 50

    # Table headers
    draw.text((50, y), "Description", fill='black', font=font)
    draw.text((300, y), "Qty", fill='black', font=font)
    draw.text((400, y), "Price", fill='black', font=font)
    draw.text((500, y), "Total", fill='black', font=font)
    y += 20
    draw.line((50, y, 750, y), fill='black')

    for desc, qty, price in items:
        y += 20
        draw.text((50, y), desc, fill='black', font=font)
        draw.text((300, y), str(qty), fill='black', font=font)
        draw.text((400, y), f"${price:.2f}", fill='black', font=font)
        draw.text((500, y), f"${qty * price:.2f}", fill='black', font=font)

    y += 20
    draw.line((50, y, 750, y), fill='black')
    y += 20
    draw.text((400, y), "Subtotal", fill='black', font=font)
    draw.text((500, y), f"${subtotal:.2f}", fill='black', font=font)
    y += 20
    draw.text((400, y), f"Discount ({discount_perc}%)", fill='black', font=font)
    draw.text((500, y), f"-${discount_amt:.2f}", fill='black', font=font)
    y += 20
    draw.text((400, y), "Total", fill='black', font=font)
    draw.text((500, y), f"${total:.2f}", fill='black', font=font)
    y += 50

    draw.text((50, y), footer, fill='black', font=font)

    img.save(filename)

    # Attachments separate
    for i, att in enumerate(attachments, 1):
        if os.path.exists(att):
            att_ext = os.path.splitext(att)[1]
            att_filename = f"{os.path.splitext(filename)[0]}-attachment{i}{att_ext}"
            with open(att, 'rb') as f:
                with open(att_filename, 'wb') as out:
                    out.write(f.read())
            print(f"Saved attachment: {att_filename}")

def main():
    type_ = get_input("Type (invoice/estimate): ").lower()
    if type_ not in ['invoice', 'estimate']:
        print("Invalid. Exiting.")
        return

    num = get_number(type_)

    company = get_company_info()

    client_name = get_input("Client name: ")
    client_address = get_input("Client address: ")

    footer = get_input("Custom footer message: ")

    items = []
    while True:
        add = get_input("Add item? (y/n): ", default='n')
        if add.lower() != 'y':
            break
        cat = select_category()
        desc, qty, price = get_item(cat)
        items.append((desc, qty, price))

    subtotal = sum(qty * price for _, qty, price in items)
    discount_perc = get_input("Discount % (0-100): ", float, 0.0)
    discount_amt = subtotal * (discount_perc / 100)
    total = subtotal - discount_amt

    format_ = get_input("Output format (pdf/png): ").lower()
    attachments = []
    att_input = get_input("Attach images? (y/n): ", default='n')
    if att_input.lower() == 'y':
        paths = get_input("Image paths (comma separated): ")
        attachments = [p.strip() for p in paths.split(',')]
        for p in attachments:
            if not os.path.exists(p):
                print(f"Warning: {p} not found. Skipping.")
                attachments.remove(p)

    filename = f"{num}.{format_}"
    if format_ == 'pdf':
        generate_pdf(filename, type_, num, company, client_name, client_address, items, subtotal, discount_perc, discount_amt, total, footer, attachments)
    elif format_ == 'png':
        generate_png(filename, type_, num, company, client_name, client_address, items, subtotal, discount_perc, discount_amt, total, footer, attachments)
    else:
        print("Invalid format. Exiting.")
        return

    print(f"Generated: {filename}")

if __name__ == "__main__":
    main()
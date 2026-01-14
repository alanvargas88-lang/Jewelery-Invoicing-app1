# Jewelry Invoice & Estimate Generator

A simple, browser-based application for creating professional invoices and estimates for jewelry repair and custom work. Built specifically for Alan Vargas Jewelry LLC with pricing based on the Geller Blue Book Ver.5 Release 6.60.

## Features

### Document Creation
- **Estimates & Invoices**: Toggle between estimate and invoice modes
- **Automatic Numbering**: Unique sequential numbers for all documents (EST-0001, INV-0001, etc.)
- **Professional Layout**: Clean, printable letterhead design

### Company Branding
- **Custom Letterhead**: Add your company name, address, phone, email, and website
- **Logo Support**: Upload and display your company logo
- **Custom Footer**: Add personalized messages or terms at the bottom of each document

### Pricing & Services
All pricing from the 2026 Alan Vargas Jewelry price list is built-in:

#### Ring Sizing
- 10kt/14kt Gold (Yellow, White, Rose)
- 18kt Gold (Yellow, White, Rose)
- Platinum
- Sterling Silver
- Multiple width categories and stone counts

#### Stone Setting
- Round stones (Prong, Channel/Tiffany, Bezel)
- Fancy shapes (Oval, Pear, Heart, Marquise, Emerald Cut, Princess)
- All carat weight ranges from 0.01ct to 5.01ct+

#### Tips & Prongs
- Tips, Prongs, Full Prongs, V Prongs
- 14kt/Silver and 18kt pricing
- First and additional pricing

#### Chain Repairs
- Solder (standard and hollow)
- Rivet, Tube, Figure 8
- Safety Chain, Jump Ring, Clasp Tightening

#### Miscellaneous Services
- Clean/Polish/Rhodium
- Reshape Ring, Remove Stone, Pearl Work
- Sizing Bumps, Unsolder Rings
- Pearl Re-stringing, Satin Finish, Black Enameling

### Labor & Materials

#### Labor Charges
- Customizable hourly rate
- Per-job rate override option
- Automatic calculation based on hours

#### Metal Price Calculator
- Daily metal price input (Gold, Silver, Platinum, Palladium)
- Support for multiple gold karats (10k, 14k, 18k, 22k, 24k)
- Weight units: Pennyweight (dwt), Grams, Troy Ounces
- Automatic 15% sourcing fee option
- Real-time cost calculation

### Pricing Flexibility
- **Override Option**: Add custom items with any price
- **Quantity Support**: Multiply any service by quantity
- **Percentage Discounts**: Apply discounts to the total

### Attachments
- Upload reference photos from phone or computer
- Attach design ideas, inspiration images, or documentation
- Images display on the final invoice/estimate

### Export Options
- **PDF**: Professional print-ready documents
- **PNG**: High-quality image export
- **JPG**: Compressed image export
- **JSON**: Save complete invoice data for later editing

### Data Management
- **Save/Load**: Save invoices as JSON files, reload and edit later
- **Local Storage**: Remembers your company info, logo, and settings
- **Invoice History**: Tracks recent invoices and estimates

## How to Use

1. **Open `index.html`** in any modern web browser
2. **Set up your company info** in the Company Settings section (only needed once - it saves automatically)
3. **Add your logo** by uploading an image file
4. **Enter customer information** for each new document
5. **Add services** by selecting from the tabs:
   - Ring Sizing
   - Stone Setting
   - Tips/Prongs
   - Chains
   - Misc
   - Labor
   - Materials
   - Custom (for any override pricing)
6. **Apply discount** if needed
7. **Add notes** for special instructions
8. **Attach images** if needed
9. **Export** as PDF, PNG, or JPG

## File Structure

```
├── index.html      # Main application interface
├── styles.css      # Styling and responsive design
├── app.js          # Application logic and calculations
├── price-data.js   # Complete pricing data from price list
└── README.md       # This file
```

## Browser Compatibility

Works in all modern browsers:
- Chrome (recommended)
- Firefox
- Safari
- Edge

## Mobile Support

The app is fully responsive and works on:
- Desktop computers
- Tablets
- Smartphones

## Offline Use

After loading once, the app works completely offline. All data is stored locally in your browser.

## Updating Prices

To update prices, edit the `price-data.js` file. All pricing is organized by service type and can be easily modified.

## License

MIT License - See LICENSE file for details.

---

*Based on Geller Blue Book Ver.5 Release 6.60 adjusted for gold at $4,000/oz (30-45% of retail value)*

/**
 * Unit Tests: Price Parsing Functions
 * Tests for parseKitcoPricesNew and price validation
 */

describe('Price Parsing Functions', () => {
  const fallbackPrices = {
    gold: 4700,
    silver: 95,
    platinum: 2400,
    palladium: 1800
  };

  // Recreate parseKitcoPricesNew as in app.js
  function parseKitcoPricesNew(html, fallbackPrices) {
    const prices = {
      gold: fallbackPrices.gold,
      silver: fallbackPrices.silver,
      platinum: fallbackPrices.platinum,
      palladium: fallbackPrices.palladium,
      source: 'fallback'
    };

    let parsedCount = 0;

    try {
      // Extract gold price
      const goldMatch = html.match(/(?:>|"|')gold(?:<[^>]*>|\s|"|')*(?:\$|USD)?\s*([\d,]+\.?\d{0,2})/i);
      if (goldMatch) {
        const price = parseFloat(goldMatch[1].replace(/,/g, ''));
        if (price >= 1500 && price <= 10000) {
          prices.gold = price;
          parsedCount++;
        }
      }

      // Extract silver price
      const silverMatch = html.match(/(?:>|"|')silver(?:<[^>]*>|\s|"|')*(?:\$|USD)?\s*([\d,]+\.?\d{0,2})/i);
      if (silverMatch) {
        const price = parseFloat(silverMatch[1].replace(/,/g, ''));
        if (price >= 15 && price <= 200) {
          prices.silver = price;
          parsedCount++;
        }
      }

      // Extract platinum price
      const platinumMatch = html.match(/(?:>|"|')platinum(?:<[^>]*>|\s|"|')*(?:\$|USD)?\s*([\d,]+\.?\d{0,2})/i);
      if (platinumMatch) {
        const price = parseFloat(platinumMatch[1].replace(/,/g, ''));
        if (price >= 500 && price <= 5000) {
          prices.platinum = price;
          parsedCount++;
        }
      }

      // Extract palladium price
      const palladiumMatch = html.match(/(?:>|"|')palladium(?:<[^>]*>|\s|"|')*(?:\$|USD)?\s*([\d,]+\.?\d{0,2})/i);
      if (palladiumMatch) {
        const price = parseFloat(palladiumMatch[1].replace(/,/g, ''));
        if (price >= 500 && price <= 5000) {
          prices.palladium = price;
          parsedCount++;
        }
      }

      if (parsedCount >= 2) {
        prices.source = 'parsed';
      }
    } catch (e) {
      // Return fallback on error
    }

    return prices;
  }

  describe('parseKitcoPricesNew', () => {
    describe('Gold price parsing', () => {
      test('parses gold price from simple HTML', () => {
        const html = '<div>Gold $2,650.00</div>';
        const result = parseKitcoPricesNew(html, fallbackPrices);
        expect(result.gold).toBe(2650);
      });

      test('parses gold price without dollar sign', () => {
        const html = '<span>gold 2650.50</span>';
        const result = parseKitcoPricesNew(html, fallbackPrices);
        expect(result.gold).toBe(2650.50);
      });

      test('rejects gold price below minimum (1500)', () => {
        const html = '<div>Gold $1000.00</div>';
        const result = parseKitcoPricesNew(html, fallbackPrices);
        expect(result.gold).toBe(fallbackPrices.gold);
      });

      test('rejects gold price above maximum (10000)', () => {
        const html = '<div>Gold $15000.00</div>';
        const result = parseKitcoPricesNew(html, fallbackPrices);
        expect(result.gold).toBe(fallbackPrices.gold);
      });

      test('handles gold with USD prefix', () => {
        const html = '"gold" USD 2,700.00';
        const result = parseKitcoPricesNew(html, fallbackPrices);
        expect(result.gold).toBe(2700);
      });
    });

    describe('Silver price parsing', () => {
      test('parses silver price', () => {
        const html = '<div>Silver $30.50</div>';
        const result = parseKitcoPricesNew(html, fallbackPrices);
        expect(result.silver).toBe(30.50);
      });

      test('rejects silver price below minimum (15)', () => {
        const html = '<div>Silver $10.00</div>';
        const result = parseKitcoPricesNew(html, fallbackPrices);
        expect(result.silver).toBe(fallbackPrices.silver);
      });

      test('rejects silver price above maximum (200)', () => {
        const html = '<div>Silver $250.00</div>';
        const result = parseKitcoPricesNew(html, fallbackPrices);
        expect(result.silver).toBe(fallbackPrices.silver);
      });
    });

    describe('Platinum price parsing', () => {
      test('parses platinum price', () => {
        const html = '<div>Platinum $950.00</div>';
        const result = parseKitcoPricesNew(html, fallbackPrices);
        expect(result.platinum).toBe(950);
      });

      test('rejects platinum price below minimum (500)', () => {
        const html = '<div>Platinum $400.00</div>';
        const result = parseKitcoPricesNew(html, fallbackPrices);
        expect(result.platinum).toBe(fallbackPrices.platinum);
      });

      test('rejects platinum price above maximum (5000)', () => {
        const html = '<div>Platinum $6000.00</div>';
        const result = parseKitcoPricesNew(html, fallbackPrices);
        expect(result.platinum).toBe(fallbackPrices.platinum);
      });
    });

    describe('Palladium price parsing', () => {
      test('parses palladium price', () => {
        const html = '<div>Palladium $1,100.00</div>';
        const result = parseKitcoPricesNew(html, fallbackPrices);
        expect(result.palladium).toBe(1100);
      });

      test('rejects palladium price below minimum (500)', () => {
        const html = '<div>Palladium $300.00</div>';
        const result = parseKitcoPricesNew(html, fallbackPrices);
        expect(result.palladium).toBe(fallbackPrices.palladium);
      });
    });

    describe('Source detection', () => {
      test('sets source to "parsed" when 2+ metals parsed', () => {
        const html = '<div>Gold $2,650.00</div><div>Silver $30.00</div>';
        const result = parseKitcoPricesNew(html, fallbackPrices);
        expect(result.source).toBe('parsed');
      });

      test('keeps source as "fallback" when only 1 metal parsed', () => {
        const html = '<div>Gold $2,650.00</div>';
        const result = parseKitcoPricesNew(html, fallbackPrices);
        expect(result.source).toBe('fallback');
      });

      test('sets source to "parsed" when all 4 metals parsed', () => {
        const html = `
          <div>Gold $2,650.00</div>
          <div>Silver $30.00</div>
          <div>Platinum $950.00</div>
          <div>Palladium $1,100.00</div>
        `;
        const result = parseKitcoPricesNew(html, fallbackPrices);
        expect(result.source).toBe('parsed');
        expect(result.gold).toBe(2650);
        expect(result.silver).toBe(30);
        expect(result.platinum).toBe(950);
        expect(result.palladium).toBe(1100);
      });
    });

    describe('Edge cases', () => {
      test('handles empty HTML', () => {
        const result = parseKitcoPricesNew('', fallbackPrices);
        expect(result.gold).toBe(fallbackPrices.gold);
        expect(result.silver).toBe(fallbackPrices.silver);
        expect(result.source).toBe('fallback');
      });

      test('handles HTML with no prices', () => {
        const html = '<div>Some random content</div>';
        const result = parseKitcoPricesNew(html, fallbackPrices);
        expect(result.gold).toBe(fallbackPrices.gold);
        expect(result.source).toBe('fallback');
      });

      test('handles malformed HTML', () => {
        const html = '<div>Gold <span>$2,650.00</span></div>';
        const result = parseKitcoPricesNew(html, fallbackPrices);
        expect(result.gold).toBe(2650);
      });

      test('handles prices with commas', () => {
        const html = '<div>Gold $2,650.50</div>';
        const result = parseKitcoPricesNew(html, fallbackPrices);
        expect(result.gold).toBe(2650.50);
      });

      test('handles case insensitive metal names', () => {
        const html = '<div>GOLD $2,650.00</div><div>SILVER $30.00</div>';
        const result = parseKitcoPricesNew(html, fallbackPrices);
        expect(result.gold).toBe(2650);
        expect(result.silver).toBe(30);
      });

      test('does not confuse metals with similar text', () => {
        // Make sure "gold" doesn't match "golden" prices
        const html = '<div>Golden ratio 1.618</div><div>Gold $2,650.00</div>';
        const result = parseKitcoPricesNew(html, fallbackPrices);
        expect(result.gold).toBe(2650);
      });
    });

    describe('Real-world HTML patterns', () => {
      test('parses Kitco-like table format', () => {
        const html = `
          <table>
            <tr><td class="metal">"gold"</td><td class="price">$2,680.50</td></tr>
            <tr><td class="metal">"silver"</td><td class="price">$31.25</td></tr>
            <tr><td class="metal">"platinum"</td><td class="price">$985.00</td></tr>
            <tr><td class="metal">"palladium"</td><td class="price">$1,050.00</td></tr>
          </table>
        `;
        const result = parseKitcoPricesNew(html, fallbackPrices);
        expect(result.source).toBe('parsed');
        expect(result.gold).toBe(2680.50);
        expect(result.silver).toBe(31.25);
        expect(result.platinum).toBe(985);
        expect(result.palladium).toBe(1050);
      });

      test('parses JSON-like format in HTML', () => {
        const html = '{"gold": 2650.00, "silver": 30.50}';
        const result = parseKitcoPricesNew(html, fallbackPrices);
        expect(result.gold).toBe(2650);
        expect(result.silver).toBe(30.50);
      });
    });
  });

  describe('Price validation ranges', () => {
    const validationRanges = {
      gold: { min: 1500, max: 10000 },
      silver: { min: 15, max: 200 },
      platinum: { min: 500, max: 5000 },
      palladium: { min: 500, max: 5000 }
    };

    function isValidPrice(metal, price) {
      const range = validationRanges[metal];
      return price >= range.min && price <= range.max;
    }

    test('validates gold price range', () => {
      expect(isValidPrice('gold', 1500)).toBe(true);
      expect(isValidPrice('gold', 10000)).toBe(true);
      expect(isValidPrice('gold', 2650)).toBe(true);
      expect(isValidPrice('gold', 1499)).toBe(false);
      expect(isValidPrice('gold', 10001)).toBe(false);
    });

    test('validates silver price range', () => {
      expect(isValidPrice('silver', 15)).toBe(true);
      expect(isValidPrice('silver', 200)).toBe(true);
      expect(isValidPrice('silver', 30)).toBe(true);
      expect(isValidPrice('silver', 14)).toBe(false);
      expect(isValidPrice('silver', 201)).toBe(false);
    });

    test('validates platinum price range', () => {
      expect(isValidPrice('platinum', 500)).toBe(true);
      expect(isValidPrice('platinum', 5000)).toBe(true);
      expect(isValidPrice('platinum', 950)).toBe(true);
      expect(isValidPrice('platinum', 499)).toBe(false);
      expect(isValidPrice('platinum', 5001)).toBe(false);
    });

    test('validates palladium price range', () => {
      expect(isValidPrice('palladium', 500)).toBe(true);
      expect(isValidPrice('palladium', 5000)).toBe(true);
      expect(isValidPrice('palladium', 1100)).toBe(true);
      expect(isValidPrice('palladium', 499)).toBe(false);
      expect(isValidPrice('palladium', 5001)).toBe(false);
    });
  });
});

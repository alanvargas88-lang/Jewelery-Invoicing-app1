/**
 * Unit Tests: Calculation Functions
 * Tests for material pricing, discount calculations, and unit conversions
 */

describe('Calculation Functions', () => {
  // Mock settings state
  const mockSettings = {
    goldPrice: 4700,
    silverPrice: 95,
    platinumPrice: 2400,
    palladiumPrice: 1800,
    laborRate: 75
  };

  // Metal purity data as in app.js
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

  // Recreate calculateMaterialPrice as in app.js
  function calculateMaterialPrice(metal, unit, weight, includeFee, settings = mockSettings) {
    const basePrices = {
      'gold': settings.goldPrice,
      'silver': settings.silverPrice,
      'platinum': settings.platinumPrice,
      'palladium': settings.palladiumPrice
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

  // Discount calculation
  function calculateDiscount(subtotal, discountPercent) {
    return subtotal * (discountPercent / 100);
  }

  // Total calculation
  function calculateTotal(subtotal, discountPercent) {
    const discountAmount = calculateDiscount(subtotal, discountPercent);
    return subtotal - discountAmount;
  }

  describe('calculateMaterialPrice', () => {
    describe('Gold pricing', () => {
      test('calculates 24k gold at 1 oz', () => {
        const price = calculateMaterialPrice('gold-24k', 'oz', 1, false);
        expect(price).toBe(4700); // Full gold price
      });

      test('calculates 18k gold at 1 oz', () => {
        const price = calculateMaterialPrice('gold-18k', 'oz', 1, false);
        expect(price).toBe(4700 * 0.75); // 75% purity
      });

      test('calculates 14k gold at 1 oz', () => {
        const price = calculateMaterialPrice('gold-14k', 'oz', 1, false);
        expect(price).toBeCloseTo(4700 * 0.585, 2);
      });

      test('calculates 10k gold at 1 oz', () => {
        const price = calculateMaterialPrice('gold-10k', 'oz', 1, false);
        expect(price).toBeCloseTo(4700 * 0.417, 2);
      });
    });

    describe('Other metals pricing', () => {
      test('calculates silver at 1 oz', () => {
        const price = calculateMaterialPrice('silver', 'oz', 1, false);
        expect(price).toBeCloseTo(95 * 0.925, 2); // Sterling silver purity
      });

      test('calculates platinum at 1 oz', () => {
        const price = calculateMaterialPrice('platinum', 'oz', 1, false);
        expect(price).toBe(2400);
      });

      test('calculates palladium at 1 oz', () => {
        const price = calculateMaterialPrice('palladium', 'oz', 1, false);
        expect(price).toBe(1800);
      });
    });

    describe('Unit conversions', () => {
      test('converts dwt to oz (20 dwt = 1 oz)', () => {
        const priceOz = calculateMaterialPrice('gold-24k', 'oz', 1, false);
        const priceDwt = calculateMaterialPrice('gold-24k', 'dwt', 20, false);
        expect(priceDwt).toBeCloseTo(priceOz, 2);
      });

      test('converts grams to oz (31.1035 g = 1 oz)', () => {
        const priceOz = calculateMaterialPrice('gold-24k', 'oz', 1, false);
        const priceGrams = calculateMaterialPrice('gold-24k', 'grams', 31.1035, false);
        expect(priceGrams).toBeCloseTo(priceOz, 2);
      });

      test('handles fractional dwt', () => {
        const price = calculateMaterialPrice('gold-24k', 'dwt', 5, false);
        expect(price).toBeCloseTo(4700 * 0.25, 2); // 5/20 = 0.25 oz
      });

      test('handles fractional grams', () => {
        const price = calculateMaterialPrice('gold-24k', 'grams', 15.55175, false);
        expect(price).toBeCloseTo(4700 * 0.5, 2); // Half oz
      });
    });

    describe('Fee calculation', () => {
      test('adds 15% fee when includeFee is true', () => {
        const priceNoFee = calculateMaterialPrice('gold-24k', 'oz', 1, false);
        const priceWithFee = calculateMaterialPrice('gold-24k', 'oz', 1, true);
        expect(priceWithFee).toBeCloseTo(priceNoFee * 1.15, 2);
      });

      test('no fee when includeFee is false', () => {
        const price = calculateMaterialPrice('gold-24k', 'oz', 1, false);
        expect(price).toBe(4700);
      });
    });

    describe('Weight multiplier', () => {
      test('scales price with weight', () => {
        const price1oz = calculateMaterialPrice('gold-24k', 'oz', 1, false);
        const price2oz = calculateMaterialPrice('gold-24k', 'oz', 2, false);
        expect(price2oz).toBe(price1oz * 2);
      });

      test('handles decimal weights', () => {
        const price = calculateMaterialPrice('gold-24k', 'oz', 0.5, false);
        expect(price).toBe(4700 * 0.5);
      });
    });
  });

  describe('Discount calculations', () => {
    test('calculates 10% discount', () => {
      expect(calculateDiscount(100, 10)).toBe(10);
    });

    test('calculates 25% discount', () => {
      expect(calculateDiscount(200, 25)).toBe(50);
    });

    test('handles 0% discount', () => {
      expect(calculateDiscount(100, 0)).toBe(0);
    });

    test('handles 100% discount', () => {
      expect(calculateDiscount(100, 100)).toBe(100);
    });

    test('handles decimal percentages', () => {
      expect(calculateDiscount(100, 7.5)).toBe(7.5);
    });
  });

  describe('Total calculations', () => {
    test('calculates total with no discount', () => {
      expect(calculateTotal(100, 0)).toBe(100);
    });

    test('calculates total with 10% discount', () => {
      expect(calculateTotal(100, 10)).toBe(90);
    });

    test('calculates total with 50% discount', () => {
      expect(calculateTotal(200, 50)).toBe(100);
    });
  });

  describe('Labor calculations', () => {
    function calculateLabor(hours, rate = mockSettings.laborRate) {
      return hours * rate;
    }

    test('calculates labor at default rate', () => {
      expect(calculateLabor(1)).toBe(75);
      expect(calculateLabor(2)).toBe(150);
    });

    test('calculates labor with custom rate', () => {
      expect(calculateLabor(1, 100)).toBe(100);
      expect(calculateLabor(3, 50)).toBe(150);
    });

    test('handles fractional hours', () => {
      expect(calculateLabor(0.5)).toBe(37.5);
      expect(calculateLabor(1.5)).toBe(112.5);
    });
  });
});

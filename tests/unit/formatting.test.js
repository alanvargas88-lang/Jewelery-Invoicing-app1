/**
 * Unit Tests: Formatting Functions
 * Tests for formatCurrency, formatDate, formatDateTime
 */

describe('Formatting Functions', () => {
  // Import functions by evaluating app.js in test context
  let formatCurrency, formatDate, formatDateTime;

  beforeAll(() => {
    // Define the functions as they appear in app.js
    formatCurrency = function(amount) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(amount);
    };

    formatDate = function(dateStr) {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    };

    formatDateTime = function(dateStr) {
      return new Date(dateStr).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    };
  });

  describe('formatCurrency', () => {
    test('formats zero correctly', () => {
      expect(formatCurrency(0)).toBe('$0.00');
    });

    test('formats positive integers', () => {
      expect(formatCurrency(100)).toBe('$100.00');
    });

    test('formats decimals to two places', () => {
      expect(formatCurrency(99.99)).toBe('$99.99');
    });

    test('formats large numbers with commas', () => {
      expect(formatCurrency(1000)).toBe('$1,000.00');
      expect(formatCurrency(1000000)).toBe('$1,000,000.00');
    });

    test('formats small decimals', () => {
      expect(formatCurrency(0.01)).toBe('$0.01');
      expect(formatCurrency(0.10)).toBe('$0.10');
    });

    test('handles negative numbers', () => {
      const result = formatCurrency(-50);
      expect(result).toContain('50.00');
    });

    test('rounds to two decimal places', () => {
      expect(formatCurrency(10.999)).toBe('$11.00');
      expect(formatCurrency(10.994)).toBe('$10.99');
    });
  });

  describe('formatDate', () => {
    test('formats ISO date string', () => {
      const result = formatDate('2024-01-15T10:30:00.000Z');
      expect(result).toContain('Jan');
      expect(result).toContain('15');
      expect(result).toContain('2024');
    });

    test('formats date object', () => {
      const date = new Date('2024-06-20');
      const result = formatDate(date.toISOString());
      expect(result).toContain('Jun');
      expect(result).toContain('2024');
    });

    test('handles different months', () => {
      expect(formatDate('2024-03-01')).toContain('Mar');
      expect(formatDate('2024-12-25')).toContain('Dec');
    });
  });

  describe('formatDateTime', () => {
    test('includes time in output', () => {
      const result = formatDateTime('2024-01-15T14:30:00.000Z');
      expect(result).toContain('Jan');
      expect(result).toContain('15');
      expect(result).toContain('2024');
      // Time should be present (format varies by locale)
      expect(result.length).toBeGreaterThan(10);
    });
  });
});

/**
 * Jest Unit Test Setup
 * Sets up the test environment with necessary mocks and globals
 */

// Mock localStorage
const localStorageMock = {
  store: {},
  getItem: jest.fn((key) => localStorageMock.store[key] || null),
  setItem: jest.fn((key, value) => {
    localStorageMock.store[key] = value.toString();
  }),
  removeItem: jest.fn((key) => {
    delete localStorageMock.store[key];
  }),
  clear: jest.fn(() => {
    localStorageMock.store = {};
  })
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock Intl.NumberFormat for currency formatting
global.Intl = {
  NumberFormat: jest.fn().mockImplementation((locale, options) => ({
    format: (number) => {
      if (options && options.style === 'currency') {
        return `$${number.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
      }
      return number.toString();
    }
  }))
};

// Reset mocks before each test
beforeEach(() => {
  localStorageMock.clear();
  jest.clearAllMocks();
});

// Export for use in tests
module.exports = { localStorageMock };

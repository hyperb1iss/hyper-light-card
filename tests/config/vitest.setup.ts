// This file runs before tests to set up the test environment
import '@testing-library/jest-dom';

// Define global variables needed for the tests
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).__IS_LOGGING_ENABLED__ = false;

// Mock any global objects needed for tests
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Add any other global mocks or setup needed for tests

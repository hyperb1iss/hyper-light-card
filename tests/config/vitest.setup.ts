// This file runs before tests to set up the test environment
import '@testing-library/jest-dom';

(globalThis as { __IS_LOGGING_ENABLED__?: boolean }).__IS_LOGGING_ENABLED__ = false;

global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

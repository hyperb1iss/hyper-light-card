import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/config/vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
    mockReset: true,
    include: ['tests/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '../../src'),
      // Map CSS imports to mock
      '\\.css$': resolve(__dirname, '../../__mocks__/styleMock.js'),
      colorthief: resolve(__dirname, '../../__mocks__/colorthief.js'),
    },
  },
});

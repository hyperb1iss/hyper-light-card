import { fileURLToPath } from 'node:url';
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
      '@': fileURLToPath(new URL('../../src', import.meta.url)),
      // Map CSS imports to mock
      '\\.css$': fileURLToPath(new URL('../../__mocks__/styleMock.js', import.meta.url)),
      colorthief: fileURLToPath(new URL('../../__mocks__/colorthief.js', import.meta.url)),
    },
  },
});

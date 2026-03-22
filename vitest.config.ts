import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.test.ts', 'tests/unit/**/*.test.tsx'],
  },
  resolve: {
    alias: {
      '@': '/src',
      '@shared': '/src/shared',
      '@components': '/src/components',
      '@stores': '/src/stores',
      '@features': '/src/features',
      '@platforms': '/src/platforms',
    },
  },
});
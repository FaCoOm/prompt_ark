import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/tests/e2e/**',
      '**/*.spec.ts',
    ],
    include: [
      '**/tests/unit/**/*.test.ts',
      '**/tests/unit/**/*.spec.ts',
    ],
  },
});
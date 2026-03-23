import { defineConfig } from 'vitest/config';
import solidPlugin from 'vite-plugin-solid';

export default defineConfig({
  plugins: [solidPlugin() as any],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: [
      'tests/unit/**/*.test.ts',
      'tests/unit/**/*.test.tsx',
      'tests/integration/**/*.test.ts',
      'tests/integration/**/*.test.tsx',
      'src/**/*.test.ts',
      'src/**/*.test.tsx',
    ],
    deps: {
      inline: [/solid-js/, /@solidjs\/testing-library/, /zustand/],
    },
  },
  resolve: {
    conditions: ['development', 'browser'],
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
      '@shared': new URL('./src/shared', import.meta.url).pathname,
      '@components': new URL('./src/components', import.meta.url).pathname,
      '@stores': new URL('./src/stores', import.meta.url).pathname,
      '@features': new URL('./src/features', import.meta.url).pathname,
      '@platforms': new URL('./src/platforms', import.meta.url).pathname,
      '../../../../../lib/marked.min.js': new URL('./tests/mocks/marked-mock.js', import.meta.url)
        .pathname,
    },
  },
  ssr: {
    resolve: {
      conditions: ['development', 'browser'],
    },
  },
});

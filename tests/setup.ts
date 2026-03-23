import '@testing-library/jest-dom';
import { vi } from 'vitest';

Object.defineProperty(global, 'chrome', {
  value: {
    runtime: {
      sendMessage: vi.fn(),
      onMessage: { addListener: vi.fn() },
      getManifest: vi.fn(() => ({ version: '1.0.0' })),
    },
    storage: {
      local: {
        get: vi.fn(),
        set: vi.fn(),
        remove: vi.fn(),
      },
      sync: {
        get: vi.fn(),
        set: vi.fn(),
      },
    },
    tabs: {
      query: vi.fn(),
      sendMessage: vi.fn(),
    },
    sidePanel: {
      setPanelBehavior: vi.fn(),
    },
  },
  writable: true,
});

Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'test-uuid-1234'),
  },
});

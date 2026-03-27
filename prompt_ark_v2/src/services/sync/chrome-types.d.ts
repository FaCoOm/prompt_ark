/**
 * Minimal Chrome extension API type declarations
 * WXT provides full types at build time via .wxt/wxt.d.ts
 */

interface ChromeStorageArea {
  get(keys: string | string[] | null): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
  remove(keys: string | string[]): Promise<void>;
  getBytesInUse(keys: string | string[] | null): Promise<number>;
}

interface ChromeStorage {
  sync: ChromeStorageArea;
  local: ChromeStorageArea;
}

interface ChromeRuntime {
  sendMessage(message: unknown): Promise<unknown>;
}

interface Chrome {
  storage: ChromeStorage;
  runtime: ChromeRuntime;
}

declare const chrome: Chrome | undefined;

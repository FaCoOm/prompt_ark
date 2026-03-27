/**
 * @fileoverview LocalStorage operations for Prompt Ark v2
 *
 * Thin wrapper around WXT storage for local storage operations.
 * Local storage is the source of truth for prompt data.
 */

import { storage } from 'wxt/utils/storage';

/**
 * LocalStorage wrapper for consistent API
 * Uses WXT storage with 'local:' prefix for Chrome local storage
 */
export const LocalStorage = {
  /**
   * Get a value from local storage
   * @param key - Storage key
   * @returns The stored value or null if not found
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      return await storage.getItem<T>(`local:${key}`);
    } catch (error) {
      console.error(`[LocalStorage] Failed to get ${key}:`, error);
      return null;
    }
  },

  /**
   * Set a value in local storage
   * @param key - Storage key
   * @param value - Value to store
   */
  async set<T>(key: string, value: T): Promise<void> {
    try {
      await storage.setItem<T>(`local:${key}`, value);
    } catch (error) {
      console.error(`[LocalStorage] Failed to set ${key}:`, error);
      throw error;
    }
  },

  /**
   * Remove a value from local storage
   * @param key - Storage key to remove
   */
  async remove(key: string): Promise<void> {
    try {
      await storage.removeItem(`local:${key}`);
    } catch (error) {
      console.error(`[LocalStorage] Failed to remove ${key}:`, error);
      throw error;
    }
  },

  /**
   * Get multiple values from local storage
   * @param keys - Array of storage keys
   * @returns Object with key-value pairs
   */
  async getMany<T extends Record<string, unknown>>(
    keys: string[]
  ): Promise<Partial<T>> {
    const result: Partial<T> = {};
    for (const key of keys) {
      const value = await this.get<T[Extract<keyof T, string>]>(key);
      if (value !== null) {
        (result as Record<string, unknown>)[key] = value;
      }
    }
    return result;
  },

  /**
   * Set multiple values in local storage
   * @param items - Object with key-value pairs
   */
  async setMany<T extends Record<string, unknown>>(
    items: Partial<T>
  ): Promise<void> {
    const entries = Object.entries(items);
    for (const [key, value] of entries) {
      await this.set(key, value);
    }
  },

  /**
   * Remove multiple values from local storage
   * @param keys - Array of storage keys to remove
   */
  async removeMany(keys: string[]): Promise<void> {
    for (const key of keys) {
      await this.remove(key);
    }
  },

  /**
   * Get all keys in local storage (use with caution - expensive operation)
   * @returns Array of all storage keys
   */
  async keys(): Promise<string[]> {
    // WXT storage doesn't expose direct key enumeration
    // This is a limitation - returns empty array for now
    return [];
  },

  /**
   * Clear all local storage (use with extreme caution)
   */
  async clear(): Promise<void> {
    // WXT storage doesn't expose direct clear
    // Individual removal would require knowing all keys
    console.warn('[LocalStorage] Clear operation not supported by WXT storage');
  },
};

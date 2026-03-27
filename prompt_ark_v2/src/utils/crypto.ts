import { browser } from 'wxt/browser';

/**
 * @fileoverview Web Crypto API encryption utilities for API key protection.
 *
 * Uses AES-256-GCM with random IV for each encryption operation.
 * Keys are generated once per installation and stored in browser.storage.local.
 *
 * Security features:
 * - AES-256-GCM authenticated encryption
 * - Random 96-bit IV for each encryption
 * - Key cached in memory for session lifetime
 * - Graceful degradation on failures (returns plaintext)
 *
 * @module utils/crypto
 */

const ALGO = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits, standard for GCM

/** Cached encryption key for session lifetime */
let _cachedKey: CryptoKey | null = null;

/**
 * Generate or load the encryption key.
 *
 * On first install: generates a 256-bit AES-GCM key and stores in browser.storage.local.
 * Subsequent calls: loads existing key from storage.
 * Key is cached in memory for the session lifetime.
 * 
 * @returns Promise resolving to the CryptoKey
 * @throws May throw if key generation or storage fails
 * 
 * @example
 * ```typescript
 * const key = await generateOrLoadKey();
 * // Key is now ready for encrypt/decrypt operations
 * ```
 */
export async function generateOrLoadKey(): Promise<CryptoKey> {
  if (_cachedKey) return _cachedKey;

  const stored = await browser.storage.local.get('_encKey');
  if (stored._encKey) {
    // Import existing key
    const keyBytes = Uint8Array.from(atob(stored._encKey as string), c => c.charCodeAt(0));
    _cachedKey = await crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: ALGO },
      true, // extractable — consistent with generateKey
      ['encrypt', 'decrypt']
    );
    return _cachedKey;
  }

  // Generate new key
  _cachedKey = await crypto.subtle.generateKey(
    { name: ALGO, length: KEY_LENGTH },
    true, // extractable — required for exportKey() to persist in storage
    ['encrypt', 'decrypt']
  );

  // Export and store
  const exported = await crypto.subtle.exportKey('raw', _cachedKey);
  const base64 = btoa(String.fromCharCode(...new Uint8Array(exported)));
  await browser.storage.local.set({ _encKey: base64 });

  console.log('[crypto] Generated new encryption key');
  return _cachedKey;
}

/**
 * Encrypt plaintext using AES-256-GCM.
 * 
 * Returns base64 string containing: IV (12 bytes) + ciphertext.
 * Uses a random IV for each encryption operation.
 * 
 * @param plaintext - The string to encrypt
 * @returns Base64-encoded IV+ciphertext, or plaintext if encryption fails
 * 
 * @example
 * ```typescript
 * const encrypted = await encrypt('my-secret-api-key');
 * // Returns: 'base64-encoded-iv-plus-ciphertext...'
 * ```
 */
export async function encrypt(plaintext: string): Promise<string> {
  if (!plaintext) return plaintext;

  try {
    const key = await generateOrLoadKey();
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const encoded = new TextEncoder().encode(plaintext);

    const ciphertext = await crypto.subtle.encrypt(
      { name: ALGO, iv },
      key,
      encoded
    );

    // Combine IV + ciphertext, encode as base64
    const combined = new Uint8Array([...iv, ...new Uint8Array(ciphertext)]);
    return btoa(String.fromCharCode(...combined));
  } catch (e) {
    console.warn('[crypto] Encryption failed, storing as plaintext:', (e as Error).message);
    return plaintext; // Graceful degradation
  }
}

/**
 * Decrypt AES-256-GCM encrypted data.
 * 
 * Expects base64 string containing: IV (12 bytes) + ciphertext.
 * Returns plaintext string, or empty string on failure.
 * Backward compatible: returns value as-is if not encrypted.
 * 
 * @param encryptedBase64 - The base64-encoded encrypted data
 * @returns Decrypted plaintext, empty string on failure, or original value if not encrypted
 * 
 * @example
 * ```typescript
 * const decrypted = await decrypt('base64-encoded-data...');
 * // Returns: 'my-secret-api-key'
 * 
 * // Backward compatible with plaintext
 * const plain = await decrypt('not-encrypted');
 * // Returns: 'not-encrypted'
 * ```
 */
export async function decrypt(encryptedBase64: string): Promise<string> {
  if (!encryptedBase64) return encryptedBase64;

  // Backward compatibility: detect plaintext (not valid base64 IV+ciphertext)
  if (!isEncrypted(encryptedBase64)) {
    return encryptedBase64; // Return as-is (plaintext from before encryption was added)
  }

  try {
    const key = await generateOrLoadKey();
    const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));

    // Split IV and ciphertext
    const iv = combined.slice(0, IV_LENGTH);
    const ciphertext = combined.slice(IV_LENGTH);

    const decrypted = await crypto.subtle.decrypt(
      { name: ALGO, iv },
      key,
      ciphertext
    );

    return new TextDecoder().decode(decrypted);
  } catch (e) {
    console.warn('[crypto] Decryption failed:', (e as Error).message);
    return ''; // Never throw — graceful degradation
  }
}

/**
 * Detect if a string is encrypted (base64 IV+ciphertext format).
 * 
 * Heuristic checks:
 * - Valid base64 encoding
 * - Minimum length for 12-byte IV + 1-byte ciphertext (~18 base64 chars)
 * - Successfully decodes to at least 13 bytes
 * 
 * @param value - The string to check
 * @returns True if the value appears to be encrypted
 * 
 * @example
 * ```typescript
 * isEncrypted('short'); // false (too short)
 * isEncrypted('not-base64!!!'); // false (invalid base64)
 * isEncrypted('YWFhYWFhYWFhYWFhYWFhYQ=='); // true (valid format)
 * ```
 */
export function isEncrypted(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  // Minimum length: 12 bytes IV + 1 byte ciphertext = 13 bytes → ~18 base64 chars
  if (value.length < 18) return false;
  // Check if valid base64
  try {
    const decoded = atob(value);
    // Must be at least 13 bytes (IV + min ciphertext)
    return decoded.length >= IV_LENGTH + 1;
  } catch {
    return false;
  }
}

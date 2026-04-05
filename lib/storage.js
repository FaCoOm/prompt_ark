// storage.js - Unified storage abstraction layer
import LZString from './lz-string.min.js';
import { WebDAVClient } from './webdav-client.js';
import { markdownToPrompt, parseFrontmatter, promptToMarkdown, promptToFilename } from './frontmatter.js';
import { normalizePromptForStorage } from './taxonomy.js';

const webdavClient = new WebDAVClient();

// Architecture: Dual-layer storage for scalability
//   Sync: slim prompt data (core fields only) - cross-device sync
//   Local: full data (versions, usage stats) + sensitive config (API keys)
//
// Capacity analysis:
//   - chrome.storage.sync: 100KB total, 8KB/key, 512 keys max
//   - Slim prompt (no versions): ~300-500 bytes → 200-300 prompts
//   - Full prompt (with 20 versions): ~2-5KB → only 20-50 prompts
//   - Solution: sync = slim, local = full, merge on read

// chrome.storage.sync limits:
//   QUOTA_BYTES_PER_ITEM = 8192 (key length + JSON.stringify(value) in bytes)
//   QUOTA_BYTES = 102400 (total)
//   MAX_ITEMS = 512
// Chunk budget: 8192 - max_key_length(~15) - JSON_quotes(2) - margin(175) = ~6000
const MAX_CHUNK_BYTES = 6000;
const SYNC_QUOTA_BYTES = 102400;
const DEBOUNCE_MS = 500;

// Fields that are synced cross-device (per-prompt key, chunked if > 8KB)
const SYNC_FIELDS = [
    'id', 'title', 'content', 'tags', 'shortcut', 'variables', 'favorite',
    'createdAt', 'updatedAt', 'output_modality', 'category_type', 'category_key',
    'ai_category_type', 'ai_category_key', 'ai_category_confidence',
    'classification_confidence', 'needs_category_review', 'needs_output_modality_review',
    'output_modality_locked', 'skip_async_enrich'
];

const _encoder = new TextEncoder();

// Fields that stay local-only (device-specific or large)
// versions, usageCount, lastUsedAt, pendingPrompt, providers, etc.

// --- Debounce utility ---
const _debounceTimers = {};
function debounce(key, fn, ms = DEBOUNCE_MS) {
    return new Promise((resolve, reject) => {
        clearTimeout(_debounceTimers[key]);
        _debounceTimers[key] = setTimeout(() => {
            fn().then(resolve).catch(reject);
        }, ms);
    });
}

// --- Sync Manager (Strategy Router) ---
export const SyncManager = {
    backend: 'none', // 'none' | 'webdav' | 'obsidian'
    _configPromise: null, // Tracks loadConfig() completion to prevent race conditions
    token: '',
    webdavUrl: '',
    webdavUser: '',
    webdavPassword: '',
    // Obsidian Vault sync via WebDAV (individual .md files with frontmatter)
    obsidianWebdavUrl: '',
    obsidianWebdavUser: '',
    obsidianWebdavPassword: '',
    obsidianFolder: 'prompts', // subfolder within the WebDAV-exposed vault

    async loadConfig() {
        const local = await chrome.storage.local.get([
            'sync_backend', 'githubToken',
            'webdavUrl', 'webdavUser', 'webdavPassword',
            'obsidianWebdavUrl', 'obsidianWebdavUser', 'obsidianWebdavPassword', 'obsidianFolder'
        ]);

        // Migration: Chrome Sync backend removed, fall back to local-only
        if (local.sync_backend === 'chrome') {
            await chrome.storage.local.set({ sync_backend: 'none' });
            this.backend = 'none';
        } else {
            this.backend = local.sync_backend || 'none';
        }
        this.token = local.githubToken || '';
        this.webdavUrl = local.webdavUrl || '';
        this.webdavUser = local.webdavUser || '';
        this.webdavPassword = local.webdavPassword || '';
        this.obsidianWebdavUrl = local.obsidianWebdavUrl || '';
        this.obsidianWebdavUser = local.obsidianWebdavUser || '';
        this.obsidianWebdavPassword = local.obsidianWebdavPassword || '';
        this.obsidianFolder = local.obsidianFolder || 'prompts';
    },

    /** Await this before any storage operation to guarantee config is loaded. */
    async ready() {
        if (this._configPromise) await this._configPromise;
    },

    // --- WebDAV Integration ---
    async triggerWebdavSync() {
        if (this.backend !== 'webdav' || !this.webdavUrl || !this.webdavUser || !this.webdavPassword) return;

        return debounce('webdav_sync_upload', async () => {
            try {
                // Collect local state
                const promptsRaw = await chrome.storage.local.get('prompts');
                const prompts = promptsRaw.prompts || [];
                const slimPrompts = prompts.map(toSlimPrompt);

                const payload = { prompts: slimPrompts };
                const compressed = compressForSync(JSON.stringify(payload));

                await webdavClient.putFile(this.webdavUrl, this.webdavUser, this.webdavPassword, 'prompt_ark_sync.json', compressed);
                console.log('[SyncManager] WebDAV sync successful');
            } catch (e) {
                console.error('[SyncManager] WebDAV sync failed:', e);
            }
        }, 2000); // 2 second debounce
    },

    async pullFromWebdavAndMerge() {
        if (this.backend !== 'webdav') throw new Error('ERR_WEBDAV_NOT_ENABLED');
        if (!this.webdavUrl || !this.webdavUser || !this.webdavPassword) {
            throw new Error('ERR_WEBDAV_MISSING_CONFIG');
        }

        let content = '';
        try {
            content = await webdavClient.getFile(this.webdavUrl, this.webdavUser, this.webdavPassword, 'prompt_ark_sync.json');
        } catch (e) {
            if (e.message.includes('FILE_NOT_FOUND')) {
                console.log('[SyncManager] WebDAV file not found. Initializing new file...');
                this.triggerWebdavSync();
                throw new Error('ERR_WEBDAV_EMPTY_AUTO_CREATE');
            }
            throw e;
        }

        const json = decompressFromSync(content);
        let payload;
        try {
            payload = JSON.parse(json);
        } catch (e) {
            throw new Error('ERR_WEBDAV_PARSE_FAILED');
        }


        // Merge Prompts
        if (payload.prompts && payload.prompts.length > 0) {
            const localPrompts = await chrome.storage.local.get('prompts').then(r => r.prompts || []);
            const merged = mergePrompts(payload.prompts, localPrompts);
            await chrome.storage.local.set({ 'prompts': merged });
        }

        console.log('[SyncManager] Successfully pulled and merged from WebDAV');
        return { message: 'MSG_WEBDAV_SYNC_SUCCESS' };
    },

    // --- Obsidian Vault Integration ---
    // Unlike the blob-based sync backends, 
    // Obsidian sync reads/writes individual .md files with YAML frontmatter.

    _getObsidianUrl() {
        let base = this.obsidianWebdavUrl.trim();
        if (!base.endsWith('/')) base += '/';
        const folder = this.obsidianFolder.trim().replace(/^\/+|\/+$/g, '');
        return folder ? `${base}${folder}/` : base;
    },

    async _pruneObsidianManagedFiles(url, prompts) {
        const files = await webdavClient.listMarkdownFiles(url, this.obsidianWebdavUser, this.obsidianWebdavPassword);
        const desiredFilenameById = new Map();
        const desiredFilenames = new Set();

        for (const prompt of prompts) {
            if (!prompt?.id) continue;
            const filename = promptToFilename(prompt);
            desiredFilenameById.set(prompt.id, filename);
            desiredFilenames.add(filename);
        }

        for (const file of files) {
            if (desiredFilenames.has(file.name)) continue;

            try {
                const content = await webdavClient.getFile(url, this.obsidianWebdavUser, this.obsidianWebdavPassword, file.name);
                const { meta } = parseFrontmatter(content);
                const remoteId = meta?.prompt_ark_id;

                // Only delete files that are clearly managed by Prompt Ark.
                if (!remoteId) continue;

                const desiredFilename = desiredFilenameById.get(remoteId);
                if (!desiredFilename || desiredFilename !== file.name) {
                    await webdavClient.deleteFile(url, this.obsidianWebdavUser, this.obsidianWebdavPassword, file.name);
                    console.log(`[SyncManager] Obsidian sync pruned stale file: ${file.name}`);
                }
            } catch (e) {
                console.warn(`[SyncManager] Failed to inspect ${file.name} before prune:`, e.message);
            }
        }
    },

    async triggerObsidianSync() {
        if (this.backend !== 'obsidian') return;
        if (!this.obsidianWebdavUrl || !this.obsidianWebdavUser || !this.obsidianWebdavPassword) return;

        return debounce('obsidian_sync_upload', async () => {
            try {
                const prompts = await chrome.storage.local.get('prompts').then(r => r.prompts || []);
                const url = this._getObsidianUrl();

                try {
                    await this._pruneObsidianManagedFiles(url, prompts);
                } catch (e) {
                    if (!e.message.includes('ERR_WEBDAV_DIR_NOT_FOUND')) {
                        throw e;
                    }
                }

                for (const prompt of prompts) {
                    const filename = promptToFilename(prompt);
                    const markdown = await promptToMarkdown(prompt);
                    await webdavClient.putMarkdownFile(url, this.obsidianWebdavUser, this.obsidianWebdavPassword, filename, markdown);
                }
                console.log(`[SyncManager] Obsidian sync pushed ${prompts.length} prompts`);
            } catch (e) {
                console.error('[SyncManager] Obsidian sync failed:', e);
            }
        }, 3000); // 3 second debounce (more files = more time)
    },

    async pullFromObsidianAndMerge() {
        if (this.backend !== 'obsidian') throw new Error('ERR_OBSIDIAN_NOT_ENABLED');
        if (!this.obsidianWebdavUrl || !this.obsidianWebdavUser || !this.obsidianWebdavPassword) {
            throw new Error('ERR_OBSIDIAN_MISSING_CONFIG');
        }

        const url = this._getObsidianUrl();

        // Step 1: List all .md files in the vault folder
        let files;
        try {
            files = await webdavClient.listMarkdownFiles(url, this.obsidianWebdavUser, this.obsidianWebdavPassword);
        } catch (e) {
            if (e.message.includes('DIR_NOT_FOUND')) {
                console.log('[SyncManager] Obsidian folder not found. Creating and pushing local prompts...');
                await this.triggerObsidianSync();
                throw new Error('ERR_OBSIDIAN_DIR_NOT_FOUND_AUTO_CREATE');
            }
            throw e;
        }

        if (files.length === 0) {
            console.log('[SyncManager] Obsidian folder is empty. Pushing local prompts...');
            await this.triggerObsidianSync();
            return { message: 'MSG_OBSIDIAN_EMPTY_PUSHED' };
        }

        // Step 2: Download and parse each .md file
        const vaultPrompts = [];
        for (const file of files) {
            try {
                const content = await webdavClient.getFile(url, this.obsidianWebdavUser, this.obsidianWebdavPassword, file.name);
                const prompt = markdownToPrompt(content, file.name);
                vaultPrompts.push(prompt);
            } catch (e) {
                console.warn(`[SyncManager] Failed to read ${file.name}:`, e.message);
            }
        }

        // Step 3: Merge vault prompts with local prompts
        const localPrompts = await chrome.storage.local.get('prompts').then(r => r.prompts || []);
        const merged = this._mergeObsidianPrompts(vaultPrompts, localPrompts);
        const { prompts: normalizedPrompts } = await normalizePromptsForStorage(merged);
        await chrome.storage.local.set({ prompts: normalizedPrompts });

        console.log(`[SyncManager] Obsidian sync: ${vaultPrompts.length} vault files, ${normalizedPrompts.length} total after merge`);
        return { message: 'MSG_OBSIDIAN_SYNC_SUCCESS' };
    },

    /**
     * Merge vault prompts with local prompts.
     * Matching strategy: prompt_ark_id (if present in frontmatter) > title match > new.
     */
    _mergeObsidianPrompts(vaultPrompts, localPrompts) {
        const localById = new Map(localPrompts.map(p => [p.id, p]));
        const localByTitle = new Map(localPrompts.map(p => [p.title?.toLowerCase(), p]));
        const merged = [];
        const seenIds = new Set();

        for (const vp of vaultPrompts) {
            let local = null;

            // Match by prompt_ark_id (highest priority)
            if (vp.id && localById.has(vp.id)) {
                local = localById.get(vp.id);
            }
            // Match by title (fuzzy merge for first-time sync)
            else if (vp.title && localByTitle.has(vp.title.toLowerCase())) {
                local = localByTitle.get(vp.title.toLowerCase());
            }

            if (local) {
                seenIds.add(local.id);
                merged.push({
                    ...local,
                    title: vp.title || local.title,
                    content: vp.content || local.content,
                    category: vp.category || local.category,
                    category_type: vp.category_type || local.category_type || '',
                    category_key: vp.category_key || local.category_key || '',
                    output_modality: vp.output_modality || local.output_modality || '',
                    classification_confidence: vp.classification_confidence ?? local.classification_confidence,
                    tags: vp.tags?.length ? vp.tags : local.tags,
                    favorite: vp.favorite || local.favorite,
                    shortcut: vp.shortcut || local.shortcut,
                    variables: vp.variables?.length ? vp.variables : local.variables,
                });
            } else {
                // New prompt from vault
                merged.push({
                    ...vp,
                    id: vp.id || crypto.randomUUID(),
                    versions: [],
                    usageCount: 0,
                    lastUsedAt: null,
                    createdAt: Date.now(),
                });
            }
        }

        // Keep local-only prompts that weren't in vault
        for (const lp of localPrompts) {
            if (!seenIds.has(lp.id)) {
                merged.push(lp);
            }
        }

        return merged;
    },

};
// Initialize config — store the promise so ready() can await it
SyncManager._configPromise = SyncManager.loadConfig();

/**
 * Strip a prompt to sync-safe fields only.
 * Removes versions, usage stats, and other large/device-specific data.
 */
function toSlimPrompt(prompt) {
    const slim = {};
    for (const field of SYNC_FIELDS) {
        if (prompt[field] !== undefined) {
            slim[field] = prompt[field];
        }
    }
    return slim;
}

/**
 * Utilities for LZ-String compression
 */
function compressForSync(jsonStr) {
    return 'lz::' + LZString.compressToUTF16(jsonStr);
}

function decompressFromSync(str) {
    if (typeof str === 'string' && str.startsWith('lz::')) {
        return LZString.decompressFromUTF16(str.slice(4));
    }
    return str; // Legacy uncompressed payload
}

/**
 * Merge synced slim data with local full data.
 * Sync is the source of truth for core fields; local supplements with versions/usage.
 */
function mergePrompts(syncPrompts, localPrompts) {
    if (!syncPrompts || syncPrompts.length === 0) return localPrompts || [];
    if (!localPrompts || localPrompts.length === 0) return syncPrompts;

    const localMap = new Map(localPrompts.map(p => [p.id, p]));
    const merged = [];

    for (const sp of syncPrompts) {
        const local = localMap.get(sp.id);
        if (local) {
            // Merge: sync core fields + local-only fields
            merged.push(normalizePromptUsage({
                ...sp,
                versions: local.versions || [],
                usageCount: local.usageCount || 0,
                lastUsedAt: local.lastUsedAt || null,
                lastUsed: local.lastUsed || null,
            }));
            localMap.delete(sp.id);
        } else {
            // New from sync (another device), no local data yet
            merged.push(normalizePromptUsage({
                ...sp,
                versions: [],
                usageCount: 0,
                lastUsedAt: null,
                lastUsed: null,
            }));
        }
    }

    // Local-only prompts not in sync (shouldn't normally happen, but handle gracefully)
    // These will get synced on next write
    for (const local of localMap.values()) {
        merged.push(normalizePromptUsage(local));
    }

    return merged;
}

function normalizePromptUsage(prompt) {
    const usageCount = Number(prompt?.usageCount || 0);
    const legacyUsed = prompt?.lastUsed || null;
    const normalizedUsedAt = prompt?.lastUsedAt || (usageCount > 0 ? legacyUsed : null);
    return {
        ...prompt,
        usageCount,
        lastUsedAt: normalizedUsedAt || null,
        lastUsed: normalizedUsedAt || null,
    };
}

async function normalizePromptsForStorage(prompts = []) {
    let changed = false;
    const normalized = [];

    for (const prompt of prompts) {
        const nextPrompt = await normalizePromptForStorage(prompt);
        normalized.push(nextPrompt);
        if (JSON.stringify(nextPrompt) !== JSON.stringify(prompt)) {
            changed = true;
        }
    }

    return { prompts: normalized, changed };
}


// --- Chunked Sync Storage ---
export const SyncStorage = {
    /**
     * Read a chunked value from sync storage.
     * Handles both legacy (single-key) and chunked (multi-key) formats.
     */
    async get(key) {
        if (SyncManager.backend === 'none' || SyncManager.backend === 'webdav' || SyncManager.backend === 'obsidian') {
            const cacheKey = `_synccache_${key}`;
            const legacyKey = `_gist_${key}`;
            const local = await chrome.storage.local.get([cacheKey, legacyKey]);
            return local[cacheKey] ?? local[legacyKey] ?? null;
        }

        try {
            // First check for chunk metadata
            const metaKey = `${key}_meta`;
            const metaResult = await chrome.storage.sync.get(metaKey);

            if (metaResult[metaKey]) {
                // Chunked format: reassemble
                const { totalChunks } = metaResult[metaKey];
                const chunkKeys = Array.from({ length: totalChunks }, (_, i) => `${key}_${i}`);
                const chunks = await chrome.storage.sync.get(chunkKeys);

                let payload = '';
                for (let i = 0; i < totalChunks; i++) {
                    const chunk = chunks[`${key}_${i}`];
                    if (chunk === undefined) {
                        console.warn(`SyncStorage: missing chunk ${key}_${i}`);
                        return null;
                    }
                    payload += chunk;
                }
                const json = decompressFromSync(payload);
                return JSON.parse(json);
            }

            // Legacy single-key format
            const result = await chrome.storage.sync.get(key);
            if (result[key]) {
                const payload = result[key];
                if (typeof payload === 'string' && payload.startsWith('lz::')) {
                    return JSON.parse(decompressFromSync(payload));
                }
                return payload;
            }
            return null;
        } catch (e) {
            console.error(`SyncStorage.get(${key}) failed:`, e);
            // Fallback: try local storage
            const local = await chrome.storage.local.get(key);
            return local[key] ?? null;
        }
    },

    /**
     * Write a value to sync storage with automatic byte-safe chunking.
     * Each chunk is guaranteed to fit within QUOTA_BYTES_PER_ITEM (8192 bytes).
     * Falls back to local if total sync quota exceeded.
     */
    async set(key, value) {
        if (SyncManager.backend === 'none' || SyncManager.backend === 'webdav' || SyncManager.backend === 'obsidian') {
            await chrome.storage.local.set({ [`_synccache_${key}`]: value });
            if (SyncManager.backend === 'webdav') await SyncManager.triggerWebdavSync();
            if (SyncManager.backend === 'obsidian') await SyncManager.triggerObsidianSync();
            return { synced: true, bytesUsed: 0 };
        }

        const json = JSON.stringify(value);
        const payload = compressForSync(json);
        const byteSize = _encoder.encode(payload).length;

        // Check total quota
        const bytesInUse = await chrome.storage.sync.getBytesInUse(null);
        const oldBytes = await this._getKeyBytes(key);
        const projected = bytesInUse - oldBytes + byteSize + 200;

        if (projected > SYNC_QUOTA_BYTES) {
            console.warn(`SyncStorage: quota exceeded (${projected}/${SYNC_QUOTA_BYTES} bytes). Falling back to local.`);
            // Clean up old chunks before falling back (prevent orphaned keys)
            try { await this._removeChunks(key); } catch {}
            await chrome.storage.local.set({ [key]: value });
            return { synced: false, reason: 'QUOTA_EXCEEDED', bytesUsed: projected };
        }

        // Clean up old chunks first
        await this._removeChunks(key);

        // Byte-safe chunking (handles multibyte chars like CJK)
        const chunks = this._chunkByBytes(payload);

        if (chunks.length === 1) {
            // Fits in a single key
            await chrome.storage.sync.set({ [key]: payload });
            return { synced: true, bytesUsed: byteSize };
        }

        // Write metadata + string chunks
        const metaKey = `${key}_meta`;
        const writeData = { [metaKey]: { totalChunks: chunks.length } };
        chunks.forEach((chunk, i) => {
            writeData[`${key}_${i}`] = chunk;
        });

        await chrome.storage.sync.set(writeData);
        console.log(`SyncStorage: wrote ${key} in ${chunks.length} chunks (${byteSize} bytes)`);
        return { synced: true, bytesUsed: byteSize, chunks: chunks.length };
    },

    /**
     * Debounced write - prevents hitting the 1800 writes/hour limit.
     */
    async setDebounced(key, value) {
        return debounce(`sync_${key}`, () => this.set(key, value));
    },

    /**
     * Get current sync storage usage info.
     */
    async getUsage() {
        const bytesInUse = await chrome.storage.sync.getBytesInUse(null);
        return {
            bytesInUse,
            quotaBytes: SYNC_QUOTA_BYTES,
            percentUsed: Math.round((bytesInUse / SYNC_QUOTA_BYTES) * 100),
        };
    },

    // --- Internal helpers ---

    /**
     * Split a JSON string into chunks where each chunk's UTF-8 byte length ≤ MAX_CHUNK_BYTES.
     * Uses binary search to handle multibyte characters (CJK = 3 bytes/char in UTF-8).
     */
    _chunkByBytes(json) {
        const totalBytes = _encoder.encode(json).length;
        if (totalBytes <= MAX_CHUNK_BYTES) return [json];

        const chunks = [];
        let pos = 0;

        while (pos < json.length) {
            if (pos + 1 >= json.length) {
                chunks.push(json.slice(pos));
                break;
            }

            // Binary search for max character end position fitting in MAX_CHUNK_BYTES
            let lo = pos + 1;
            let hi = Math.min(pos + MAX_CHUNK_BYTES, json.length); // Upper bound (all ASCII best case)

            while (lo < hi) {
                const mid = Math.ceil((lo + hi) / 2);
                if (_encoder.encode(json.slice(pos, mid)).length <= MAX_CHUNK_BYTES) {
                    lo = mid;
                } else {
                    hi = mid - 1;
                }
            }

            chunks.push(json.slice(pos, lo));
            pos = lo;
        }

        return chunks;
    },

    async _getKeyBytes(key) {
        try {
            const metaKey = `${key}_meta`;
            const metaResult = await chrome.storage.sync.get(metaKey);

            if (metaResult[metaKey]) {
                const { totalChunks } = metaResult[metaKey];
                const chunkKeys = [metaKey, ...Array.from({ length: totalChunks }, (_, i) => `${key}_${i}`)];
                return await chrome.storage.sync.getBytesInUse(chunkKeys);
            }

            return await chrome.storage.sync.getBytesInUse(key);
        } catch {
            return 0;
        }
    },

    async _removeChunks(key) {
        try {
            const metaKey = `${key}_meta`;
            const metaResult = await chrome.storage.sync.get(metaKey);

            const keysToRemove = [key, metaKey]; // Always try removing single-key format too

            if (metaResult[metaKey]) {
                const { totalChunks } = metaResult[metaKey];
                for (let i = 0; i < totalChunks; i++) {
                    keysToRemove.push(`${key}_${i}`);
                }
            }

            await chrome.storage.sync.remove(keysToRemove);
        } catch {
            // Ignore cleanup errors
        }
    },
};


// --- Local Storage (thin wrapper for consistency) ---
export const LocalStorage = {
    async get(key) {
        const result = await chrome.storage.local.get(key);
        return result[key] ?? null;
    },

    async set(key, value) {
        await chrome.storage.local.set({ [key]: value });
    },

    async remove(key) {
        await chrome.storage.local.remove(key);
    },
};


// --- PromptStorage: Per-key sync with auto-chunking for large content ---
// Sync layout:
//   p_index         → [id1, id2, ...]
//   p_${id}         → slim prompt (if < 8KB, includes content)
//   p_${id}_c1..cN  → content overflow chunks (only for large prompts)
// Each key must be < 8,192 bytes (QUOTA_BYTES_PER_ITEM)
const P_INDEX = 'p_index';
const P_PREFIX = 'p_';
const MAX_ITEM_BYTES = 8192;
const SAFE_ITEM_BYTES = 7500; // leave headroom for JSON overhead

function syncKey(id) { return P_PREFIX + id; }
function contentChunkKey(id, n) { return `${P_PREFIX}${id}_c${n}`; }

/**
 * Write a single prompt to sync. Auto-chunks content if > 8KB per key.
 * If total quota exceeded, falls back to metadata-only (no content in sync).
 * Content is always safe in local storage regardless.
 */
async function writeSyncPrompt(prompt) {
    if (SyncManager.backend === 'none') return [];
    if (SyncManager.backend === 'webdav') {
        return SyncManager.triggerWebdavSync();
    }
    if (SyncManager.backend === 'obsidian') {
        return SyncManager.triggerObsidianSync();
    }

    const slim = toSlimPrompt(prompt);
    const json = JSON.stringify(slim);
    const payload = compressForSync(json);
    const bytes = _encoder.encode(payload).length;

    // --- Try full write (with content) ---
    try {
        if (bytes <= SAFE_ITEM_BYTES) {
            slim._chunks = 0;
            // Re-compress the object state with _chunks=0 marker
            const basePayload = compressForSync(JSON.stringify(slim));
            await chrome.storage.sync.set({ [syncKey(prompt.id)]: basePayload });
            return [syncKey(prompt.id)];
        }

        // Content too large for one key — chunk it
        const content = slim.content || '';
        delete slim.content;
        slim._chunks = 0;

        // Compress base metadata
        const basePayload = compressForSync(JSON.stringify(slim));
        const baseOverhead = _encoder.encode(basePayload).length + 50;
        const contentBudget = SAFE_ITEM_BYTES - baseOverhead;

        // Compress full content blocks individually to map to keys safely 
        // Note: For overflow chunks, we compress the raw content string
        const chunks = [];
        let remaining = content;
        while (remaining.length > 0) {
            let sliceLen = Math.min(remaining.length, contentBudget);
            while (_encoder.encode(compressForSync(JSON.stringify(remaining.slice(0, sliceLen)))).length > (chunks.length === 0 ? contentBudget : SAFE_ITEM_BYTES - 50)) {
                sliceLen = Math.max(1, Math.floor(sliceLen * 0.9));
            }
            chunks.push(remaining.slice(0, sliceLen));
            remaining = remaining.slice(sliceLen);
        }

        slim.content = chunks[0];
        slim._chunks = chunks.length - 1;

        const writeData = { [syncKey(prompt.id)]: compressForSync(JSON.stringify(slim)) };
        const keysWritten = [syncKey(prompt.id)];
        for (let i = 1; i < chunks.length; i++) {
            const ck = contentChunkKey(prompt.id, i);
            writeData[ck] = compressForSync(JSON.stringify(chunks[i]));
            keysWritten.push(ck);
        }

        await chrome.storage.sync.set(writeData);
        console.log(`[PromptStorage] write: ${prompt.id} (${keysWritten.length} keys, ${bytes} bytes)`);
        return keysWritten;

    } catch (e) {
        if (!e.message?.includes('quota') && !e.message?.includes('QUOTA')) throw e;

        // Clean up old chunks before falling back (prevent orphaned keys)
        try { await removeSyncPrompt(prompt.id); } catch {}

        // --- Quota exceeded: fallback to metadata-only (no content in sync) ---
        console.warn(`[PromptStorage] Quota exceeded for ${prompt.id}, falling back to metadata-only sync`);
        const metaOnly = { ...slim };
        delete metaOnly.content;
        delete metaOnly.variables;
        metaOnly._chunks = 0;
        metaOnly._contentLocal = true; // flag: content is in local only

        try {
            const fallbackPayload = compressForSync(JSON.stringify(metaOnly));
            await chrome.storage.sync.set({ [syncKey(prompt.id)]: fallbackPayload });
            return [syncKey(prompt.id)];
        } catch (e2) {
            console.error(`[PromptStorage] Even metadata-only sync failed for ${prompt.id}:`, e2.message);
            return []; // give up on sync, data is safe in local
        }
    }
}

/**
 * Read a single prompt from sync, reassembling chunks.
 */
async function readSyncPrompt(id, prefetchedData) {
    let baseRaw = prefetchedData?.[syncKey(id)];
    if (!baseRaw) return null;

    let base;
    if (typeof baseRaw === 'string' && baseRaw.startsWith('lz::')) {
        base = JSON.parse(decompressFromSync(baseRaw));
    } else {
        base = baseRaw; // legacy
    }

    if (!base._chunks || base._chunks === 0) {
        const { _chunks, ...clean } = base;
        return clean;
    }

    // Reassemble overflow chunks
    let fullContent = base.content || '';
    for (let i = 1; i <= base._chunks; i++) {
        const key = contentChunkKey(id, i);
        let chunkRaw = prefetchedData?.[key];
        if (chunkRaw === undefined) {
            // Chunk wasn't prefetched — fetch individually
            const fetched = await chrome.storage.sync.get(key);
            chunkRaw = fetched[key];
        }

        if (typeof chunkRaw === 'string') {
            if (chunkRaw.startsWith('lz::')) {
                fullContent += JSON.parse(decompressFromSync(chunkRaw));
            } else {
                fullContent += chunkRaw; // legacy
            }
        }
    }

    const { _chunks, ...clean } = base;
    clean.content = fullContent;
    return clean;
}

/**
 * Remove all sync keys for a prompt (base + overflow chunks).
 */
async function removeSyncPrompt(id) {
    if (SyncManager.backend === 'none') return;
    if (SyncManager.backend === 'webdav') {
        return SyncManager.triggerWebdavSync();
    }
    if (SyncManager.backend === 'obsidian') {
        return SyncManager.triggerObsidianSync();
    }

    // Read base to find chunk count (must decompress first)
    const data = await chrome.storage.sync.get(syncKey(id));
    const baseRaw = data[syncKey(id)];
    const keysToRemove = [syncKey(id)];

    if (baseRaw) {
        let base;
        if (typeof baseRaw === 'string' && baseRaw.startsWith('lz::')) {
            base = JSON.parse(decompressFromSync(baseRaw));
        } else {
            base = baseRaw; // legacy
        }

        if (base._chunks) {
            for (let i = 1; i <= base._chunks; i++) {
                keysToRemove.push(contentChunkKey(id, i));
            }
        }
    }

    await chrome.storage.sync.remove(keysToRemove);
}

/**
 * Merge a single synced slim prompt with its local counterpart.
 */
function mergeOne(slim, local) {
    if (!local) return normalizePromptUsage({ ...slim, versions: [], usageCount: 0, lastUsedAt: null, lastUsed: null });
    return normalizePromptUsage({
        ...local,
        ...slim,
        versions: local.versions || [],
        usageCount: local.usageCount || 0,
        lastUsedAt: local.lastUsedAt || null,
        lastUsed: local.lastUsed || null,
    });
}

export const PromptStorage = {
    /**
     * Read all prompts. Merges sync (slim) + local (full).
     * Supports both new per-key format and legacy chunked format.
     */
    async get() {
        await SyncManager.ready();
        if (SyncManager.backend === 'none' || SyncManager.backend === 'webdav' || SyncManager.backend === 'obsidian') {
            // For local/WebDAV/Obsidian backends, the local cache `prompts` is the single source of truth
            // after the initial pull completes via SyncManager.
            const prompts = await LocalStorage.get('prompts') || [];
            return prompts.map(normalizePromptUsage);
        }

        // Try new per-key format first
        const indexResult = await chrome.storage.sync.get(P_INDEX);
        const ids = indexResult[P_INDEX];

        if (ids && Array.isArray(ids)) {
            // Build list of all keys to fetch (base + potential chunks)
            const allKeys = [];
            for (const id of ids) allKeys.push(syncKey(id));
            // First pass: get base keys to learn chunk counts
            const baseData = allKeys.length > 0 ? await chrome.storage.sync.get(allKeys) : {};

            // Collect chunk keys needed
            const chunkKeys = [];
            for (const id of ids) {
                const base = baseData[syncKey(id)];
                if (base?._chunks) {
                    for (let i = 1; i <= base._chunks; i++) {
                        chunkKeys.push(contentChunkKey(id, i));
                    }
                }
            }
            // Fetch chunks in one batch if needed
            const chunkData = chunkKeys.length > 0 ? await chrome.storage.sync.get(chunkKeys) : {};
            const allData = { ...baseData, ...chunkData };

            const localPrompts = await LocalStorage.get('prompts') || [];
            const localMap = new Map(localPrompts.map(p => [p.id, p]));
            const seenIds = new Set();

            const prompts = [];
            for (const id of ids) {
                seenIds.add(id);
                const slim = await readSyncPrompt(id, allData);
                if (slim) {
                    prompts.push(mergeOne(slim, localMap.get(id)));
                } else if (localMap.has(id)) {
                    // Sync data missing (write failed) — use local data
                    prompts.push(normalizePromptUsage(localMap.get(id)));
                }
            }

            // Include local-only prompts not in index at all
            for (const local of localMap.values()) {
                if (!seenIds.has(local.id)) {
                    prompts.push(normalizePromptUsage(local));
                }
            }
            return prompts;
        }

        // Fallback: legacy chunked format
        const [syncPrompts, localPrompts] = await Promise.all([
            SyncStorage.get('prompts'),
            LocalStorage.get('prompts'),
        ]);
        return mergePrompts(syncPrompts, localPrompts);
    },

    /**
     * Read a single prompt by ID. Fast path: local-only, no sync merge.
     * @param {string} id - Prompt ID
     * @returns {Promise<object|null>}
     */
    async getById(id) {
        const locals = await LocalStorage.get('prompts') || [];
        return locals.find(p => p.id === id) || null;
    },

    /**
     * Save a new prompt. Local write is guaranteed; sync is best-effort.
     */
    async save(prompt) {
        await SyncManager.ready();
        const normalizedPrompt = await normalizePromptForStorage(prompt);
        // Local first (always succeeds)
        const locals = await LocalStorage.get('prompts') || [];
        locals.push(normalizedPrompt);
        await LocalStorage.set('prompts', locals);

        // Sync: best-effort
        try {
            await writeSyncPrompt(normalizedPrompt);
        } catch (e) {
            console.warn(`[PromptStorage] sync save failed for ${normalizedPrompt.id}, data safe in local:`, e.message);
        }
        console.log(`[PromptStorage] save: ${normalizedPrompt.id}`);
    },

    /**
     * Update an existing prompt. Local write is guaranteed; sync is best-effort.
     */
    async update(prompt) {
        await SyncManager.ready();
        const normalizedPrompt = await normalizePromptForStorage(prompt);
        const locals = await LocalStorage.get('prompts') || [];
        const idx = locals.findIndex(p => p.id === normalizedPrompt.id);
        if (idx >= 0) locals[idx] = normalizedPrompt; else locals.push(normalizedPrompt);
        await LocalStorage.set('prompts', locals);

        try {
            await removeSyncPrompt(normalizedPrompt.id);
            await writeSyncPrompt(normalizedPrompt);
        } catch (e) {
            console.warn(`[PromptStorage] sync update failed for ${normalizedPrompt.id}:`, e.message);
        }
        console.log(`[PromptStorage] update: ${normalizedPrompt.id}`);
    },

    /**
     * Delete a prompt. Local write is guaranteed; sync is best-effort.
     */
    async delete(id) {
        await SyncManager.ready();
        const locals = await LocalStorage.get('prompts') || [];
        await LocalStorage.set('prompts', locals.filter(p => p.id !== id));

        try {
            await removeSyncPrompt(id);
        } catch (e) {
            console.warn(`[PromptStorage] sync delete failed for ${id}:`, e.message);
        }
        console.log(`[PromptStorage] delete: ${id}`);
    },

    /**
     * Bulk set (for import and onInstalled defaults). Writes all prompts one by one.
     */
    async bulkSet(prompts) {
        await SyncManager.ready();
        const { prompts: normalizedPrompts } = await normalizePromptsForStorage(prompts);
        await LocalStorage.set('prompts', normalizedPrompts);

        if (SyncManager.backend === 'webdav') {
            await SyncManager.triggerWebdavSync();
            console.log(`[PromptStorage] bulkSet WebDAV: ${normalizedPrompts.length} prompts`);
            return;
        }

        if (SyncManager.backend === 'obsidian') {
            await SyncManager.triggerObsidianSync();
            console.log(`[PromptStorage] bulkSet Obsidian: ${normalizedPrompts.length} prompts`);
            return;
        }

        // 'none' backend — local only, no remote sync
        console.log(`[PromptStorage] bulkSet local-only: ${normalizedPrompts.length} prompts`);
    },

    /**
     * Legacy-compatible set() — full rewrite to per-key format.
     */
    async set(prompts) {
        const { prompts: normalizedPrompts } = await normalizePromptsForStorage(prompts);
        await LocalStorage.set('prompts', normalizedPrompts);
        if (SyncManager.backend === 'webdav') await SyncManager.triggerWebdavSync();
        if (SyncManager.backend === 'obsidian') await SyncManager.triggerObsidianSync();
    },
};


// --- Migration: old chunked format → new per-key format ---
// Chrome sync removed; this function is now a no-op
export async function migrateToPerKeySync() {
    return;
}

// Legacy migration wrapper (backward compat for callers)
export async function migrateLocalToSync() {
    await migrateToPerKeySync();
}

/**
 * A lightweight, dependency-free WebDAV client tailored for Prompt Ark.
 * Focuses on GET and PUT operations for a specific JSON file, using Basic Authentication.
 */
export class WebDAVClient {
    constructor() {
        this.timeoutLimit = 10000; // 10s timeout
    }

    /**
     * Builds the authorization header
     */
    _getHeaders(username, password) {
        const token = btoa(`${username}:${password}`);
        return {
            'Authorization': `Basic ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/plain, */*'
        };
    }

    /**
     * Normalizes the base WebDAV URL. 
     * Auto-appends a dedicated folder if the user provides the raw Jianguoyun root,
     * to prevent 409 Conflict errors which occur when writing directly to root.
     */
    _normalizeBaseUrl(baseUrl) {
        let url = baseUrl.trim();
        // Auto-fix for Jianguoyun root URL
        if (url === 'https://dav.jianguoyun.com/dav' || url === 'https://dav.jianguoyun.com/dav/') {
            url = 'https://dav.jianguoyun.com/dav/PromptArk/';
        }
        if (!url.endsWith('/')) {
            url += '/';
        }
        return url;
    }

    /**
     * Normalizes WebDAV URL ensuring it ends cleanly with the filename.
     */
    _normalizeUrl(baseUrl, filename) {
        return this._normalizeBaseUrl(baseUrl) + filename;
    }

    /**
     * Wrapper for fetch with a timeout mechanism.
     */
    async _fetchWithTimeout(url, options) {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), this.timeoutLimit);
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(id);
            return response;
        } catch (error) {
            clearTimeout(id);
            if (error.name === 'AbortError') {
                throw new Error('ERR_WEBDAV_TIMEOUT');
            }
            throw error;
        }
    }

    /**
     * Attempt to create the parent directory using MKCOL.
     */
    async _createDirectory(serverUrl, username, password) {
        const url = this._normalizeBaseUrl(serverUrl);
        const headers = this._getHeaders(username, password);
        const response = await this._fetchWithTimeout(url, {
            method: 'MKCOL',
            headers
        });

        // 201 Created is success. 405 Method Not Allowed means it already exists.
        if (!response.ok && response.status !== 405) {
            let errorText = await response.text().catch(() => '');
            throw new Error(`MKCOL ${response.status} ${errorText}`);
        }
        return true;
    }

    /**
     * Upload / Overwrite a file via WebDAV PUT.
     * @param {string} serverUrl - The WebDAV base URL (e.g. https://dav.jianguoyun.com/dav/)
     * @param {string} username - WebDAV Account username
     * @param {string} password - WebDAV App Password
     * @param {string} filename - Target file name 
     * @param {string} content - JSON string payload
     */
    async putFile(serverUrl, username, password, filename, content, retries = 1) {
        const url = this._normalizeUrl(serverUrl, filename);
        const headers = this._getHeaders(username, password);

        const response = await this._fetchWithTimeout(url, {
            method: 'PUT',
            headers,
            body: content
        });

        if (!response.ok) {
            let errorText = await response.text().catch(() => '');
            if (response.status === 401) {
                throw new Error('ERR_WEBDAV_AUTH_FAILED');
            }

            // If parent directory is missing, WebDAV returns 409 Conflict. 
            // Jianguoyun and some others also return 404 ObjectNotFound.
            if ((response.status === 409 || response.status === 404) && retries > 0) {
                console.log(`[WebDAV] Got ${response.status} on PUT. Attempting to MKCOL parent directory...`);
                try {
                    await this._createDirectory(serverUrl, username, password);
                    // Re-attempt PUT after creating directory
                    return await this.putFile(serverUrl, username, password, filename, content, 0);
                } catch (mkcolErr) {
                    throw new Error('ERR_WEBDAV_MKCOL_FAILED');
                }
            }

            if (response.status === 409) {
                throw new Error('ERR_WEBDAV_409');
            }

            throw new Error(`WebDAV PUT Error: ${response.status} ${response.statusText} ${errorText}`);
        }

        return true;
    }

    /**
     * Download a file via WebDAV GET.
     * @param {string} serverUrl - The WebDAV base URL
     * @param {string} username - WebDAV Account username
     * @param {string} password - WebDAV App Password
     * @param {string} filename - Target file name 
     * @returns {Promise<string>} The file content as text
     */
    async getFile(serverUrl, username, password, filename) {
        const url = this._normalizeUrl(serverUrl, filename);
        const headers = this._getHeaders(username, password);

        const response = await this._fetchWithTimeout(url, {
            method: 'GET',
            headers
        });

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error(`FILE_NOT_FOUND`);
            }
            if (response.status === 401) {
                throw new Error('ERR_WEBDAV_AUTH_FAILED');
            }
            throw new Error(`WebDAV GET Error: ${response.status} ${response.statusText}`);
        }

        return await response.text();
    }

    /**
     * Upload a Markdown file via WebDAV PUT.
     * Same as putFile but with text/markdown Content-Type for Obsidian Vault integration.
     * @param {string} serverUrl - The WebDAV base URL
     * @param {string} username - WebDAV Account username
     * @param {string} password - WebDAV App Password
     * @param {string} filename - Target file name (e.g. "my-prompt.md")
     * @param {string} content - Markdown file content
     */
    async putMarkdownFile(serverUrl, username, password, filename, content, retries = 1) {
        const url = this._normalizeUrl(serverUrl, filename);
        const token = btoa(`${username}:${password}`);
        const headers = {
            'Authorization': `Basic ${token}`,
            'Content-Type': 'text/markdown; charset=utf-8',
        };

        const response = await this._fetchWithTimeout(url, {
            method: 'PUT',
            headers,
            body: content
        });

        if (!response.ok) {
            if (response.status === 401) throw new Error('ERR_WEBDAV_AUTH_FAILED');
            if ((response.status === 409 || response.status === 404) && retries > 0) {
                console.log(`[WebDAV] Got ${response.status} on PUT MD. Attempting MKCOL...`);
                try {
                    await this._createDirectory(serverUrl, username, password);
                    return await this.putMarkdownFile(serverUrl, username, password, filename, content, 0);
                } catch (mkcolErr) {
                    throw new Error('ERR_WEBDAV_MKCOL_FAILED');
                }
            }
            const errorText = await response.text().catch(() => '');
            throw new Error(`WebDAV PUT MD Error: ${response.status} ${response.statusText} ${errorText}`);
        }
        return true;
    }

    /**
     * List files in a WebDAV directory using PROPFIND (Depth: 1).
     * Filters for .md files only.
     * @param {string} serverUrl - The WebDAV base URL
     * @param {string} username - WebDAV Account username
     * @param {string} password - WebDAV App Password
     * @returns {Promise<Array<{name: string, lastModified: string}>>}
     */
    async listMarkdownFiles(serverUrl, username, password) {
        const url = this._normalizeBaseUrl(serverUrl);
        const token = btoa(`${username}:${password}`);
        const headers = {
            'Authorization': `Basic ${token}`,
            'Content-Type': 'application/xml',
            'Depth': '1',
        };

        const body = `<?xml version="1.0" encoding="utf-8"?>
<D:propfind xmlns:D="DAV:">
  <D:prop>
    <D:displayname/>
    <D:getlastmodified/>
    <D:getcontenttype/>
  </D:prop>
</D:propfind>`;

        const response = await this._fetchWithTimeout(url, {
            method: 'PROPFIND',
            headers,
            body
        });

        if (!response.ok && response.status !== 207) {
            if (response.status === 401) throw new Error('ERR_WEBDAV_AUTH_FAILED');
            if (response.status === 404) throw new Error('ERR_WEBDAV_DIR_NOT_FOUND');
            throw new Error(`WebDAV PROPFIND Error: ${response.status}`);
        }

        const xml = await response.text();
        return this._parseMultiStatus(xml, url);
    }

    /**
     * Delete a file via WebDAV DELETE.
     * @param {string} serverUrl - The WebDAV base URL
     * @param {string} username - WebDAV Account username
     * @param {string} password - WebDAV App Password
     * @param {string} filename - Target file name
     */
    async deleteFile(serverUrl, username, password, filename) {
        const url = this._normalizeUrl(serverUrl, filename);
        const headers = this._getHeaders(username, password);

        const response = await this._fetchWithTimeout(url, {
            method: 'DELETE',
            headers
        });

        if (!response.ok && response.status !== 404) {
            if (response.status === 401) throw new Error('ERR_WEBDAV_AUTH_FAILED');
            throw new Error(`WebDAV DELETE Error: ${response.status}`);
        }
        return true;
    }

    /**
     * Parse WebDAV PROPFIND multi-status XML response.
     * Extracts .md filenames and their last-modified dates.
     * @private
     */
    _parseMultiStatus(xml, baseUrl) {
        const files = [];
        // Simple regex-based XML parser (no DOMParser in service workers)
        const responseBlocks = xml.split(/<D:response>/i).slice(1);

        for (const block of responseBlocks) {
            // Extract href
            const hrefMatch = block.match(/<D:href>([^<]+)<\/D:href>/i);
            if (!hrefMatch) continue;

            const href = decodeURIComponent(hrefMatch[1]);
            // Skip the directory itself (href ends with /)
            if (href.endsWith('/')) continue;

            // Extract filename from href
            const parts = href.split('/');
            const name = parts[parts.length - 1];

            // Only include .md files
            if (!name.toLowerCase().endsWith('.md')) continue;

            // Extract last modified
            const modMatch = block.match(/<D:getlastmodified>([^<]+)<\/D:getlastmodified>/i);
            const lastModified = modMatch ? modMatch[1] : '';

            files.push({ name, lastModified });
        }

        return files;
    }
}

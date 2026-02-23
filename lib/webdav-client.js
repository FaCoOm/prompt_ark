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
}

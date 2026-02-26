// server.ts - Zero-dependency HTTP REST API server for Prompt Ark sync
// Uses Node.js built-in http module (available in Obsidian's Electron environment)

import http from "http";
import { App, TFile, TFolder, normalizePath } from "obsidian";

export interface ServerSettings {
    port: number;
    apiKey: string;
    promptFolder: string;
}

interface PromptObject {
    title: string;
    content: string;
    category: string;
    tags: string[];
    favorite: boolean;
    shortcut: string;
    variables: string[];
    prompt_ark_id: string | null;
    filename: string;
}

// --- Frontmatter Parser (TypeScript port of lib/frontmatter.js) ---

function parseFrontmatter(markdown: string): { meta: Record<string, any>; body: string } {
    if (!markdown) return { meta: {}, body: "" };
    const trimmed = markdown.trimStart();
    if (!trimmed.startsWith("---")) return { meta: {}, body: markdown };

    const endIndex = trimmed.indexOf("\n---", 3);
    if (endIndex === -1) return { meta: {}, body: markdown };

    const yamlBlock = trimmed.slice(4, endIndex).trim();
    const body = trimmed.slice(endIndex + 4).replace(/^\n/, "");
    return { meta: parseSimpleYaml(yamlBlock), body };
}

function serializeFrontmatter(meta: Record<string, any>, body: string): string {
    const lines: string[] = [];
    for (const [key, value] of Object.entries(meta)) {
        if (value === undefined || value === null || value === "") continue;
        lines.push(serializeYamlValue(key, value));
    }
    const fm = lines.length > 0 ? `---\n${lines.join("\n")}\n---\n` : "";
    return fm + body;
}

function parseSimpleYaml(yaml: string): Record<string, any> {
    const result: Record<string, any> = {};
    const lines = yaml.split("\n");
    let currentKey: string | null = null;
    let currentArray: any[] | null = null;

    for (const line of lines) {
        if (!line.trim() || line.trim().startsWith("#")) continue;

        const arrayItemMatch = line.match(/^\s+-\s+(.+)$/);
        if (arrayItemMatch && currentKey && currentArray) {
            currentArray.push(parseScalar(arrayItemMatch[1].trim()));
            continue;
        }

        if (currentKey && currentArray) {
            result[currentKey] = currentArray;
            currentKey = null;
            currentArray = null;
        }

        const kvMatch = line.match(/^(\w[\w_]*):\s*(.*)$/);
        if (!kvMatch) continue;

        const key = kvMatch[1];
        const rawValue = kvMatch[2].trim();

        if (rawValue === "") {
            currentKey = key;
            currentArray = [];
            continue;
        }

        if (rawValue.startsWith("[") && rawValue.endsWith("]")) {
            const inner = rawValue.slice(1, -1);
            result[key] = inner ? inner.split(",").map(s => parseScalar(s.trim())) : [];
            continue;
        }

        result[key] = parseScalar(rawValue);
    }

    if (currentKey && currentArray) result[currentKey] = currentArray;
    return result;
}

function parseScalar(str: string): any {
    if (str === "true") return true;
    if (str === "false") return false;
    if (str === "null" || str === "~") return null;
    if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'")))
        return str.slice(1, -1);
    if (/^-?\d+(\.\d+)?$/.test(str)) return Number(str);
    return str;
}

function serializeYamlValue(key: string, value: any): string {
    if (Array.isArray(value)) {
        if (value.length === 0) return `${key}: []`;
        return `${key}: [${value.map(v => quoteIfNeeded(String(v))).join(", ")}]`;
    }
    if (typeof value === "boolean") return `${key}: ${value}`;
    if (typeof value === "number") return `${key}: ${value}`;
    return `${key}: ${quoteIfNeeded(String(value))}`;
}

function quoteIfNeeded(str: string): string {
    if (/[:{}\[\],&#*?|>!%@`]/.test(str) || str.includes("\n")) {
        return `"${str.replace(/"/g, '\\"')}"`;
    }
    return str;
}

// --- Prompt <-> Markdown conversion ---

function markdownToPrompt(markdown: string, filename: string): PromptObject {
    const { meta, body } = parseFrontmatter(markdown);
    const fallbackTitle = filename.replace(/\.md$/i, "").replace(/[-_]/g, " ");

    return {
        title: meta.title || fallbackTitle,
        content: body.trim(),
        category: meta.category || "",
        tags: Array.isArray(meta.tags) ? meta.tags : meta.tags ? [meta.tags] : [],
        favorite: meta.favorite === true,
        shortcut: meta.shortcut || "",
        variables: Array.isArray(meta.variables) ? meta.variables : [],
        prompt_ark_id: meta.prompt_ark_id || null,
        filename,
    };
}

function promptToMarkdown(prompt: PromptObject): string {
    const meta: Record<string, any> = {};
    if (prompt.title) meta.title = prompt.title;
    if (prompt.category) meta.category = prompt.category;
    if (prompt.tags?.length) meta.tags = prompt.tags;
    if (prompt.favorite) meta.favorite = true;
    if (prompt.shortcut) meta.shortcut = prompt.shortcut;
    if (prompt.variables?.length) meta.variables = prompt.variables;
    if (prompt.prompt_ark_id) meta.prompt_ark_id = prompt.prompt_ark_id;
    return serializeFrontmatter(meta, prompt.content || "");
}

// --- HTTP Server ---

export class PromptArkServer {
    private app: App;
    private settings: ServerSettings;
    private server: http.Server | null = null;

    constructor(app: App, settings: ServerSettings) {
        this.app = app;
        this.settings = settings;
    }

    updateSettings(settings: ServerSettings) {
        this.settings = settings;
    }

    start(): boolean {
        if (this.server) return false;

        this.server = http.createServer((req, res) => {
            this.handleRequest(req, res).catch((err) => {
                console.error("[PromptArkSync] Request error:", err);
                this.sendJson(res, 500, { error: "Internal server error" });
            });
        });

        this.server.listen(this.settings.port, "127.0.0.1", () => {
            console.log(`[PromptArkSync] Server started on http://127.0.0.1:${this.settings.port}`);
        });

        this.server.on("error", (err: NodeJS.ErrnoException) => {
            if (err.code === "EADDRINUSE") {
                console.error(`[PromptArkSync] Port ${this.settings.port} is already in use`);
            } else {
                console.error("[PromptArkSync] Server error:", err);
            }
        });

        return true;
    }

    stop() {
        if (this.server) {
            this.server.close();
            this.server = null;
            console.log("[PromptArkSync] Server stopped");
        }
    }

    isRunning(): boolean {
        return this.server !== null;
    }

    // --- Core request handler ---

    private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse) {
        // CORS headers on every response
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, PUT, DELETE, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        res.setHeader("Access-Control-Max-Age", "86400");

        // Preflight
        if (req.method === "OPTIONS") {
            res.writeHead(204);
            res.end();
            return;
        }

        // Auth check (skip for health endpoint)
        const url = req.url || "/";
        if (url !== "/prompt-ark/health" && this.settings.apiKey) {
            const authHeader = req.headers.authorization || "";
            if (authHeader !== `Bearer ${this.settings.apiKey}`) {
                this.sendJson(res, 401, { error: "Invalid or missing API key" });
                return;
            }
        }

        // Route
        const method = req.method || "GET";

        if (url === "/prompt-ark/health" && method === "GET") {
            return this.handleHealth(res);
        }

        if (url === "/prompt-ark/prompts" && method === "GET") {
            return this.handleListPrompts(res);
        }

        const singleMatch = url.match(/^\/prompt-ark\/prompts\/(.+\.md)$/);
        if (singleMatch) {
            const filename = decodeURIComponent(singleMatch[1]);
            if (method === "GET") return this.handleGetPrompt(res, filename);
            if (method === "PUT") return this.handlePutPrompt(req, res, filename);
            if (method === "DELETE") return this.handleDeletePrompt(res, filename);
        }

        this.sendJson(res, 404, { error: "Not found" });
    }

    // --- Route handlers ---

    private handleHealth(res: http.ServerResponse) {
        const vaultName = this.app.vault.getName();
        this.sendJson(res, 200, {
            status: "ok",
            plugin: "prompt-ark-sync",
            version: "1.0.0",
            vault: vaultName,
            promptFolder: this.settings.promptFolder,
        });
    }

    private async handleListPrompts(res: http.ServerResponse) {
        try {
            const prompts = await this.readAllPrompts();
            this.sendJson(res, 200, { prompts });
        } catch (err: any) {
            this.sendJson(res, 500, { error: err.message });
        }
    }

    private async handleGetPrompt(res: http.ServerResponse, filename: string) {
        const filePath = this.getPromptPath(filename);
        const file = this.app.vault.getAbstractFileByPath(filePath);

        if (!file || !(file instanceof TFile)) {
            this.sendJson(res, 404, { error: "File not found" });
            return;
        }

        try {
            const content = await this.app.vault.read(file);
            const prompt = markdownToPrompt(content, filename);
            this.sendJson(res, 200, prompt);
        } catch (err: any) {
            this.sendJson(res, 500, { error: err.message });
        }
    }

    private async handlePutPrompt(req: http.IncomingMessage, res: http.ServerResponse, filename: string) {
        const body = await this.readBody(req);
        let prompt: PromptObject;

        try {
            prompt = JSON.parse(body);
        } catch {
            this.sendJson(res, 400, { error: "Invalid JSON body" });
            return;
        }

        const filePath = this.getPromptPath(filename);
        const markdown = promptToMarkdown(prompt);

        try {
            // Ensure folder exists
            await this.ensureFolder();

            const existing = this.app.vault.getAbstractFileByPath(filePath);
            if (existing && existing instanceof TFile) {
                await this.app.vault.modify(existing, markdown);
            } else {
                await this.app.vault.create(filePath, markdown);
            }

            this.sendJson(res, 200, { success: true, filename });
        } catch (err: any) {
            this.sendJson(res, 500, { error: err.message });
        }
    }

    private async handleDeletePrompt(res: http.ServerResponse, filename: string) {
        const filePath = this.getPromptPath(filename);
        const file = this.app.vault.getAbstractFileByPath(filePath);

        if (!file || !(file instanceof TFile)) {
            this.sendJson(res, 404, { error: "File not found" });
            return;
        }

        try {
            await this.app.vault.trash(file, true); // Move to system trash (safer)
            this.sendJson(res, 200, { success: true });
        } catch (err: any) {
            this.sendJson(res, 500, { error: err.message });
        }
    }

    // --- Helpers ---

    private getPromptPath(filename: string): string {
        // Prevent path traversal attacks
        const safe = filename.replace(/\.\.[\/\\]/g, "").replace(/[\/\\]/g, "");
        return normalizePath(`${this.settings.promptFolder}/${safe}`);
    }

    private async ensureFolder() {
        const folderPath = normalizePath(this.settings.promptFolder);
        const folder = this.app.vault.getAbstractFileByPath(folderPath);
        if (!folder) {
            await this.app.vault.createFolder(folderPath);
        }
    }

    private async readAllPrompts(): Promise<PromptObject[]> {
        const folderPath = normalizePath(this.settings.promptFolder);
        const folder = this.app.vault.getAbstractFileByPath(folderPath);

        if (!folder || !(folder instanceof TFolder)) {
            // Folder doesn't exist yet — return empty
            return [];
        }

        const prompts: PromptObject[] = [];
        const files = this.app.vault.getMarkdownFiles().filter(
            (f) => f.path.startsWith(folderPath + "/")
        );

        for (const file of files) {
            try {
                const content = await this.app.vault.read(file);
                prompts.push(markdownToPrompt(content, file.name));
            } catch (err) {
                console.warn(`[PromptArkSync] Failed to read ${file.path}:`, err);
            }
        }

        return prompts;
    }

    private sendJson(res: http.ServerResponse, status: number, data: any) {
        const body = JSON.stringify(data, null, 2);
        res.writeHead(status, {
            "Content-Type": "application/json; charset=utf-8",
            "Access-Control-Allow-Origin": "*",
        });
        res.end(body);
    }

    private readBody(req: http.IncomingMessage): Promise<string> {
        return new Promise((resolve, reject) => {
            const chunks: Buffer[] = [];
            let totalSize = 0;
            const MAX_BODY_SIZE = 5 * 1024 * 1024; // 5MB

            req.on("data", (chunk: Buffer) => {
                totalSize += chunk.length;
                if (totalSize > MAX_BODY_SIZE) {
                    reject(new Error("Request body too large (max 5MB)"));
                    req.destroy();
                    return;
                }
                chunks.push(chunk);
            });
            req.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
            req.on("error", reject);
        });
    }
}

// settings.ts - Obsidian Settings Tab for Prompt Ark Sync

import { App, PluginSettingTab, Setting } from "obsidian";
import type PromptArkSyncPlugin from "./main";

export interface PromptArkSyncSettings {
    port: number;
    apiKey: string;
    promptFolder: string;
}

export const DEFAULT_SETTINGS: PromptArkSyncSettings = {
    port: 27123,
    apiKey: "",
    promptFolder: "prompts",
};

export class PromptArkSettingTab extends PluginSettingTab {
    plugin: PromptArkSyncPlugin;

    constructor(app: App, plugin: PromptArkSyncPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        // Header
        containerEl.createEl("h2", { text: "Prompt Ark Sync" });

        const statusEl = containerEl.createEl("p", {
            cls: "setting-item-description",
        });
        const isRunning = this.plugin.server?.isRunning() ?? false;
        statusEl.innerHTML = isRunning
            ? `🟢 Server running on <code>http://127.0.0.1:${this.plugin.settings.port}</code>`
            : "🔴 Server stopped";

        // Port
        new Setting(containerEl)
            .setName("Port")
            .setDesc("HTTP server port. Restart required after change.")
            .addText((text) =>
                text
                    .setPlaceholder("27123")
                    .setValue(String(this.plugin.settings.port))
                    .onChange(async (value) => {
                        const port = parseInt(value, 10);
                        if (!isNaN(port) && port > 0 && port < 65536) {
                            this.plugin.settings.port = port;
                            await this.plugin.saveSettings();
                        }
                    })
            );

        // API Key
        new Setting(containerEl)
            .setName("API Key")
            .setDesc(
                "Authentication key for Prompt Ark extension. Leave empty to allow unauthenticated access (local only)."
            )
            .addText((text) =>
                text
                    .setPlaceholder("Leave empty for no auth")
                    .setValue(this.plugin.settings.apiKey)
                    .onChange(async (value) => {
                        this.plugin.settings.apiKey = value.trim();
                        await this.plugin.saveSettings();
                        this.plugin.server?.updateSettings(this.plugin.settings);
                    })
            )
            .addButton((btn) =>
                btn.setButtonText("Generate").onClick(async () => {
                    this.plugin.settings.apiKey = crypto.randomUUID();
                    await this.plugin.saveSettings();
                    this.plugin.server?.updateSettings(this.plugin.settings);
                    this.display(); // Refresh UI
                })
            );

        // Prompt Folder
        new Setting(containerEl)
            .setName("Prompt Folder")
            .setDesc(
                "Vault subfolder containing your prompt .md files. Will be created if it doesn't exist."
            )
            .addText((text) =>
                text
                    .setPlaceholder("prompts")
                    .setValue(this.plugin.settings.promptFolder)
                    .onChange(async (value) => {
                        this.plugin.settings.promptFolder = value.trim() || "prompts";
                        await this.plugin.saveSettings();
                        this.plugin.server?.updateSettings(this.plugin.settings);
                    })
            );

        // Restart button
        new Setting(containerEl)
            .setName("Restart Server")
            .setDesc("Apply port changes by restarting the server.")
            .addButton((btn) =>
                btn
                    .setButtonText("Restart")
                    .setCta()
                    .onClick(async () => {
                        this.plugin.restartServer();
                        this.display(); // Refresh status
                    })
            );

        // Connection info
        containerEl.createEl("h3", { text: "Setup Guide" });
        const infoEl = containerEl.createEl("div", {
            cls: "setting-item-description",
        });
        infoEl.innerHTML = `
      <ol>
        <li>Install the <strong>Prompt Ark</strong> browser extension</li>
        <li>Open extension Settings → Sync tab</li>
        <li>Select <strong>"Obsidian Local"</strong> as sync backend</li>
        <li>Enter port: <code>${this.plugin.settings.port}</code>${this.plugin.settings.apiKey ? ` and API key: <code>${this.plugin.settings.apiKey}</code>` : ""}</li>
        <li>Click <strong>"Sync Now"</strong> — done!</li>
      </ol>
      <p>Create <code>.md</code> files in your <code>${this.plugin.settings.promptFolder}/</code> folder to use them as prompts.</p>
    `;
    }
}

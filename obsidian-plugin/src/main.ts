// main.ts - Obsidian Plugin entry point for Prompt Ark Sync

import { Plugin } from "obsidian";
import { PromptArkServer } from "./server";
import {
    PromptArkSettingTab,
    PromptArkSyncSettings,
    DEFAULT_SETTINGS,
} from "./settings";

export default class PromptArkSyncPlugin extends Plugin {
    settings: PromptArkSyncSettings = DEFAULT_SETTINGS;
    server: PromptArkServer | null = null;

    async onload() {
        console.log("[PromptArkSync] Loading plugin...");

        await this.loadSettings();

        // Start HTTP server
        this.server = new PromptArkServer(this.app, this.settings);
        this.server.start();

        // Settings tab
        this.addSettingTab(new PromptArkSettingTab(this.app, this));

        // Status bar
        const statusBarItem = this.addStatusBarItem();
        statusBarItem.setText(`⚡ Prompt Ark: :${this.settings.port}`);
    }

    onunload() {
        console.log("[PromptArkSync] Unloading plugin...");
        this.server?.stop();
        this.server = null;
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    restartServer() {
        this.server?.stop();
        this.server = new PromptArkServer(this.app, this.settings);
        this.server.start();
    }
}

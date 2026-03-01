// lib/popup/share-manager.js - Gist sharing, social panel, and Pack mode
import { i18n } from '../../i18n-manager.js';
import { showToast } from './utils.js';

/**
 * ShareManager handles prompt sharing via GitHub Gist,
 * social sharing panel, and Prompt Pack selection mode.
 * SRP: All share/export-to-external workflows.
 */
export class ShareManager {
    constructor({ getPrompts }) {
        this._getPrompts = getPrompts;
        this._shareUrl = null;
        this._shareTitle = null;
        this._sharePromptId = null;
        this._packMode = false;
        this._packSelected = null;
    }

    /** @returns {boolean} Whether pack mode is active */
    get isPackMode() { return this._packMode; }

    /**
     * Share a single prompt via GitHub Gist and open the social panel.
     * @param {string} id - Prompt ID
     */
    async sharePrompt(id) {
        const btn = document.querySelector(`.prompt-item[data-id="${id}"] .share-btn`);
        if (btn) { btn.disabled = true; btn.innerHTML = '⏳'; }
        const prompts = this._getPrompts();
        const prompt = prompts.find(p => p.id === id);
        const title = prompt?.title || 'Untitled Prompt';

        try {
            const resp = await chrome.runtime.sendMessage({ type: 'SHARE_PROMPT', id });
            if (!resp.success) {
                if (resp.error === 'GitHub token not configured') {
                    showToast(i18n.t('configureGithubToken'));
                } else {
                    showToast('❌ ' + resp.error);
                }
                return;
            }
            this.showSharePanel(resp.url, title, id);
        } catch (e) {
            showToast('❌ ' + i18n.t('shareFailed') + ': ' + e.message);
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>';
            }
        }
    }

    /**
     * Show the floating share panel with social options.
     * @param {string} url - Gist URL
     * @param {string} title - Prompt title
     */
    showSharePanel(url, title, promptId = null) {
        this._shareUrl = url;
        this._shareTitle = title;
        this._sharePromptId = promptId;
        document.getElementById('sharePanelTitle').textContent = `${i18n.t('sharePrompt')} "${title}"`;
        document.getElementById('sharePanel').classList.remove('hidden');
        document.getElementById('sharePanelBackdrop').classList.remove('hidden');
    }

    /** Hide the share panel. */
    hideSharePanel() {
        document.getElementById('sharePanel').classList.add('hidden');
        document.getElementById('sharePanelBackdrop').classList.add('hidden');
        this._shareUrl = null;
        this._shareTitle = null;
        this._sharePromptId = null;
    }

    /**
     * Handle a share option click (twitter, reddit, copy, json).
     * @param {string} platform
     */
    async handleShareOption(platform) {
        const url = this._shareUrl;
        const title = this._shareTitle || 'AI Prompt';
        if (!url) return;

        switch (platform) {
            case 'twitter': {
                const text = `🔥 ${title} — My AI Prompt

Install this prompt with one click:
${url}

#PromptArk #AI #Prompt`;
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
                break;
            }
            case 'reddit': {
                const redditTitle = `[Prompt] ${title}`;
                const redditText = `I made this AI prompt. You can try it and install it with one click here:
${url}`;
                window.open(`https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(redditTitle)}&text=${encodeURIComponent(redditText)}`, '_blank');
                break;
            }
            case 'copy': {
                await navigator.clipboard.writeText(url);
                showToast(i18n.t('linkCopied'));
                break;
            }
            case 'json': {
                const prompts = this._getPrompts();
                const prompt = this._sharePromptId
                    ? prompts.find(p => p.id === this._sharePromptId)
                    : prompts.find(p => p.title === title);
                if (prompt) {
                    const json = JSON.stringify({ title: prompt.title, content: prompt.content, category: prompt.category, tags: prompt.tags }, null, 2);
                    await navigator.clipboard.writeText(json);
                    showToast(i18n.t('jsonCopied'));
                }
                break;
            }
        }
        this.hideSharePanel();
    }

    // --- Prompt Pack (Selection Mode) ---

    /** Enter pack selection mode. */
    enterPackMode() {
        this._packMode = true;
        this._packSelected = new Set();
        document.querySelectorAll('.prompt-item').forEach(el => el.classList.add('selectable'));
        document.getElementById('packToolbar').classList.remove('hidden');
        document.getElementById('packTitleInput').value = '';
        this._updatePackCount();
        showToast(i18n.t('packMode'));
    }

    /** Exit pack selection mode. */
    exitPackMode() {
        this._packMode = false;
        this._packSelected = null;
        document.querySelectorAll('.prompt-item').forEach(el => {
            el.classList.remove('selectable', 'selected');
        });
        document.getElementById('packToolbar').classList.add('hidden');
    }

    /** Update the selected count display in the pack toolbar. */
    _updatePackCount() {
        const count = document.querySelectorAll('.prompt-item.selected').length;
        document.getElementById('packSelectedCount').textContent = count;
        document.getElementById('packShareBtn').disabled = count === 0;
    }

    /** Share the selected pack via GitHub Gist. */
    async sharePack() {
        const selectedItems = document.querySelectorAll('.prompt-item.selected');
        const ids = Array.from(selectedItems).map(el => el.dataset.id);
        const packTitle = document.getElementById('packTitleInput').value.trim() || `Prompt Pack (${ids.length})`;

        if (ids.length === 0) {
            showToast(i18n.t('packSelectOne'));
            return;
        }

        const btn = document.getElementById('packShareBtn');
        btn.disabled = true;
        btn.textContent = i18n.t('packSharing');

        try {
            const resp = await chrome.runtime.sendMessage({ type: 'SHARE_PACK', ids, packTitle });
            if (!resp.success) {
                if (resp.error === 'GitHub token not configured') {
                    showToast(i18n.t('configureGithubToken'));
                } else {
                    showToast('❌ ' + resp.error);
                }
                return;
            }
            this.exitPackMode();
            this.showSharePanel(resp.url, packTitle);
        } catch (e) {
            showToast('❌ ' + i18n.t('packShareFailed') + ': ' + e.message);
        } finally {
            btn.disabled = false;
            btn.textContent = i18n.t('packShare');
        }
    }
}

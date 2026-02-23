// hub.js - Client logic for Prompt Hub landing page

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const gistId = urlParams.get('gist');

    const loadingState = document.getElementById('loadingState');
    const errorState = document.getElementById('errorState');
    const mainContent = document.getElementById('mainContent');
    const errorText = document.getElementById('errorText');

    if (!gistId) {
        showError("No Gist ID found in URL. This page requires a '?gist=...' parameter.");
        return;
    }

    try {
        // Fetch Gist from GitHub API
        const response = await fetch(`https://api.github.com/gists/${gistId}`);
        if (!response.ok) {
            throw new Error(`GitHub API Error: ${response.status} ${response.statusText}`);
        }

        const gistData = await response.json();

        // Find the prompt-ark json file
        let targetFile = null;
        for (const filename in gistData.files) {
            if (filename.startsWith('prompt-ark-')) {
                targetFile = gistData.files[filename];
                break; // Take the first matching file
            }
        }

        if (!targetFile) {
            throw new Error("Invalid Gist format. Cannot find any prompt-ark payload.");
        }

        // Parse payload
        const payloadStr = targetFile.content;
        const payload = JSON.parse(payloadStr);

        if (payload.format !== 'prompt-ark') {
            throw new Error("Invalid format. Expected 'prompt-ark' payload.");
        }

        // Support both single prompt sharing and pack sharing
        let promptsToImport = [];
        let displayPrompt = null;
        let isPack = false;

        if (payload.pack && Array.isArray(payload.prompts)) {
            isPack = true;
            promptsToImport = payload.prompts;
            displayPrompt = payload.prompts[0]; // Render the first one as representative
        } else if (payload.prompts && payload.prompts.length > 0) {
            promptsToImport = payload.prompts;
            displayPrompt = payload.prompts[0];
        } else {
            throw new Error("The payload contains no prompts.");
        }

        // Render UI
        renderUI(gistData, displayPrompt, isPack, payload);

        // Bind One-Click Import Button
        bindImportButton(promptsToImport, isPack);

        // Bind copy button
        document.getElementById('copyPromptBtn')?.addEventListener('click', async () => {
            const rawText = displayPrompt.content;
            if (rawText) {
                await navigator.clipboard.writeText(rawText);
                const btn = document.getElementById('copyPromptBtn');
                const orig = btn.innerHTML;
                btn.innerHTML = `<svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`;
                setTimeout(() => btn.innerHTML = orig, 2000);
            }
        });

        // Show main content
        loadingState.classList.add('hidden');
        mainContent.classList.remove('hidden');

    } catch (e) {
        showError(e.message);
    }

    function showError(msg) {
        loadingState.classList.add('hidden');
        errorState.classList.remove('hidden');
        errorText.textContent = msg;
    }

    function renderUI(gist, prompt, isPack, fullPayload) {
        // Author
        const owner = gist.owner;
        if (owner) {
            document.getElementById('authorName').textContent = owner.login;
            document.getElementById('authorAvatar').src = owner.avatar_url;
            document.getElementById('authorLink').href = owner.html_url;
        }

        // Date
        const date = new Date(gist.updated_at || gist.created_at);
        document.getElementById('dateText').textContent = date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

        // Title
        let titleHtml = escapeHtml(prompt.title || 'Untitled');
        if (isPack) {
            titleHtml = `<span class="text-indigo-400 font-mono text-sm uppercase tracking-widest block mb-1">Prompt Pack [${fullPayload.pack.count} Items]</span>` + escapeHtml(fullPayload.pack.title || 'Untitled Pack');
        }
        document.getElementById('promptTitle').innerHTML = titleHtml;

        // Tags & Category
        const tagsContainer = document.getElementById('tagsContainer');
        tagsContainer.innerHTML = '';
        if (prompt.category) {
            tagsContainer.innerHTML += `<span class="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md text-[11px] font-bold uppercase tracking-wider">${escapeHtml(prompt.category)}</span>`;
        }
        if (prompt.tags && prompt.tags.length > 0) {
            prompt.tags.forEach(t => {
                tagsContainer.innerHTML += `<span class="px-2.5 py-1 bg-gray-800 text-gray-400 border border-gray-700 rounded-md text-[11px] font-medium tracking-wide">#${escapeHtml(t)}</span>`;
            });
        }

        // Metrics
        const varCount = prompt.variables ? prompt.variables.length : 0;
        document.getElementById('varsCount').textContent = `${varCount} Variables`;

        // Rough token estimation (1 token approx 4 chars English)
        const tokenEstimate = Math.ceil((prompt.content || '').length / 4);
        document.getElementById('tokenSize').textContent = `~${tokenEstimate} Tokens`;

        // Content (Markdown)
        const contentEl = document.getElementById('promptContent');
        if (isPack && fullPayload.pack.count > 1) {
            // For packs, display the first prompt and list others
            let previewText = `### Contents of this Pack (${fullPayload.pack.count})\n`;
            fullPayload.prompts.forEach((p, i) => {
                previewText += `${i + 1}. **${p.title}** ${p.category ? `[${p.category}]` : ''}\n`;
            });
            previewText += `\n---\n### First Prompt Preview: ${prompt.title}\n\n`;
            previewText += prompt.content;
            contentEl.innerHTML = marked.parse(previewText);
        } else {
            contentEl.innerHTML = marked.parse(prompt.content || '*Empty*');
        }
    }

    function bindImportButton(promptsToImport, isPack) {
        const btn = document.getElementById('importBtn');
        btn.addEventListener('click', () => {
            // Visual feedback on button
            const originalText = btn.innerHTML;
            btn.innerHTML = `<svg class="w-5 h-5 animate-spin relative z-10" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span class="relative z-10">Installing...</span>`;
            btn.disabled = true;

            // Dispatch event to content script (which runs on all urls)
            window.postMessage({
                type: 'PROMPT_ARK_IMPORT',
                payload: {
                    prompts: promptsToImport,
                    isPack: isPack
                }
            }, '*');

            // Simulate slight delay for UX then show success
            setTimeout(() => {
                const overlay = document.getElementById('successOverlay');
                const card = document.getElementById('successCard');
                overlay.classList.remove('pointer-events-none', 'opacity-0');
                card.classList.remove('scale-95');
                card.classList.add('scale-100');

                // Keep button in success state
                btn.innerHTML = `<svg class="w-5 h-5 relative z-10 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg><span class="relative z-10 text-emerald-100">Installed!</span>`;
                btn.classList.replace('bg-indigo-500', 'bg-emerald-600');
                btn.classList.replace('hover:bg-indigo-400', 'hover:bg-emerald-500');
                btn.classList.replace('border-indigo-400/50', 'border-emerald-400/50');
            }, 500);
        });
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});

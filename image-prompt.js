// image-prompt.js - Standalone Image Prompt Analysis Page
import { generateImagePrompt } from "./lib/ai/image-prompt.js";

class ImagePromptPage {
    constructor() {
        this.imageUrl = "";
        this.imageModelId = "";
        this.analysisResult = null;

        this.init();
    }

    async init() {
        // Parse URL parameters
        const params = new URLSearchParams(window.location.search);
        this.imageUrl = params.get("url") || "";
        this.imageModelId = params.get("model") || "";

        if (!this.imageUrl) {
            this.showError("No image URL provided");
            return;
        }

        // Display the source image
        this.displayImage();

        // Start analysis
        await this.analyzeImage();
    }

    displayImage() {
        const img = document.getElementById("sourceImage");
        const urlDisplay = document.getElementById("imageUrl");

        img.src = this.imageUrl;
        img.onload = () => {
            urlDisplay.textContent =
                this.imageUrl.length > 100
                    ? this.imageUrl.substring(0, 100) + "..."
                    : this.imageUrl;
        };

        img.onerror = () => {
            this.showError("Failed to load image");
        };
    }

    async analyzeImage() {
        this.showLoading();

        try {
            const result = await generateImagePrompt(
                this.imageUrl,
                this.imageModelId,
            );
            this.analysisResult = result;
            this.displayResult(result);
        } catch (error) {
            console.error("[ImagePrompt] Analysis failed:", error);
            this.showError(error.message || "Failed to analyze image");
        }
    }

    showLoading() {
        document.getElementById("loadingState").style.display = "flex";
        document.getElementById("errorState").style.display = "none";
        document.getElementById("resultState").style.display = "none";
    }

    showError(message) {
        document.getElementById("loadingState").style.display = "none";
        document.getElementById("errorState").style.display = "flex";
        document.getElementById("resultState").style.display = "none";
        document.getElementById("errorMessage").textContent = message;
    }

    displayResult(result) {
        document.getElementById("loadingState").style.display = "none";
        document.getElementById("errorState").style.display = "none";
        document.getElementById("resultState").style.display = "block";

        // Fill in analysis fields
        document.getElementById("subjectValue").textContent =
            result.subject || "Not specified";
        document.getElementById("styleValue").textContent =
            result.style || "Not specified";
        document.getElementById("lightingValue").textContent =
            result.lighting || "Not specified";
        document.getElementById("colorSchemeValue").textContent =
            result.color_scheme || "Not specified";
        document.getElementById("compositionValue").textContent =
            result.composition || "Not specified";
        document.getElementById("detailsValue").textContent =
            result.details || "Not specified";

        // Fill in generated prompt
        document.getElementById("promptOutput").textContent =
            result.prompt || "";

        // Bind action buttons
        this.bindActions();
    }

    bindActions() {
        // Copy button
        document.getElementById("copyBtn").addEventListener("click", () => {
            const promptText = this.analysisResult?.prompt || "";
            navigator.clipboard
                .writeText(promptText)
                .then(() => {
                    this.showToast("Prompt copied to clipboard!", "success");
                })
                .catch(() => {
                    this.showToast("Failed to copy", "error");
                });
        });

        // Save button
        document
            .getElementById("saveBtn")
            .addEventListener("click", () => this.saveToPromptArk());

        // Regenerate button
        document
            .getElementById("regenerateBtn")
            .addEventListener("click", () => {
                this.analyzeImage();
            });

        // Retry button (in error state)
        document.getElementById("retryBtn").addEventListener("click", () => {
            this.analyzeImage();
        });

        document.getElementById("doubaoBtn").addEventListener("click", async () => {
            const promptText = this.analysisResult?.prompt || "";
            if (!promptText) {
                this.showToast("No prompt to send to Doubao", "error");
                return;
            }
            await chrome.storage.session.set({
                pendingDoubaoPrompt: promptText,
                pendingDoubaoTimestamp: Date.now()
            });
            window.open("https://www.doubao.com/chat", "_blank", "noopener,noreferrer");
            this.showToast("豆包已打开，Prompt 将自动填入", "success");
        });
    }

    async saveToPromptArk() {
        if (!this.analysisResult?.prompt) {
            this.showToast("No prompt to save", "error");
            return;
        }

        try {
            // Create a new prompt object (SAVE_PROMPT will generate ID and other fields)
            // const newPrompt = {
            //   title: `Image Prompt: ${this.analysisResult.subject?.substring(0, 30) || 'Untitled'}`,
            //   content: this.analysisResult.prompt,
            //   category: 'Image-to-Prompt',
            //   tags: ['image-prompt', this.analysisResult.style, this.analysisResult.lighting].filter(Boolean),
            //   shortcut: ''
            // };
            // Create a new prompt object
            const newPrompt = {
                id:
                    Date.now().toString(36) +
                    Math.random().toString(36).substr(2, 5),
                title: `Image Prompt: ${this.analysisResult.subject?.substring(0, 30) || "Untitled"}`,
                content: this.analysisResult.prompt,
                category: "Image-to-Prompt",
                tags: [
                    "image-prompt",
                    this.analysisResult.style,
                    this.analysisResult.lighting,
                ].filter(Boolean),
                shortcut: "",
                usageCount: 0,
                lastUsed: Date.now(),
                createdAt: Date.now(),
                pinned: false,
            };

            // Send to background script
            const response = await chrome.runtime.sendMessage({
                type: "SAVE_PROMPT",
                prompt: newPrompt,
            });

            if (response?.success) {
                this.showToast("Saved to Prompt Ark!", "success");

                // Change button text temporarily
                const saveBtn = document.getElementById("saveBtn");
                const originalText = saveBtn.textContent;
                saveBtn.textContent = "✅ Saved";
                saveBtn.disabled = true;

                setTimeout(() => {
                    saveBtn.textContent = originalText;
                    saveBtn.disabled = false;
                }, 2000);
            } else {
                throw new Error(response?.error || "Failed to save");
            }
        } catch (error) {
            console.error("[ImagePrompt] Save failed:", error);
            this.showToast("Failed to save: " + error.message, "error");
        }
    }

    showToast(message, type = "info") {
        const toast = document.getElementById("toast");
        toast.textContent = message;
        toast.className = `toast ${type}`;

        // Trigger animation
        requestAnimationFrame(() => {
            toast.classList.add("show");
        });

        // Hide after 3 seconds
        setTimeout(() => {
            toast.classList.remove("show");
        }, 3000);
    }
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => new ImagePromptPage());
} else {
    new ImagePromptPage();
}

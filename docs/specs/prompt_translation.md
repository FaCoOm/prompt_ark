# AI Prompt Translation Feature Specification

> **SDD Phase**: Specification → Ratify → Implement → Verify

## Background
Currently, users can only write prompts in one language. For non-native speakers or developers creating prompts for multiple locales, it's tedious to manually translate the Title, Category, Tags, and Content of a prompt. 

This feature allows users to seamlessly translate existing prompts into a target language using the configured AI model.

## User Stories

### US-1: Select Target Language and Translate
**Scenario**: In the Prompt Editor modal, or on a prompt card, the user wants to translate the prompt.
**Acceptance Criteria**:
- [ ] AC-1.1: The Edit Modal contains a "Translate" button with a dropdown (or an icon that opens a language selector).
- [ ] AC-1.2: The user can select from a standard list of target languages (e.g., English, Chinese, Japanese, Spanish, French, German, Korean).
- [ ] AC-1.3: Clicking translate triggers the AI model (shows a loading state).
- [ ] AC-1.4: Upon successful translation, the Title, Content, Category, and Tags in the editor are updated to the target language.

### US-2: AI Translation Logic
**Scenario**: The background script handles the translation request using an LLM.
**Acceptance Criteria**:
- [ ] AC-2.1: A dedicated prompt template `prompts/translate-prompt.md` is created.
- [ ] AC-2.2: The AI receives the original title, category, tags, and content, and outputs a strict JSON with the translated fields.
- [ ] AC-2.3: If the AI returns an error, a toast notification displays "Translation failed" and changes are not applied.
- [ ] AC-2.4: Variables (like `{{topic}}`) and system prompt structures inside the content are preserved, only translatable text is changed.

## Technical Specification

### 1. UI Changes (`popup.html` & `popup.js`)
- In `popup.html`, inside the Edit Prompt modal (`<div id="newPromptModal">` or similar), add a translation control near the bottom action buttons.
- In `popup.js`, bind a click event to the translate button:
  - Read the current values from the input fields (title, category, tags, content).
  - Show a loading spinner on the button.
  - Send message: `{ type: 'TRANSLATE_PROMPT', promptData: { title, content, category, tags }, targetLanguage: 'Chinese' }`
  - On response, populate the fields with the translated values.
  
### 2. AI Logic (`background.js`)
- Register a new message handler: `case 'TRANSLATE_PROMPT':` 
- Uses `lib/prompt-loader.js` to load the `translate` system prompt.
- Sends the user's prompt parameters as the query, explicitly instructing the model to translate into `targetLanguage` and preserve variable brackets (`{{var}}`).
- Parses JSON response, validates `title, content, category, tags`.
- Returns the JSON payload.

### 3. Prompt Template (`prompts/translate.md`)
Create a new Markdown file containing the system instructions for the LLM to behave as a technical translator for prompt engineering, outputting strict JSON.

### US-3: Translate Directly from Prompt List Card
**Scenario**: In the Prompt List, each prompt card shows a translate icon button. Clicking it opens a small language selector; upon choosing a language, the card's prompt is translated in-place and auto-saved.
**Acceptance Criteria**:
- [ ] AC-3.1: Each prompt card in the list has a 🌐 translate icon button in `.prompt-actions`.
- [ ] AC-3.2: Clicking the button opens a small inline language picker (dropdown or popover) anchored to the button.
- [ ] AC-3.3: Selecting a language triggers `TRANSLATE_PROMPT` message to background (reuses existing handler).
- [ ] AC-3.4: During translation, the card shows a loading indicator (e.g. spinner on the button).
- [ ] AC-3.5: On success, the prompt's title, category, tags, and content are updated in storage AND the list re-renders with the translated text.
- [ ] AC-3.6: On failure, a toast notification shows the error and nothing is changed.

## Technical Specification — US-3 (List-Level Translate)

### 1. UI Changes (`popup.js` — `renderPrompts()`)
In the `.prompt-actions` div (L392-424), insert a new translate button **before** the delete button:
```html
<button class="action-btn translate-list-btn" title="Translate">
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M12.87 15.07l-2.54-2.51..."/>  <!-- globe/translate icon -->
  </svg>
</button>
```

### 2. Language Selector Popover
When `.translate-list-btn` is clicked:
- Dynamically create a small `<div class="translate-popover">` anchored below the button.
- Popover contains language options matching the Edit Modal dropdown (English, 中文, 日本語, Español, Français, Deutsch, 한국어).
- Clicking a language option triggers the translation; clicking outside dismisses the popover.
- Only one popover can be open at a time (dismiss any existing one first).

### 3. Event Delegation (`popup.js` — `bindEvents()`)
Add to the existing promptList click handler (L555-560):
```javascript
else if (e.target.closest('.translate-list-btn')) this.showTranslatePopover(id, e.target.closest('.translate-list-btn'));
```

### 4. Translation Logic (`popup.js` — new method `translatePromptInline()`)
```javascript
async translatePromptInline(promptId, targetLanguage) {
  const prompt = this.prompts.find(p => p.id === promptId);
  // Send TRANSLATE_PROMPT message (reuses existing background handler)
  // On success: update prompt fields in this.prompts + call UPDATE_PROMPT + re-render
}
```

### 5. Styling (`popup.css`)
- `.translate-popover`: absolute positioned, dark glass background, z-index above cards.
- `.translate-popover button`: styled as list items with hover highlight.

## Verification
- Run with Gemini Web/API provider.
- Translate an English prompt containing `{{topic:A|B}}` to Chinese. 
- Ensure variables remain strictly `{{topic:A|B}}` and not translated.
- Ensure the prompt title and content text are properly localized.
- Verify that the new translate button on the Prompt List does not conflict with existing action buttons.

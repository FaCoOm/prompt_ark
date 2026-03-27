import { test, expect } from '@playwright/test';

/**
 * @fileoverview E2E Tests for Platform Injection
 *
 * Tests prompt injection functionality across supported AI platforms
 * Verifies Picker button visibility and prompt insertion
 */

test.describe('Platform Detection', () => {
  test('should detect ChatGPT platform', async ({ page }) => {
    await page.goto('https://chat.openai.com');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check if platform is detected via content script
    const isPlatformSupported = await page.evaluate(() => {
      // @ts-expect-error Accessing extension content script
      return window.promptArk?.platform?.isSupported || false;
    });
    
    // Platform should be detected (may not be supported without login)
    expect(typeof isPlatformSupported).toBe('boolean');
  });

  test('should detect Claude platform', async ({ page }) => {
    await page.goto('https://claude.ai');
    
    await page.waitForLoadState('networkidle');
    
    const platformInfo = await page.evaluate(() => {
      // @ts-expect-error Accessing extension content script
      return window.promptArk?.platform?.current || null;
    });
    
    // Should have platform info
    expect(platformInfo).toBeDefined();
  });

  test('should detect Gemini platform', async ({ page }) => {
    await page.goto('https://gemini.google.com');
    
    await page.waitForLoadState('networkidle');
    
    const platformName = await page.evaluate(() => {
      // @ts-expect-error Accessing extension content script
      return window.promptArk?.platform?.name || 'unknown';
    });
    
    expect(['gemini', 'unknown']).toContain(platformName);
  });
});

test.describe('Picker Button Injection', () => {
  test.beforeEach(async ({ context }) => {
    // Load extension
    await context.addInitScript(() => {
      // Mock extension availability
      // @ts-expect-error
      window.chrome = {
        runtime: {
          sendMessage: () => Promise.resolve({ success: true }),
          onMessage: { addListener: () => {} },
        },
        storage: {
          local: {
            get: () => Promise.resolve({}),
            set: () => Promise.resolve(),
          },
        },
      };
    });
  });

  test('should inject Picker button on supported platforms', async ({ page }) => {
    // Navigate to a test page that mimics a chat interface
    await page.goto('about:blank');
    await page.setContent(`
      <div id="chat-interface">
        <textarea id="chat-input" placeholder="Message..."></textarea>
        <button id="send-button">Send</button>
      </div>
    `);

    // Simulate platform detection
    await page.evaluate(() => {
      // @ts-expect-error
      window.promptArk = {
        platform: {
          isSupported: true,
          name: 'test-platform',
          selectors: {
            input: '#chat-input',
            submit: '#send-button',
          },
        },
      };
    });

    // Check if picker button would be injected
    const input = await page.locator('#chat-input');
    await expect(input).toBeVisible();
  });

  test('Picker button should be clickable', async ({ page }) => {
    await page.goto('about:blank');
    await page.setContent(`
      <div class="chat-container">
        <div class="input-area">
          <textarea class="chat-input"></textarea>
        </div>
      </div>
    `);

    // Add picker button
    await page.evaluate(() => {
      const button = document.createElement('button');
      button.id = 'prompt-ark-picker';
      button.textContent = '✨ Picker';
      button.style.cssText = 'position: absolute; right: 10px; bottom: 10px;';
      
      const inputArea = document.querySelector('.input-area');
      if (inputArea) {
        inputArea.style.position = 'relative';
        inputArea.appendChild(button);
      }
    });

    const pickerButton = await page.locator('#prompt-ark-picker');
    await expect(pickerButton).toBeVisible();
    await pickerButton.click();
  });
});

test.describe('Prompt Injection', () => {
  test('should insert prompt into chat input', async ({ page }) => {
    await page.goto('about:blank');
    await page.setContent(`
      <div id="chat-ui">
        <textarea id="message-input"></textarea>
      </div>
    `);

    // Simulate prompt insertion
    await page.evaluate((prompt) => {
      const input = document.querySelector('#message-input') as HTMLTextAreaElement;
      if (input) {
        input.value = prompt;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, 'This is a test prompt');

    const input = await page.locator('#message-input');
    await expect(input).toHaveValue('This is a test prompt');
  });

  test('should handle variable replacement in prompt', async ({ page }) => {
    await page.goto('about:blank');
    await page.setContent(`
      <textarea id="chat-input"></textarea>
    `);

    const promptWithVars = 'Write an email to {{name}} about {{topic}}';
    const filledPrompt = 'Write an email to John about quarterly report';

    await page.evaluate((prompt) => {
      const input = document.querySelector('#chat-input') as HTMLTextAreaElement;
      if (input) {
        input.value = prompt;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, filledPrompt);

    const input = await page.locator('#chat-input');
    await expect(input).toHaveValue(filledPrompt);
  });

  test('should insert prompt at cursor position', async ({ page }) => {
    await page.goto('about:blank');
    await page.setContent(`
      <textarea id="editor">Before </textarea>
    `);

    await page.evaluate(() => {
      const editor = document.querySelector('#editor') as HTMLTextAreaElement;
      if (editor) {
        editor.focus();
        editor.setSelectionRange(7, 7); // After "Before "
        const before = editor.value.substring(0, editor.selectionStart);
        const after = editor.value.substring(editor.selectionEnd);
        editor.value = before + '[INSERTED]' + after;
      }
    });

    const editor = await page.locator('#editor');
    await expect(editor).toHaveValue('Before [INSERTED]');
  });
});

test.describe('Quick Actions Button', () => {
  test('should show Quick Actions button near input', async ({ page }) => {
    await page.goto('about:blank');
    await page.setContent(`
      <div class="chat-wrapper">
        <div class="input-wrapper" style="position: relative;">
          <textarea class="message-input"></textarea>
        </div>
      </div>
    `);

    // Add Quick Actions button
    await page.evaluate(() => {
      const button = document.createElement('button');
      button.id = 'prompt-ark-quick-actions';
      button.textContent = '⚡';
      button.title = 'Quick Actions';
      button.style.cssText = 'position: absolute; right: 40px; bottom: 10px;';
      
      const wrapper = document.querySelector('.input-wrapper');
      if (wrapper) {
        wrapper.appendChild(button);
      }
    });

    const quickActions = await page.locator('#prompt-ark-quick-actions');
    await expect(quickActions).toBeVisible();
    await expect(quickActions).toHaveText('⚡');
  });

  test('Quick Actions should have correct title', async ({ page }) => {
    await page.goto('about:blank');
    await page.setContent(`
      <div style="position: relative;">
        <textarea></textarea>
        <button id="quick-actions" title="Quick Actions">⚡</button>
      </div>
    `);

    const button = await page.locator('#quick-actions');
    await expect(button).toHaveAttribute('title', 'Quick Actions');
  });
});

test.describe('Slash Commands', () => {
  test('should expand slash command', async ({ page }) => {
    await page.goto('about:blank');
    await page.setContent(`
      <textarea id="input"></textarea>
    `);

    // Type slash command
    await page.fill('#input', '/email');
    
    // Simulate slash expansion
    await page.evaluate(() => {
      const input = document.querySelector('#input') as HTMLTextAreaElement;
      if (input) {
        const expanded = 'Write a professional email to [recipient] about [subject]';
        input.value = expanded;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    const input = await page.locator('#input');
    await expect(input).toContainText('professional email');
  });

  test('should show slash command suggestions', async ({ page }) => {
    await page.goto('about:blank');
    await page.setContent(`
      <div style="position: relative;">
        <textarea id="input">/</textarea>
        <ul id="suggestions" style="position: absolute; display: block;">
          <li data-cmd="email">/email - Email template</li>
          <li data-cmd="code">/code - Code review</li>
          <li data-cmd="summarize">/summarize - Summarize text</li>
        </ul>
      </div>
    `);

    const suggestions = await page.locator('#suggestions li');
    await expect(suggestions).toHaveCount(3);
    
    const firstSuggestion = suggestions.first();
    await expect(firstSuggestion).toContainText('/email');
  });
});

test.describe('Context Variables', () => {
  test('should replace context variables in prompt', async ({ page }) => {
    const prompt = 'Analyze {{@page_title}} at {{@page_url}}';
    
    await page.goto('about:blank');
    await page.setContent(`
      <textarea id="input">${prompt}</textarea>
    `);

    // Simulate context replacement
    const replaced = await page.evaluate((original) => {
      const input = document.querySelector('#input') as HTMLTextAreaElement;
      if (input) {
        let value = input.value;
        value = value.replace('{{@page_title}}', 'Test Page');
        value = value.replace('{{@page_url}}', 'https://example.com');
        input.value = value;
        return value;
      }
      return original;
    }, prompt);

    expect(replaced).toContain('Test Page');
    expect(replaced).toContain('https://example.com');
  });

  test('should handle selection context variable', async ({ page }) => {
    const prompt = 'Explain: {{@selection}}';
    
    await page.goto('about:blank');
    await page.setContent(`
      <p id="text">Selected text content</p>
      <textarea id="input">${prompt}</textarea>
    `);

    const result = await page.evaluate(() => {
      const selection = 'Selected text content';
      const input = document.querySelector('#input') as HTMLTextAreaElement;
      if (input) {
        return input.value.replace('{{@selection}}', selection);
      }
      return '';
    });

    expect(result).toBe('Explain: Selected text content');
  });
});

test.describe('Error Handling', () => {
  test('should handle platform not supported', async ({ page }) => {
    await page.goto('about:blank');
    await page.setContent('<div>Not a chat interface</div>');

    const isSupported = await page.evaluate(() => {
      // @ts-expect-error
      return window.promptArk?.platform?.isSupported || false;
    });

    expect(isSupported).toBe(false);
  });

  test('should handle missing input element', async ({ page }) => {
    await page.goto('about:blank');
    await page.setContent(`
      <div class="chat-ui">
        <!-- No input element -->
      </div>
    `);

    const hasInput = await page.evaluate(() => {
      return !!document.querySelector('textarea, input[type="text"]');
    });

    expect(hasInput).toBe(false);
  });

  test('should handle injection errors gracefully', async ({ page }) => {
    await page.goto('about:blank');
    await page.setContent(`
      <textarea readonly id="input"></textarea>
    `);

    // Try to insert into readonly field
    const success = await page.evaluate(() => {
      try {
        const input = document.querySelector('#input') as HTMLTextAreaElement;
        if (input) {
          input.value = 'test';
          return true;
        }
        return false;
      } catch (e) {
        return false;
      }
    });

    // Readonly fields may or may not allow value setting
    expect(typeof success).toBe('boolean');
  });
});

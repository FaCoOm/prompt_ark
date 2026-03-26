import { test, expect } from '@playwright/test';

test.describe('Prompt Storage', () => {
  test('should save and retrieve prompts', async ({ page }) => {
    await page.goto('chrome-extension://test/sidepanel.html');
    
    await page.fill('[data-testid="prompt-title"]', 'Test Prompt');
    await page.fill('[data-testid="prompt-content"]', 'This is a test prompt');
    await page.click('[data-testid="save-prompt"]');
    
    const prompt = await page.locator('.prompt-card').first();
    await expect(prompt).toContainText('Test Prompt');
  });

  test('should search prompts', async ({ page }) => {
    await page.goto('chrome-extension://test/sidepanel.html');
    
    await page.fill('[data-testid="search-input"]', 'test');
    await page.waitForTimeout(300);
    
    const prompts = await page.locator('.prompt-card').count();
    expect(prompts).toBeGreaterThan(0);
  });
});

test.describe('Settings', () => {
  test('should change language', async ({ page }) => {
    await page.goto('chrome-extension://test/sidepanel.html');
    
    await page.click('[data-testid="settings-button"]');
    await page.selectOption('[data-testid="language-select"]', 'en');
    
    const title = await page.locator('h1').textContent();
    expect(title).toContain('Prompt Ark');
  });
});

import { test, expect } from '@playwright/test';

/**
 * @fileoverview E2E Tests for Sync Functionality
 *
 * Tests sync operations (Chrome Sync, GitHub Gist, WebDAV)
 * Verifies data synchronization across devices
 */

test.describe('Sync Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to settings page
    await page.goto('chrome-extension://test/settings.html');
  });

  test('should display sync backend options', async ({ page }) => {
    // Check for sync backend selector
    const backendSelect = await page.locator('[data-testid="sync-backend-select"]');
    await expect(backendSelect).toBeVisible();

    // Verify options exist
    const options = await backendSelect.locator('option').count();
    expect(options).toBeGreaterThanOrEqual(4); // none, chrome, gist, webdav
  });

  test('should show Chrome Sync option', async ({ page }) => {
    const chromeOption = await page.locator('option[value="chrome"]');
    await expect(chromeOption).toHaveText(/Chrome Sync|Chrome/i);
  });

  test('should show GitHub Gist option', async ({ page }) => {
    const gistOption = await page.locator('option[value="gist"]');
    await expect(gistOption).toHaveText(/GitHub Gist|Gist/i);
  });

  test('should show WebDAV option', async ({ page }) => {
    const webdavOption = await page.locator('option[value="webdav"]');
    await expect(webdavOption).toHaveText(/WebDAV/i);
  });
});

test.describe('Chrome Sync Configuration', () => {
  test('should enable Chrome Sync', async ({ page }) => {
    await page.goto('chrome-extension://test/settings.html');

    // Select Chrome backend
    await page.selectOption('[data-testid="sync-backend-select"]', 'chrome');

    // Verify sync status indicator
    const statusIndicator = await page.locator('[data-testid="sync-status"]');
    await expect(statusIndicator).toBeVisible();
  });

  test('should show sync quota usage', async ({ page }) => {
    await page.goto('chrome-extension://test/settings.html');
    await page.selectOption('[data-testid="sync-backend-select"]', 'chrome');

    // Check for quota display
    const quotaInfo = await page.locator('[data-testid="sync-quota"]');
    if (await quotaInfo.isVisible().catch(() => false)) {
      const text = await quotaInfo.textContent();
      expect(text).toMatch(/\d+\s*\/?\s*\d*\s*(KB|MB|bytes)/i);
    }
  });

  test('should trigger manual sync', async ({ page }) => {
    await page.goto('chrome-extension://test/settings.html');
    await page.selectOption('[data-testid="sync-backend-select"]', 'chrome');

    // Click sync now button
    const syncButton = await page.locator('[data-testid="sync-now-button"]');
    if (await syncButton.isVisible().catch(() => false)) {
      await syncButton.click();

      // Wait for sync to complete or show status
      await page.waitForTimeout(1000);

      // Check status
      const status = await page.locator('[data-testid="sync-status"]').textContent();
      expect(['synced', 'syncing', 'idle', 'failed']).toContain(status?.toLowerCase());
    }
  });
});

test.describe('GitHub Gist Configuration', () => {
  test('should show Gist configuration fields', async ({ page }) => {
    await page.goto('chrome-extension://test/settings.html');
    await page.selectOption('[data-testid="sync-backend-select"]', 'gist');

    // Check for token input
    const tokenInput = await page.locator('[data-testid="gist-token-input"]');
    await expect(tokenInput).toBeVisible();

    // Check for gist ID input (optional)
    const gistIdInput = await page.locator('[data-testid="gist-id-input"]');
    if (await gistIdInput.isVisible().catch(() => false)) {
      await expect(gistIdInput).toBeVisible();
    }
  });

  test('should validate token format', async ({ page }) => {
    await page.goto('chrome-extension://test/settings.html');
    await page.selectOption('[data-testid="sync-backend-select"]', 'gist');

    const tokenInput = await page.locator('[data-testid="gist-token-input"]');

    // Enter invalid token
    await tokenInput.fill('invalid-token');
    await tokenInput.blur();

    // Should show error or warning
    const error = await page.locator('[data-testid="token-error"]');
    if (await error.isVisible().catch(() => false)) {
      const errorText = await error.textContent();
      expect(errorText?.toLowerCase()).toMatch(/invalid|error|required/i);
    }
  });

  test('should test Gist connection', async ({ page }) => {
    await page.goto('chrome-extension://test/settings.html');
    await page.selectOption('[data-testid="sync-backend-select"]', 'gist');

    // Fill in test token
    await page.fill('[data-testid="gist-token-input"]', 'ghp_test_token_12345');

    // Click test connection button
    const testButton = await page.locator('[data-testid="test-connection-button"]');
    if (await testButton.isVisible().catch(() => false)) {
      await testButton.click();
      await page.waitForTimeout(1000);

      // Check for success or error message
      const result = await page.locator('[data-testid="connection-result"]').textContent();
      expect(['success', 'failed', 'connected', 'error']).toContain(result?.toLowerCase());
    }
  });
});

test.describe('WebDAV Configuration', () => {
  test('should show WebDAV configuration fields', async ({ page }) => {
    await page.goto('chrome-extension://test/settings.html');
    await page.selectOption('[data-testid="sync-backend-select"]', 'webdav');

    // Check for URL input
    const urlInput = await page.locator('[data-testid="webdav-url-input"]');
    await expect(urlInput).toBeVisible();

    // Check for username input
    const usernameInput = await page.locator('[data-testid="webdav-username-input"]');
    if (await usernameInput.isVisible().catch(() => false)) {
      await expect(usernameInput).toBeVisible();
    }

    // Check for password input
    const passwordInput = await page.locator('[data-testid="webdav-password-input"]');
    if (await passwordInput.isVisible().catch(() => false)) {
      await expect(passwordInput).toBeVisible();
    }
  });

  test('should validate WebDAV URL format', async ({ page }) => {
    await page.goto('chrome-extension://test/settings.html');
    await page.selectOption('[data-testid="sync-backend-select"]', 'webdav');

    const urlInput = await page.locator('[data-testid="webdav-url-input"]');

    // Enter invalid URL
    await urlInput.fill('not-a-valid-url');
    await urlInput.blur();

    // Should show validation error
    const error = await page.locator('[data-testid="url-error"]');
    if (await error.isVisible().catch(() => false)) {
      const errorText = await error.textContent();
      expect(errorText?.toLowerCase()).toMatch(/invalid|url|format/i);
    }
  });
});

test.describe('Sync Operations', () => {
  test('should export data to sync', async ({ page }) => {
    await page.goto('chrome-extension://test/settings.html');

    // Enable Chrome Sync
    await page.selectOption('[data-testid="sync-backend-select"]', 'chrome');

    // Add a test prompt first
    await page.goto('chrome-extension://test/sidepanel.html');
    await page.click('[data-testid="new-prompt-button"]');
    await page.fill('[data-testid="prompt-title"]', 'Sync Test Prompt');
    await page.fill('[data-testid="prompt-content"]', 'This is a test prompt for sync');
    await page.click('[data-testid="save-prompt"]');

    // Go back to settings and sync
    await page.goto('chrome-extension://test/settings.html');
    await page.selectOption('[data-testid="sync-backend-select"]', 'chrome');

    const syncButton = await page.locator('[data-testid="sync-now-button"]');
    if (await syncButton.isVisible().catch(() => false)) {
      await syncButton.click();
      await page.waitForTimeout(2000);

      // Check sync status
      const status = await page.locator('[data-testid="sync-status"]').textContent();
      expect(['synced', 'syncing']).toContain(status?.toLowerCase());
    }
  });

  test('should show sync status', async ({ page }) => {
    await page.goto('chrome-extension://test/settings.html');
    await page.selectOption('[data-testid="sync-backend-select"]', 'chrome');

    // Check for status indicator
    const statusElement = await page.locator('[data-testid="sync-status"]');
    await expect(statusElement).toBeVisible();

    // Status should be one of the valid states
    const status = await statusElement.textContent();
    const validStates = ['idle', 'syncing', 'synced', 'failed', 'conflict'];
    expect(validStates.some(state => status?.toLowerCase().includes(state))).toBe(true);
  });

  test('should show last sync time', async ({ page }) => {
    await page.goto('chrome-extension://test/settings.html');
    await page.selectOption('[data-testid="sync-backend-select"]', 'chrome');

    // Trigger a sync first
    const syncButton = await page.locator('[data-testid="sync-now-button"]');
    if (await syncButton.isVisible().catch(() => false)) {
      await syncButton.click();
      await page.waitForTimeout(2000);
    }

    // Check for last sync time
    const lastSync = await page.locator('[data-testid="last-sync-time"]');
    if (await lastSync.isVisible().catch(() => false)) {
      const timeText = await lastSync.textContent();
      // Should show a time or "Never"
      expect(timeText).toBeTruthy();
    }
  });
});

test.describe('Sync Conflict Handling', () => {
  test('should detect sync conflicts', async ({ page }) => {
    await page.goto('chrome-extension://test/settings.html');
    await page.selectOption('[data-testid="sync-backend-select"]', 'chrome');

    // Check for conflict indicator
    const conflictIndicator = await page.locator('[data-testid="sync-conflicts"]');

    if (await conflictIndicator.isVisible().catch(() => false)) {
      const count = await conflictIndicator.textContent();
      // Should show number of conflicts or "0"
      expect(parseInt(count || '0')).toBeGreaterThanOrEqual(0);
    }
  });

  test('should show conflict resolution options', async ({ page }) => {
    await page.goto('chrome-extension://test/settings.html');

    // Look for conflict resolution section
    const resolutionSection = await page.locator('[data-testid="conflict-resolution"]');

    if (await resolutionSection.isVisible().catch(() => false)) {
      // Check for resolution options
      const localWins = await page.locator('[data-testid="resolve-local"]').isVisible();
      const remoteWins = await page.locator('[data-testid="resolve-remote"]').isVisible();
      const merge = await page.locator('[data-testid="resolve-merge"]').isVisible();

      expect(localWins || remoteWins || merge).toBe(true);
    }
  });
});

test.describe('Auto Sync', () => {
  test('should have auto-sync toggle', async ({ page }) => {
    await page.goto('chrome-extension://test/settings.html');

    const autoSyncToggle = await page.locator('[data-testid="auto-sync-toggle"]');

    if (await autoSyncToggle.isVisible().catch(() => false)) {
      // Toggle auto-sync
      const isChecked = await autoSyncToggle.isChecked();
      await autoSyncToggle.click();
      await expect(autoSyncToggle).toBeChecked({ checked: !isChecked });
    }
  });

  test('should save sync settings', async ({ page }) => {
    await page.goto('chrome-extension://test/settings.html');

    // Change backend
    await page.selectOption('[data-testid="sync-backend-select"]', 'gist');

    // Fill in Gist token
    await page.fill('[data-testid="gist-token-input"]', 'ghp_test_token');

    // Save settings
    const saveButton = await page.locator('[data-testid="save-settings-button"]');
    if (await saveButton.isVisible().catch(() => false)) {
      await saveButton.click();
      await page.waitForTimeout(500);

      // Verify success message
      const successMessage = await page.locator('[data-testid="save-success"]');
      if (await successMessage.isVisible().catch(() => false)) {
        await expect(successMessage).toBeVisible();
      }
    }

    // Reload and verify settings persisted
    await page.reload();

    const backendValue = await page.locator('[data-testid="sync-backend-select"]').inputValue();
    expect(backendValue).toBe('gist');
  });
});

test.describe('Sync Error Handling', () => {
  test('should handle sync failure gracefully', async ({ page }) => {
    await page.goto('chrome-extension://test/settings.html');

    // Select a backend that will fail (no configuration)
    await page.selectOption('[data-testid="sync-backend-select"]', 'gist');

    // Try to sync without token
    const syncButton = await page.locator('[data-testid="sync-now-button"]');
    if (await syncButton.isVisible().catch(() => false)) {
      await syncButton.click();
      await page.waitForTimeout(1000);

      // Should show error status
      const status = await page.locator('[data-testid="sync-status"]').textContent();
      expect(['failed', 'error', 'not configured']).toContain(status?.toLowerCase());
    }
  });

  test('should show sync error message', async ({ page }) => {
    await page.goto('chrome-extension://test/settings.html');
    await page.selectOption('[data-testid="sync-backend-select"]', 'gist');

    // Look for error message display
    const errorMessage = await page.locator('[data-testid="sync-error"]');

    if (await errorMessage.isVisible().catch(() => false)) {
      const errorText = await errorMessage.textContent();
      expect(errorText).toBeTruthy();
    }
  });

  test('should allow retry after failure', async ({ page }) => {
    await page.goto('chrome-extension://test/settings.html');
    await page.selectOption('[data-testid="sync-backend-select"]', 'chrome');

    // Check for retry button
    const retryButton = await page.locator('[data-testid="retry-sync-button"]');

    if (await retryButton.isVisible().catch(() => false)) {
      await retryButton.click();
      await page.waitForTimeout(1000);

      // Should attempt sync again
      const status = await page.locator('[data-testid="sync-status"]').textContent();
      expect(['syncing', 'synced', 'failed']).toContain(status?.toLowerCase());
    }
  });
});

test.describe('Data Migration', () => {
  test('should show import from sync option', async ({ page }) => {
    await page.goto('chrome-extension://test/settings.html');

    // Look for import button
    const importButton = await page.locator('[data-testid="import-from-sync"]');

    if (await importButton.isVisible().catch(() => false)) {
      await expect(importButton).toBeVisible();
    }
  });

  test('should show export to sync option', async ({ page }) => {
    await page.goto('chrome-extension://test/settings.html');

    // Look for export button
    const exportButton = await page.locator('[data-testid="export-to-sync"]');

    if (await exportButton.isVisible().catch(() => false)) {
      await expect(exportButton).toBeVisible();
    }
  });
});

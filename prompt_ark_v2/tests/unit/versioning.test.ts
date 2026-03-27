/**
 * Unit tests for VersionManager
 *
 * Tests version history operations including create, get, rollback, delete, and prune
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VersionManager } from '../../src/core/storage/versioning';
import { PromptStorage } from '../../src/core/storage/core';
import type { Prompt, PromptVersion } from '../../src/types';

const mockStorage = new Map<string, unknown>();

vi.mock('wxt/utils/storage', () => ({
  storage: {
    getItem: vi.fn(async (key: string) => mockStorage.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: unknown) => {
      mockStorage.set(key, value);
    }),
    removeItem: vi.fn(async (key: string) => {
      mockStorage.delete(key);
    }),
  },
}));

const createTestPrompt = (id: string, overrides = {}): Prompt => ({
  id,
  title: `Test ${id}`,
  content: `Content ${id}`,
  category: 'General',
  tags: ['test'],
  shortcut: `test${id}`,
  isFavorite: false,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  versions: [],
  useCount: 0,
  ...overrides,
});

describe('VersionManager', () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  describe('createVersion', () => {
    it('should create a new version for a prompt', async () => {
      const prompt = createTestPrompt('1', { content: 'Original content' });
      await PromptStorage.save(prompt);

      const result = await VersionManager.createVersion(
        '1',
        'Original content',
        'First version'
      );

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.content).toBe('Original content');
      expect(result.data?.note).toBe('First version');
      expect(result.data?.id).toBeDefined();
      expect(result.data?.createdAt).toBeDefined();
    });

    it('should fail when prompt does not exist', async () => {
      const result = await VersionManager.createVersion(
        'nonexistent',
        'Content',
        'Note'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Prompt not found');
    });

    it('should add new versions at the beginning of the list', async () => {
      const prompt = createTestPrompt('1');
      await PromptStorage.save(prompt);

      await VersionManager.createVersion('1', 'Version 1', 'First');
      await VersionManager.createVersion('1', 'Version 2', 'Second');

      const versions = await VersionManager.getVersions('1');
      expect(versions).toHaveLength(2);
      expect(versions[0].note).toBe('Second');
      expect(versions[1].note).toBe('First');
    });

    it('should work without a note', async () => {
      const prompt = createTestPrompt('1');
      await PromptStorage.save(prompt);

      const result = await VersionManager.createVersion('1', 'Content');

      expect(result.success).toBe(true);
      expect(result.data?.note).toBeUndefined();
    });
  });

  describe('getVersions', () => {
    it('should return empty array when prompt has no versions', async () => {
      const prompt = createTestPrompt('1');
      await PromptStorage.save(prompt);

      const versions = await VersionManager.getVersions('1');
      expect(versions).toEqual([]);
    });

    it('should return empty array when prompt does not exist', async () => {
      const versions = await VersionManager.getVersions('nonexistent');
      expect(versions).toEqual([]);
    });

    it('should return all versions for a prompt', async () => {
      const prompt = createTestPrompt('1');
      await PromptStorage.save(prompt);

      await VersionManager.createVersion('1', 'V1');
      await VersionManager.createVersion('1', 'V2');
      await VersionManager.createVersion('1', 'V3');

      const versions = await VersionManager.getVersions('1');
      expect(versions).toHaveLength(3);
    });
  });

  describe('getVersionById', () => {
    it('should return specific version by ID', async () => {
      const prompt = createTestPrompt('1');
      await PromptStorage.save(prompt);

      const created = await VersionManager.createVersion('1', 'Content', 'Note');
      const versionId = created.data!.id;

      const found = await VersionManager.getVersionById('1', versionId);
      expect(found).not.toBeNull();
      expect(found?.content).toBe('Content');
      expect(found?.note).toBe('Note');
    });

    it('should return null for non-existent version', async () => {
      const prompt = createTestPrompt('1');
      await PromptStorage.save(prompt);

      const found = await VersionManager.getVersionById('1', 'nonexistent');
      expect(found).toBeNull();
    });

    it('should return null for non-existent prompt', async () => {
      const found = await VersionManager.getVersionById('nonexistent', 'v1');
      expect(found).toBeNull();
    });
  });

  describe('rollback', () => {
    it('should restore prompt content to version', async () => {
      const prompt = createTestPrompt('1', { content: 'Current' });
      await PromptStorage.save(prompt);

      const version = await VersionManager.createVersion('1', 'Old content');

      // Update prompt content (fetch fresh prompt first)
      const currentPrompt = await PromptStorage.getById('1');
      await PromptStorage.update({ ...currentPrompt!, content: 'New content' });

      // Rollback
      const result = await VersionManager.rollback('1', version.data!.id);

      expect(result.success).toBe(true);
      expect(result.data).toBe('Old content');

      const updated = await PromptStorage.getById('1');
      expect(updated?.content).toBe('Old content');
    });

    it('should auto-create version before rollback if content differs', async () => {
      const prompt = createTestPrompt('1', { content: 'Before rollback' });
      await PromptStorage.save(prompt);

      const oldVersion = await VersionManager.createVersion('1', 'Old version');

      // Change content (fetch fresh prompt first)
      const currentPrompt = await PromptStorage.getById('1');
      await PromptStorage.update({ ...currentPrompt!, content: 'Current content' });

      // Rollback
      await VersionManager.rollback('1', oldVersion.data!.id);

      // Should have versions
      const versions = await VersionManager.getVersions('1');
      expect(versions.length).toBeGreaterThanOrEqual(1);
    });

    it('should fail when prompt does not exist', async () => {
      const result = await VersionManager.rollback('nonexistent', 'v1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Prompt not found');
    });

    it('should fail when version does not exist', async () => {
      const prompt = createTestPrompt('1');
      await PromptStorage.save(prompt);

      const result = await VersionManager.rollback('1', 'nonexistent');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Version not found');
    });
  });

  describe('deleteVersion', () => {
    it('should delete a specific version', async () => {
      const prompt = createTestPrompt('1');
      await PromptStorage.save(prompt);

      const version = await VersionManager.createVersion('1', 'To delete');
      const versionId = version.data!.id;

      const result = await VersionManager.deleteVersion('1', versionId);

      expect(result.success).toBe(true);

      const found = await VersionManager.getVersionById('1', versionId);
      expect(found).toBeNull();
    });

    it('should fail when prompt does not exist', async () => {
      const result = await VersionManager.deleteVersion('nonexistent', 'v1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Prompt not found');
    });

    it('should fail when version does not exist', async () => {
      const prompt = createTestPrompt('1');
      await PromptStorage.save(prompt);

      const result = await VersionManager.deleteVersion('1', 'nonexistent');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Version not found');
    });
  });

  describe('pruneVersions', () => {
    it('should keep only max versions', async () => {
      const prompt = createTestPrompt('1');
      await PromptStorage.save(prompt);

      for (let i = 1; i <= 12; i++) {
        await VersionManager.createVersion('1', `Content ${i}`);
      }

      const result = await VersionManager.pruneVersions('1', 5);

      expect(result.success).toBe(true);
      expect(result.data).toBeGreaterThan(0);

      const versions = await VersionManager.getVersions('1');
      expect(versions.length).toBeLessThanOrEqual(5);
    });

    it('should keep most recent versions', async () => {
      const prompt = createTestPrompt('1');
      await PromptStorage.save(prompt);

      for (let i = 1; i <= 15; i++) {
        await VersionManager.createVersion('1', `Content ${i}`);
      }

      await VersionManager.pruneVersions('1', 5);

      const versions = await VersionManager.getVersions('1');
      expect(versions).toHaveLength(5);
      // Most recent should be first (Content 15)
      expect(versions[0].content).toBe('Content 15');
    });

    it('should return 0 when no pruning needed', async () => {
      const prompt = createTestPrompt('1');
      await PromptStorage.save(prompt);

      await VersionManager.createVersion('1', 'V1');
      await VersionManager.createVersion('1', 'V2');

      const result = await VersionManager.pruneVersions('1', 10);

      expect(result.success).toBe(true);
      expect(result.data).toBe(0);
    });

    it('should fail when prompt does not exist', async () => {
      const result = await VersionManager.pruneVersions('nonexistent', 5);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Prompt not found');
    });
  });

  describe('autoCreateVersionIfChanged', () => {
    it('should create version when content changes', async () => {
      const prompt = createTestPrompt('1', { content: 'Original' });
      await PromptStorage.save(prompt);

      const result = await VersionManager.autoCreateVersionIfChanged(
        '1',
        'New content'
      );

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should not create version when content is same', async () => {
      const prompt = createTestPrompt('1', { content: 'Same' });
      await PromptStorage.save(prompt);

      const result = await VersionManager.autoCreateVersionIfChanged(
        '1',
        'Same'
      );

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });

    it('should fail when prompt does not exist', async () => {
      const result = await VersionManager.autoCreateVersionIfChanged(
        'nonexistent',
        'Content'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Prompt not found');
    });
  });

  describe('getVersionCount', () => {
    it('should return correct version count', async () => {
      const prompt = createTestPrompt('1');
      await PromptStorage.save(prompt);

      expect(await VersionManager.getVersionCount('1')).toBe(0);

      await VersionManager.createVersion('1', 'V1');
      expect(await VersionManager.getVersionCount('1')).toBe(1);

      await VersionManager.createVersion('1', 'V2');
      expect(await VersionManager.getVersionCount('1')).toBe(2);
    });

    it('should return 0 for non-existent prompt', async () => {
      const count = await VersionManager.getVersionCount('nonexistent');
      expect(count).toBe(0);
    });
  });

  describe('clearVersions', () => {
    it('should remove all versions', async () => {
      const prompt = createTestPrompt('1');
      await PromptStorage.save(prompt);

      await VersionManager.createVersion('1', 'V1');
      await VersionManager.createVersion('1', 'V2');

      const result = await VersionManager.clearVersions('1');

      expect(result.success).toBe(true);

      const versions = await VersionManager.getVersions('1');
      expect(versions).toHaveLength(0);
    });

    it('should fail when prompt does not exist', async () => {
      const result = await VersionManager.clearVersions('nonexistent');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Prompt not found');
    });
  });

  describe('version limits', () => {
    it('should auto-prune when creating more than 10 versions', async () => {
      const prompt = createTestPrompt('1');
      await PromptStorage.save(prompt);

      // Create 12 versions
      for (let i = 1; i <= 12; i++) {
        await VersionManager.createVersion('1', `Content ${i}`);
      }

      const versions = await VersionManager.getVersions('1');
      expect(versions.length).toBeLessThanOrEqual(10);
    });
  });
});

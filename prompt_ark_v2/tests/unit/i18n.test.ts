/**
 * @fileoverview i18n locale validation tests for Prompt Ark v2
 *
 * These tests validate that all locale files match the LocaleDict type structure
 * and contain all required translation keys.
 */

import { describe, it, expect } from 'vitest';
import type { LocaleDict } from '../../src/i18n/types';
import { en } from '../../src/i18n/locales/en';
import { zhCN } from '../../src/i18n/locales/zh-CN';

describe('i18n Locale Files', () => {
  describe('LocaleDict Structure Validation', () => {
    it('en locale should have all required top-level keys', () => {
      const requiredKeys: Array<keyof LocaleDict> = [
        'app',
        'prompt',
        'action',
        'variables',
        'settings',
        'ai',
        'sync',
        'share',
        'import',
        'filter',
        'pagination',
        'contextMenu',
        'quickAction',
        'category',
        'imagePrompt',
        'outputRules',
        'skillMode',
        'videoPrompt',
        'history',
        'timeAgo',
        'context',
        'quality',
        'openclaw',
        'translation',
        'skillManager',
        'tabs',
        'metadata',
        'error',
        'errors',
      ];

      const enKeys = Object.keys(en).sort();
      const expectedKeys = requiredKeys.sort();

      expect(enKeys).toEqual(expectedKeys);
    });

    it('zhCN locale should have all required top-level keys', () => {
      const requiredKeys: Array<keyof LocaleDict> = [
        'app',
        'prompt',
        'action',
        'variables',
        'settings',
        'ai',
        'sync',
        'share',
        'import',
        'filter',
        'pagination',
        'contextMenu',
        'quickAction',
        'category',
        'imagePrompt',
        'outputRules',
        'skillMode',
        'videoPrompt',
        'history',
        'timeAgo',
        'context',
        'quality',
        'openclaw',
        'translation',
        'skillManager',
        'tabs',
        'metadata',
        'error',
        'errors',
      ];

      const zhCNKeys = Object.keys(zhCN).sort();
      const expectedKeys = requiredKeys.sort();

      expect(zhCNKeys).toEqual(expectedKeys);
    });

    it('en and zhCN should have identical key structure', () => {
      const enKeys = Object.keys(en).sort();
      const zhCNKeys = Object.keys(zhCN).sort();

      expect(enKeys).toEqual(zhCNKeys);
    });
  });

  describe('app namespace', () => {
    it('should have all required keys in en', () => {
      expect(en.app.name).toBeTypeOf('string');
      expect(en.app.description).toBeTypeOf('string');
      expect(en.app.shortcutHint).toBeTypeOf('string');
    });

    it('should have all required keys in zhCN', () => {
      expect(zhCN.app.name).toBeTypeOf('string');
      expect(zhCN.app.description).toBeTypeOf('string');
      expect(zhCN.app.shortcutHint).toBeTypeOf('string');
    });
  });

  describe('prompt namespace', () => {
    const requiredKeys = [
      'new',
      'edit',
      'searchPlaceholder',
      'title',
      'titlePlaceholder',
      'category',
      'content',
      'contentHint',
      'contentEmpty',
      'save',
      'cancel',
      'deleteConfirm',
      'noPrompts',
      'createFirst',
      'shortcut',
      'shortcutHint',
      'history',
      'versionPreview',
      'restore',
    ];

    it('en should have all prompt keys', () => {
      for (const key of requiredKeys) {
        expect(
          en.prompt[key as keyof typeof en.prompt],
          `Missing prompt.${key} in en`
        ).toBeTypeOf('string');
      }
    });

    it('zhCN should have all prompt keys', () => {
      for (const key of requiredKeys) {
        expect(
          zhCN.prompt[key as keyof typeof zhCN.prompt],
          `Missing prompt.${key} in zhCN`
        ).toBeTypeOf('string');
      }
    });
  });

  describe('action namespace', () => {
    const requiredKeys = [
      'insert',
      'insertSuccess',
      'insertError',
      'inputNotFound',
      'copySuccess',
      'import',
      'export',
      'importSuccess',
      'exportSuccess',
      'preview',
      'edit',
      'delete',
      'copy',
      'testConnection',
    ];

    it('en should have all action keys', () => {
      for (const key of requiredKeys) {
        expect(
          en.action[key as keyof typeof en.action],
          `Missing action.${key} in en`
        ).toBeTypeOf('string');
      }
    });

    it('zhCN should have all action keys', () => {
      for (const key of requiredKeys) {
        expect(
          zhCN.action[key as keyof typeof zhCN.action],
          `Missing action.${key} in zhCN`
        ).toBeTypeOf('string');
      }
    });
  });

  describe('sync namespace', () => {
    const requiredKeys = [
      'title',
      'engine',
      'engineHint',
      'noSync',
      'noSyncHint',
      'chromeSync',
      'chromeSyncHint',
      'forceSyncChrome',
      'gistSync',
      'gistSyncHint',
      'gistId',
      'forceSyncGist',
      'webdavSync',
      'webdavSyncHint',
      'webdavUrl',
      'webdavUser',
      'webdavPassword',
      'forceSyncWebdav',
      'obsidianSync',
      'obsidianVaultTitle',
      'obsidianVaultHint',
      'obsidianWebdavUrl',
      'obsidianWebdavUser',
      'obsidianWebdavPassword',
      'obsidianFolder',
      'forceSyncObsidian',
      'obsidianLocalSync',
      'obsidianLocalTitle',
      'obsidianLocalHint',
      'obsidianSyncCategory',
      'obsidianSyncCategoryHint',
      'obsidianLocalPort',
      'obsidianLocalApiKey',
      'forceSyncObsidianLocal',
      'githubToken',
      'githubTokenHint',
      'githubTokenPlaceholder',
    ];

    it('en should have all sync keys', () => {
      for (const key of requiredKeys) {
        expect(
          en.sync[key as keyof typeof en.sync],
          `Missing sync.${key} in en`
        ).toBeTypeOf('string');
      }
    });

    it('zhCN should have all sync keys', () => {
      for (const key of requiredKeys) {
        expect(
          zhCN.sync[key as keyof typeof zhCN.sync],
          `Missing sync.${key} in zhCN`
        ).toBeTypeOf('string');
      }
    });
  });

  describe('share namespace', () => {
    const requiredKeys = [
      'title',
      'share',
      'favorite',
      'packMode',
      'packShare',
      'packSharing',
      'packSelectOne',
      'packShareFailed',
      'packTitlePlaceholder',
      'shareToX',
      'shareToReddit',
      'shareToZhihu',
      'shareToWechat',
      'shareToXiaohongshu',
      'shareToLinkedIn',
      'copyLink',
      'copyAsJson',
      'linkCopied',
      'jsonCopied',
      'shareFailed',
      'selected',
      'configureGithubToken',
      'promptSharing',
      'sharePromptPack',
    ];

    it('en should have all share keys', () => {
      for (const key of requiredKeys) {
        expect(
          en.share[key as keyof typeof en.share],
          `Missing share.${key} in en`
        ).toBeTypeOf('string');
      }
    });

    it('zhCN should have all share keys', () => {
      for (const key of requiredKeys) {
        expect(
          zhCN.share[key as keyof typeof zhCN.share],
          `Missing share.${key} in zhCN`
        ).toBeTypeOf('string');
      }
    });
  });

  describe('import namespace', () => {
    const requiredKeys = [
      'title',
      'defaultPlatform',
      'tabPaste',
      'tabUrl',
      'pasteHint',
      'pastePlaceholder',
      'urlHint',
      'scan',
      'confirm',
      'confirmImport',
      'deepScan',
      'minScore',
      'scanning',
      'scanFailed',
      'scanParsing',
      'scanParsed',
      'scanDone',
      'scanNonePassed',
      'scanNoPrompts',
      'aiAnalyzing',
      'promptsFiltered',
      'avgScore',
      'qualityHigh',
      'qualityMid',
      'qualityLow',
      'emptyData',
      'parseFailed',
      'noValidPrompts',
      'importError',
    ];

    it('en should have all import keys', () => {
      for (const key of requiredKeys) {
        expect(
          en.import[key as keyof typeof en.import],
          `Missing import.${key} in en`
        ).toBeTypeOf('string');
      }
    });

    it('zhCN should have all import keys', () => {
      for (const key of requiredKeys) {
        expect(
          zhCN.import[key as keyof typeof zhCN.import],
          `Missing import.${key} in zhCN`
        ).toBeTypeOf('string');
      }
    });
  });

  describe('contextMenu namespace', () => {
    const requiredKeys = [
      'addPrompt',
      'saveSuccess',
      'convertPrompt',
      'promptsList',
      'convertStart',
      'convertSuccess',
      'convertError',
      'noPageText',
      'smartConvertNoProvider',
      'shareArticle',
      'selectionToolbarAdd',
      'selectionToolbarConvert',
    ];

    it('en should have all contextMenu keys', () => {
      for (const key of requiredKeys) {
        expect(
          en.contextMenu[key as keyof typeof en.contextMenu],
          `Missing contextMenu.${key} in en`
        ).toBeTypeOf('string');
      }
    });

    it('zhCN should have all contextMenu keys', () => {
      for (const key of requiredKeys) {
        expect(
          zhCN.contextMenu[key as keyof typeof zhCN.contextMenu],
          `Missing contextMenu.${key} in zhCN`
        ).toBeTypeOf('string');
      }
    });
  });

  describe('skillMode namespace', () => {
    const requiredKeys = [
      'title',
      'hint',
      'systemPrompt',
      'systemPromptHint',
      'knowledgeSnippets',
      'knowledgeSnippetsHint',
      'addSnippet',
    ];

    it('en should have all skillMode keys', () => {
      for (const key of requiredKeys) {
        expect(
          en.skillMode[key as keyof typeof en.skillMode],
          `Missing skillMode.${key} in en`
        ).toBeTypeOf('string');
      }
    });

    it('zhCN should have all skillMode keys', () => {
      for (const key of requiredKeys) {
        expect(
          zhCN.skillMode[key as keyof typeof zhCN.skillMode],
          `Missing skillMode.${key} in zhCN`
        ).toBeTypeOf('string');
      }
    });
  });

  describe('videoPrompt namespace', () => {
    const requiredKeys = [
      'title',
      'videoToPrompt',
      'styleTransfer',
      'completeAnalysis',
      'inspirationCreation',
      'copyAllVocab',
      'styleTransferDesc',
      'completeAnalysisDesc',
      'inspirationCreationDesc',
      'copyStyleBlock',
      'youtubeVideoPrompt',
      'videoAnalysisSaved',
    ];

    it('en should have all videoPrompt keys', () => {
      for (const key of requiredKeys) {
        expect(
          en.videoPrompt[key as keyof typeof en.videoPrompt],
          `Missing videoPrompt.${key} in en`
        ).toBeTypeOf('string');
      }
    });

    it('zhCN should have all videoPrompt keys', () => {
      for (const key of requiredKeys) {
        expect(
          zhCN.videoPrompt[key as keyof typeof zhCN.videoPrompt],
          `Missing videoPrompt.${key} in zhCN`
        ).toBeTypeOf('string');
      }
    });
  });

  describe('metadata namespace', () => {
    const requiredKeys = [
      'source',
      'from',
      'captured',
      'method',
      'methodSmartConvert',
      'methodQuickAdd',
      'copyBtn',
      'openBtn',
      'promptCopied',
      'sourceTextCopied',
      'saveFailed',
    ];

    it('en should have all metadata keys', () => {
      for (const key of requiredKeys) {
        expect(
          en.metadata[key as keyof typeof en.metadata],
          `Missing metadata.${key} in en`
        ).toBeTypeOf('string');
      }
    });

    it('zhCN should have all metadata keys', () => {
      for (const key of requiredKeys) {
        expect(
          zhCN.metadata[key as keyof typeof zhCN.metadata],
          `Missing metadata.${key} in zhCN`
        ).toBeTypeOf('string');
      }
    });
  });

  describe('errors namespace', () => {
    const requiredKeys = [
      'ERR_GIST_NOT_ENABLED',
      'ERR_GIST_NO_TOKEN',
      'ERR_GIST_EMPTY_ID_AUTO_CREATE',
      'ERR_GIST_NO_CONTENT',
      'ERR_GIST_PARSE_FAILED',
      'MSG_GIST_SYNC_SUCCESS',
      'ERR_WEBDAV_NOT_ENABLED',
      'ERR_WEBDAV_MISSING_CONFIG',
      'ERR_WEBDAV_EMPTY_AUTO_CREATE',
      'ERR_WEBDAV_PARSE_FAILED',
      'MSG_WEBDAV_SYNC_SUCCESS',
      'ERR_WEBDAV_TIMEOUT',
      'ERR_WEBDAV_AUTH_FAILED',
      'ERR_WEBDAV_MKCOL_FAILED',
      'ERR_WEBDAV_409',
      'ERR_OBSIDIAN_NOT_ENABLED',
      'ERR_OBSIDIAN_MISSING_CONFIG',
      'ERR_OBSIDIAN_DIR_NOT_FOUND_AUTO_CREATE',
      'MSG_OBSIDIAN_SYNC_SUCCESS',
      'MSG_OBSIDIAN_EMPTY_PUSHED',
      'ERR_OBSIDIAN_LOCAL_NOT_ENABLED',
      'ERR_OBSIDIAN_LOCAL_OFFLINE',
      'ERR_OBSIDIAN_LOCAL_FETCH_FAILED',
    ];

    it('en should have all errors keys', () => {
      for (const key of requiredKeys) {
        expect(
          en.errors[key as keyof typeof en.errors],
          `Missing errors.${key} in en`
        ).toBeTypeOf('string');
      }
    });

    it('zhCN should have all errors keys', () => {
      for (const key of requiredKeys) {
        expect(
          zhCN.errors[key as keyof typeof zhCN.errors],
          `Missing errors.${key} in zhCN`
        ).toBeTypeOf('string');
      }
    });
  });

  describe('Translation values validation', () => {
    it('en translations should not be empty strings', () => {
      const checkNotEmpty = (obj: Record<string, unknown>, path: string) => {
        for (const [key, value] of Object.entries(obj)) {
          const fullPath = path ? `${path}.${key}` : key;
          if (typeof value === 'string') {
            expect(value.trim(), `${fullPath} should not be empty`).not.toBe('');
          } else if (typeof value === 'object' && value !== null) {
            checkNotEmpty(value as Record<string, unknown>, fullPath);
          }
        }
      };

      checkNotEmpty(en as unknown as Record<string, unknown>, 'en');
    });

    it('zhCN translations should not be empty strings', () => {
      const checkNotEmpty = (obj: Record<string, unknown>, path: string) => {
        for (const [key, value] of Object.entries(obj)) {
          const fullPath = path ? `${path}.${key}` : key;
          if (typeof value === 'string') {
            expect(value.trim(), `${fullPath} should not be empty`).not.toBe('');
          } else if (typeof value === 'object' && value !== null) {
            checkNotEmpty(value as Record<string, unknown>, fullPath);
          }
        }
      };

      checkNotEmpty(zhCN as unknown as Record<string, unknown>, 'zhCN');
    });
  });

  describe('Template variables preservation', () => {
    it('should preserve {count} template variable in importSuccess', () => {
      expect(en.action.importSuccess).toContain('{count}');
      expect(zhCN.action.importSuccess).toContain('{count}');
    });

    it('should preserve {name} template variable in optimizeWith', () => {
      expect(en.ai.optimizeWith).toContain('{name}');
      expect(zhCN.ai.optimizeWith).toContain('{name}');
    });

    it('should preserve {current} and {total} template variables in pageInfo', () => {
      expect(en.pagination.pageInfo).toContain('{current}');
      expect(en.pagination.pageInfo).toContain('{total}');
      expect(zhCN.pagination.pageInfo).toContain('{current}');
      expect(zhCN.pagination.pageInfo).toContain('{total}');
    });

    it('should preserve template variables in confirmImport', () => {
      expect(en.import.confirmImport).toContain('{count}');
      expect(zhCN.import.confirmImport).toContain('{count}');
    });

    it('should preserve template variables in scanParsing', () => {
      expect(en.import.scanParsing).toContain('{count}');
      expect(zhCN.import.scanParsing).toContain('{count}');
    });

    it('should preserve template variables in scanParsed', () => {
      expect(en.import.scanParsed).toContain('{total}');
      expect(en.import.scanParsed).toContain('{passed}');
      expect(en.import.scanParsed).toContain('{min}');
      expect(zhCN.import.scanParsed).toContain('{total}');
      expect(zhCN.import.scanParsed).toContain('{passed}');
      expect(zhCN.import.scanParsed).toContain('{min}');
    });

    it('should preserve template variables in scanDone', () => {
      expect(en.import.scanDone).toContain('{analyzed}');
      expect(en.import.scanDone).toContain('{enriched}');
      expect(zhCN.import.scanDone).toContain('{analyzed}');
      expect(zhCN.import.scanDone).toContain('{enriched}');
    });

    it('should preserve template variables in scanNonePassed', () => {
      expect(en.import.scanNonePassed).toContain('{total}');
      expect(en.import.scanNonePassed).toContain('{min}');
      expect(zhCN.import.scanNonePassed).toContain('{total}');
      expect(zhCN.import.scanNonePassed).toContain('{min}');
    });

    it('should preserve template variables in scanNoPrompts', () => {
      expect(en.import.scanNoPrompts).toContain('{files}');
      expect(zhCN.import.scanNoPrompts).toContain('{files}');
    });

    it('should preserve {count} template variable in timeAgo', () => {
      expect(en.timeAgo.days).toContain('{count}');
      expect(en.timeAgo.hours).toContain('{count}');
      expect(en.timeAgo.minutes).toContain('{count}');
      expect(zhCN.timeAgo.days).toContain('{count}');
      expect(zhCN.timeAgo.hours).toContain('{count}');
      expect(zhCN.timeAgo.minutes).toContain('{count}');
    });
  });
});

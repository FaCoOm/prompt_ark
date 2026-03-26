# i18n Audit: v1 to v2 Migration

**Date**: 2026-03-26  
**Scope**: Complete translation key audit for Prompt Ark v2

## Summary

| Source | File | Key Count | Status |
|--------|------|-----------|--------|
| Chrome Extension i18n (en) | `_locales/en/messages.json` | 42 | ✅ Migrated to `public/_locales/` |
| Chrome Extension i18n (zh) | `_locales/zh_CN/messages.json` | 42 | ✅ Migrated to `public/_locales/` |
| UI Translations (zh_CN) | `locales.js` | ~155 | ⚠️ Need migration to `src/i18n/locales/zh-CN.ts` |
| UI Translations (en) | `locales.js` | ~155 | ⚠️ Need migration to `src/i18n/locales/en.ts` |

**Total Unique Keys**: ~311

## Key Categories

### 1. App (应用基础)
- `appName` / `appName`
- `appDesc` / `appDesc`
- `shortcutHint`

### 2. Prompt Management (提示词管理)
- `newPrompt`, `editPrompt`
- `searchPlaceholder`
- `title`, `category`, `content`, `contentHint`
- `save`, `cancel`, `deleteConfirm`
- `noPrompts`, `createFirst`

### 3. Actions (操作)
- `insert`, `insertSuccess`, `insertError`
- `copySuccess`
- `import`, `export`, `importSuccess`, `exportSuccess`

### 4. Variables (变量)
- `variables`, `fillVariables`

### 5. Settings (设置)
- `settings`, `language`, `theme`
- `auto`, `light`, `dark`
- `saveSettings`, `settingsSaved`

### 6. AI Providers (AI 提供商)
- `aiModels`, `addProvider`, `editProvider`, `deleteProvider`
- `providerName`, `providerType`, `providerModel`
- `providerTypeOpenai`, `providerTypeGeminiWeb`

### 7. Sync & Sharing (同步与分享)
- `syncAndSharing`, `syncEngine`
- `noSync`, `chromeSync`, `gistSync`, `webdavSync`, `obsidianSync`, `obsidianLocalSync`
- `sharePrompt`, `shareToX`, `shareToReddit`, `shareToZhihu`, `shareToWechat`, `shareToXiaohongshu`, `shareToLinkedIn`
- `packMode`, `packShare`, `packSelectOne`

### 8. Optimization (优化)
- `optimize`, `optimizeFailed`, `optimizeNeedCloud`
- `optimizeDiffTitle`, `optimizeAccept`, `optimizeReject`
- `variantConcise`, `variantEnhanced`, `variantPro`

### 9. Context Menu (右键菜单)
- `contextMenuAddPrompt`, `contextMenuSaveSuccess`
- `contextMenuConvertPrompt`, `contextMenuPromptsList`
- `contextMenuConvertStart`, `contextMenuConvertSuccess`, `contextMenuConvertError`

### 10. Quick Actions (快捷操作)
- `qaRewriteLabel`, `qaSummarizeLabel`, `qaExpandLabel`, `qaTranslateLabel`, `qaExplainLabel`

### 11. Error Messages (错误信息)
- Various `ERR_*` and `MSG_*` codes for sync errors

### 12. Filter & Sort (筛选排序)
- `categoryAll`, `favorites`, `mostUsed`, `recentlyUsed`
- `timeSortNewestFirst`, `timeSortOldestFirst`

### 13. Pagination (分页)
- `pageInfo`, `prevPage`, `nextPage`

### 14. Image Prompt (图片提示词)
- `imagePromptFeature`, `imagePromptGenerating`, `imagePromptError`

### 15. Output Rules (输出规则)
- `buildRules`, `ruleFormat`, `ruleTone`, `ruleLength`

## Migration Plan

### Phase 1: Infrastructure
1. Create `src/i18n/types.ts` with `LocaleDict` interface
2. Create `src/i18n/locales/en.ts` with all English translations
3. Create `src/i18n/locales/zh-CN.ts` with all Chinese translations
4. Create `src/i18n/context.tsx` with I18nProvider and useI18n hook

### Phase 2: Integration
1. Wrap app with I18nProvider in `src/entrypoints/sidepanel/main.tsx`
2. Update all UI components to use `t()` function
3. Add LanguageSelector component to settings

### Phase 3: Verification
1. Compare key counts between v1 and v2
2. Test all UI text displays correctly in both languages
3. Test language switching functionality

## Type Definition Structure

```typescript
// src/i18n/types.ts
export interface LocaleDict {
  app: {
    name: string;
    description: string;
    shortcutHint: string;
  };
  prompt: {
    new: string;
    edit: string;
    searchPlaceholder: string;
    title: string;
    category: string;
    content: string;
    contentHint: string;
    save: string;
    cancel: string;
    deleteConfirm: string;
    noPrompts: string;
    createFirst: string;
  };
  action: {
    insert: string;
    insertSuccess: string;
    insertError: string;
    copySuccess: string;
    import: string;
    export: string;
    importSuccess: string;
    exportSuccess: string;
  };
  // ... other categories
}
```

## Notes

- Use camelCase nested structure for better organization
- Keep Chrome extension i18n in `public/_locales/` for manifest.json only
- All UI translations move to `src/i18n/locales/*.ts`
- Support runtime language switching via settings
- Type-safe translations with TypeScript

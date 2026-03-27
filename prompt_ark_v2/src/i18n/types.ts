/**
 * i18n type definitions
 */

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
    titlePlaceholder: string;
    category: string;
    content: string;
    contentHint: string;
    contentEmpty: string;
    save: string;
    cancel: string;
    deleteConfirm: string;
    noPrompts: string;
    createFirst: string;
    shortcut: string;
    shortcutHint: string;
    history: string;
    versionPreview: string;
    restore: string;
  };
  action: {
    insert: string;
    insertSuccess: string;
    insertError: string;
    inputNotFound: string;
    copySuccess: string;
    import: string;
    export: string;
    importSuccess: string;
    exportSuccess: string;
    preview: string;
    edit: string;
    delete: string;
    copy: string;
    testConnection: string;
  };
  variables: {
    title: string;
    fill: string;
    hint: string;
  };
  settings: {
    title: string;
    language: string;
    theme: string;
    themeAuto: string;
    themeLight: string;
    themeDark: string;
    save: string;
    saved: string;
    requiredFields: string;
    saveError: string;
  };
  ai: {
    models: string;
    addProvider: string;
    editProvider: string;
    deleteProvider: string;
    deleteProviderConfirm: string;
    providerName: string;
    providerType: string;
    providerModel: string;
    typeOpenai: string;
    typeGeminiWeb: string;
    geminiWebLoginRequired: string;
    optimize: string;
    optimizeFailed: string;
    optimizeNeedCloud: string;
    selectModel: string;
    optimizeWith: string;
    variantConcise: string;
    variantEnhanced: string;
    variantPro: string;
    optimizeDiffTitle: string;
    optimizeAccept: string;
    optimizeReject: string;
  };
  sync: {
    title: string;
    engine: string;
    engineHint: string;
    noSync: string;
    noSyncHint: string;
    chromeSync: string;
    chromeSyncHint: string;
    forceSyncChrome: string;
    gistSync: string;
    gistSyncHint: string;
    gistId: string;
    forceSyncGist: string;
    webdavSync: string;
    webdavSyncHint: string;
    webdavUrl: string;
    webdavUser: string;
    webdavPassword: string;
    forceSyncWebdav: string;
    obsidianSync: string;
    obsidianVaultTitle: string;
    obsidianVaultHint: string;
    obsidianWebdavUrl: string;
    obsidianWebdavUser: string;
    obsidianWebdavPassword: string;
    obsidianFolder: string;
    forceSyncObsidian: string;
    obsidianLocalSync: string;
    obsidianLocalTitle: string;
    obsidianLocalHint: string;
    obsidianSyncCategory: string;
    obsidianSyncCategoryHint: string;
    obsidianLocalPort: string;
    obsidianLocalApiKey: string;
    forceSyncObsidianLocal: string;
    githubToken: string;
    githubTokenHint: string;
    githubTokenPlaceholder: string;
  };
  share: {
    title: string;
    share: string;
    favorite: string;
    packMode: string;
    packShare: string;
    packSharing: string;
    packSelectOne: string;
    packShareFailed: string;
    packTitlePlaceholder: string;
    shareToX: string;
    shareToReddit: string;
    shareToZhihu: string;
    shareToWechat: string;
    shareToXiaohongshu: string;
    shareToLinkedIn: string;
    copyLink: string;
    copyAsJson: string;
    linkCopied: string;
    jsonCopied: string;
    shareFailed: string;
    selected: string;
    configureGithubToken: string;
    promptSharing: string;
    sharePromptPack: string;
  };
  import: {
    title: string;
    defaultPlatform: string;
    tabPaste: string;
    tabUrl: string;
    pasteHint: string;
    pastePlaceholder: string;
    urlHint: string;
    scan: string;
    confirm: string;
    confirmImport: string;
    deepScan: string;
    minScore: string;
    scanning: string;
    scanFailed: string;
    scanParsing: string;
    scanParsed: string;
    scanDone: string;
    scanNonePassed: string;
    scanNoPrompts: string;
    aiAnalyzing: string;
    promptsFiltered: string;
    avgScore: string;
    qualityHigh: string;
    qualityMid: string;
    qualityLow: string;
    emptyData: string;
    parseFailed: string;
    noValidPrompts: string;
    importError: string;
  };
  filter: {
    categoryAll: string;
    favorites: string;
    mostUsed: string;
    recentlyUsed: string;
    timeSortNewestFirst: string;
    timeSortOldestFirst: string;
  };
  pagination: {
    pageInfo: string;
    prevPage: string;
    nextPage: string;
  };
  contextMenu: {
    addPrompt: string;
    saveSuccess: string;
    convertPrompt: string;
    promptsList: string;
    convertStart: string;
    convertSuccess: string;
    convertError: string;
    noPageText: string;
    smartConvertNoProvider: string;
    shareArticle: string;
    selectionToolbarAdd: string;
    selectionToolbarConvert: string;
  };
  quickAction: {
    rewriteLabel: string;
    summarizeLabel: string;
    expandLabel: string;
    translateLabel: string;
    explainLabel: string;
  };
  category: {
    rename: string;
    renamePrompt: string;
  };
  imagePrompt: {
    feature: string;
    featureHint: string;
    enable: string;
    recognitionModel: string;
    recognitionModelHint: string;
    noProvider: string;
    generating: string;
    retry: string;
    cancel: string;
    copy: string;
    save: string;
    regenerate: string;
    nanobanana: string;
    error: string;
  };
  outputRules: {
    build: string;
    format: string;
    formatAuto: string;
    formatMarkdown: string;
    formatJson: string;
    formatTable: string;
    formatText: string;
    formatCode: string;
    length: string;
    lengthSuffix: string;
    tone: string;
    toneDefault: string;
    toneProfessional: string;
    toneConcise: string;
    toneCreative: string;
    exclusions: string;
    exclusionsPlaceholder: string;
    insert: string;
    toastEmpty: string;
    toastExists: string;
    toastSuccess: string;
  };
  skillMode: {
    title: string;
    hint: string;
    systemPrompt: string;
    systemPromptHint: string;
    knowledgeSnippets: string;
    knowledgeSnippetsHint: string;
    addSnippet: string;
  };
  videoPrompt: {
    title: string;
    videoToPrompt: string;
    styleTransfer: string;
    completeAnalysis: string;
    inspirationCreation: string;
    copyAllVocab: string;
    styleTransferDesc: string;
    completeAnalysisDesc: string;
    inspirationCreationDesc: string;
    copyStyleBlock: string;
    youtubeVideoPrompt: string;
    videoAnalysisSaved: string;
  };
  history: {
    title: string;
    noHistoryYet: string;
  };
  timeAgo: {
    days: string;
    hours: string;
    minutes: string;
    justNow: string;
  };
  context: {
    varsResolved: string;
  };
  quality: {
    title: string;
  };
  openclaw: {
    hint: string;
    settings: string;
    promptToSkill: string;
    publishToHub: string;
    selectProvider: string;
  };
  translation: {
    translate: string;
    copySourceText: string;
    openSourcePage: string;
    translatePrompt: string;
  };
  skillManager: {
    title: string;
  };
  tabs: {
    general: string;
    models: string;
    sync: string;
  };
  metadata: {
    source: string;
    from: string;
    captured: string;
    method: string;
    methodSmartConvert: string;
    methodQuickAdd: string;
    copyBtn: string;
    openBtn: string;
    promptCopied: string;
    sourceTextCopied: string;
    saveFailed: string;
  };
  error: {
    permissionDenied: string;
    inputNotFound: string;
    extensionReload: string;
  };
  errors: {
    ERR_GIST_NOT_ENABLED: string;
    ERR_GIST_NO_TOKEN: string;
    ERR_GIST_EMPTY_ID_AUTO_CREATE: string;
    ERR_GIST_NO_CONTENT: string;
    ERR_GIST_PARSE_FAILED: string;
    MSG_GIST_SYNC_SUCCESS: string;
    ERR_WEBDAV_NOT_ENABLED: string;
    ERR_WEBDAV_MISSING_CONFIG: string;
    ERR_WEBDAV_EMPTY_AUTO_CREATE: string;
    ERR_WEBDAV_PARSE_FAILED: string;
    MSG_WEBDAV_SYNC_SUCCESS: string;
    ERR_WEBDAV_TIMEOUT: string;
    ERR_WEBDAV_AUTH_FAILED: string;
    ERR_WEBDAV_MKCOL_FAILED: string;
    ERR_WEBDAV_409: string;
    ERR_OBSIDIAN_NOT_ENABLED: string;
    ERR_OBSIDIAN_MISSING_CONFIG: string;
    ERR_OBSIDIAN_DIR_NOT_FOUND_AUTO_CREATE: string;
    MSG_OBSIDIAN_SYNC_SUCCESS: string;
    MSG_OBSIDIAN_EMPTY_PUSHED: string;
    ERR_OBSIDIAN_LOCAL_NOT_ENABLED: string;
    ERR_OBSIDIAN_LOCAL_OFFLINE: string;
    ERR_OBSIDIAN_LOCAL_FETCH_FAILED: string;
  };
}

export type Locale = 'en' | 'zh-CN';

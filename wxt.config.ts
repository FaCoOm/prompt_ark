import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  extensionApi: 'chrome',
  
  manifest: {
    manifest_version: 3,
    name: '__MSG_appName__',
    version: '1.0.0',
    default_locale: 'zh_CN',
    description: '__MSG_appDesc__',
    
    permissions: [
      'storage',
      'unlimitedStorage',
      'activeTab',
      'scripting',
      'contextMenus',
      'sidePanel',
      'cookies',
      'tabs',
      'notifications',
    ],
    
    host_permissions: [
      'https://generativelanguage.googleapis.com/*',
      'https://chat.openai.com/*',
      'https://chatgpt.com/*',
      'https://claude.ai/*',
      'https://gemini.google.com/*',
      'https://notebooklm.google.com/*',
      'https://aistudio.google.com/*',
      'https://grok.com/*',
      'https://chat.deepseek.com/*',
      'https://kimi.com/*',
      'https://kimi.moonshot.cn/*',
      'https://chatglm.cn/*',
      'https://www.doubao.com/*',
      'https://doubao.com/*',
      'https://yiyan.baidu.com/*',
      'https://tongyi.aliyun.com/*',
      'https://chat.qwen.ai/*',
      'https://hailuoai.com/*',
      'https://www.hailuoai.com/*',
      'https://hunyuan.tencent.com/*',
      '<all_urls>',
    ],
    
    web_accessible_resources: [
      {
        resources: ['image-prompt.html', 'image-prompt.js'],
        matches: ['<all_urls>'],
      },
    ],
    
    action: {
      default_popup: 'popup.html',
      default_title: 'Prompt Ark',
      default_icon: {
        16: 'icons/icon16.png',
        48: 'icons/icon48.png',
        128: 'icons/icon128.png',
      },
    },
    
    commands: {
      'open-picker': {
        suggested_key: {
          default: 'Ctrl+Shift+P',
          mac: 'Command+Shift+P',
        },
        description: '__MSG_openPickerDesc__',
      },
      'grab-context': {
        suggested_key: {
          default: 'Ctrl+Shift+G',
          mac: 'Command+Shift+G',
        },
        description: '__MSG_grabContextDesc__',
      },
      'share-article': {
        suggested_key: {
          default: 'Ctrl+Shift+Y',
          mac: 'Command+Shift+Y',
        },
        description: '__MSG_shareArticleDesc__',
      },
    },
    
    externally_connectable: {
      matches: ['http://localhost:5173/*'],
    },
  },
  
  // Development configuration
  runner: {
    chromiumBinary: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    firefoxBinary: '/Applications/Firefox.app/Contents/MacOS/firefox',
    startUrls: ['https://chatgpt.com'],
  },
  
  // Build configuration
  zip: {
    artifactTemplate: '{{name}}-{{version}}-{{browser}}.zip',
  },
  
  // Vite configuration
  vite: () => ({
    resolve: {
      alias: {
        '@': '/src',
        '@shared': '/src/shared',
        '@components': '/src/components',
        '@stores': '/src/stores',
        '@features': '/src/features',
        '@platforms': '/src/platforms',
      },
    },
  }),
});
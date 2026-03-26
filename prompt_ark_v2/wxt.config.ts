import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-solid'],
  manifest: {
    name: '__MSG_appName__',
    description: '__MSG_appDesc__',
    version: '2.0.0',
    manifest_version: 3,
    default_locale: 'en',
    permissions: [
      'storage',
      'contextMenus',
      'scripting',
      'cookies',
      'sidePanel',
      'activeTab',
    ],
    host_permissions: [
      'https://chatgpt.com/*',
      'https://claude.ai/*',
      'https://gemini.google.com/*',
      'https://www.gemini.google.com/*',
      'https://chat.deepseek.com/*',
      'https://kimi.moonshot.cn/*',
      'https://www.doubao.com/*',
      'https://tongyi.aliyun.com/*',
      'https://chatglm.cn/*',
      'https://hailuoai.video/*',
      'https://yuanbao.tencent.com/*',
      'https://grok.com/*',
      'https://notebooklm.google.com/*',
      'https://aistudio.google.com/*',
      'https://www.perplexity.ai/*',
      'https://yiyan.baidu.com/*',
      'https://yuewen.cn/*',
    ],
    action: {
      default_popup: 'popup.html',
    },
    side_panel: {
      default_path: 'sidepanel.html',
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
    },
  },
});

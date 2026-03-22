import { defineBackground } from 'wxt/sandbox';

export default defineBackground(() => {
  console.log(`🔥 [background.ts] v${chrome.runtime.getManifest().version} loaded`);
  
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error('Side panel setup failed:', error));
  
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[Background] Received message:', message.type);
    sendResponse({ success: true, message: 'Background initialized' });
    return true;
  });
});
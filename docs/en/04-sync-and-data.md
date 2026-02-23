# Sync, Data & Settings

## Which Sync Method Should I Use?

| Method | Setup | Capacity | Best for |
|---|---|---|---|
| **Chrome Sync** | Zero (default) | ~100KB | Personal use, small library |
| **GitHub Gist** | Paste a token | Unlimited | Power users, teams, large libraries |
| **WebDAV** | Enter server URL + credentials | Depends on server | Privacy-first, self-hosted, China (Jianguoyun) |

## Chrome Sync (Default)
Works automatically. Your prompts sync across all Chrome instances signed into the same Google account.

> ⚠️ Chrome Sync has a ~100KB quota. If you hit it, switch to Gist or WebDAV.

## GitHub Gist Sync
1. **Settings → Sync** → Select **GitHub Gist**
2. Paste your **GitHub Token** (needs `gist` scope)
3. Leave Gist ID blank — auto-created on first sync
4. Click **Force Sync Gist**

## WebDAV Sync
1. **Settings → Sync** → Select **WebDAV**
2. Enter your **WebDAV URL**, **Username**, **App Password**
3. Click **Force Sync WebDAV**

> Popular WebDAV services: Jianguoyun (坚果云), Nextcloud, Synology

## JSON Export / Import
- **Export**: Settings gear → Export → Downloads a `.json` file
- **Import**: Paste tab (raw text/JSON) or URL tab (fetch from URL)

## GitHub Token — Why You Want One

Your GitHub Token (Settings → Sync) unlocks three things:

| Capability | Without token | With token |
|---|---|---|
| Gist Sync | ❌ | ✅ |
| Prompt Sharing | ❌ | ✅ |
| GitHub URL Import | 60 req/hr (often hits limit) | **5000 req/hr** |

## Auto-Save
Every setting (all tabs) auto-saves with a 600ms debounce. No "Save" button needed, except when adding/editing model providers (explicit Save button for safety).

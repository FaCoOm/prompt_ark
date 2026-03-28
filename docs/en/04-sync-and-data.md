# Sync, Data & Settings

## Which Sync Method Should I Use?

| Method | Setup | Capacity | Best for |
|---|---|---|---|
| **Local Only** | Zero (default) | Device storage | Private single-device use |
| **WebDAV** | Enter server URL + credentials | Depends on server | Privacy-first, self-hosted, China (Jianguoyun) |
| **Obsidian Vault (WebDAV)** | Enter vault WebDAV credentials | Depends on server | Markdown-first workflows and Obsidian users |

## Local Only (Default)
Works out of the box and keeps everything on the current device.

> ⚠️ If you need cross-device sync, switch to WebDAV or Obsidian Vault sync.

## WebDAV Sync
1. **Settings → Sync** → Select **WebDAV**
2. Enter your **WebDAV URL**, **Username**, **App Password**
3. Click **Force Sync WebDAV**

> Popular WebDAV services: Jianguoyun (坚果云), Nextcloud, Synology

## Obsidian Vault Sync
1. **Settings → Sync** → Select **Obsidian Vault (WebDAV)**
2. Enter your vault WebDAV **URL**, **Username**, **App Password**, and target folder
3. Click **Force Sync Obsidian**

## JSON Export / Import
- **Export**: Settings gear → Export → Downloads a `.json` file
- **Import**: Paste tab (raw text/JSON) or URL tab (file URL / GitHub repo / GitHub folder)

## GitHub Token — Why You Want One

Your GitHub Token in the URL import tab helps with GitHub-based import workflows:

| Capability | Without token | With token |
|---|---|---|
| GitHub URL Import | 60 req/hr (often hits limit) | **5000 req/hr** |
| GitHub repo scanning | More likely to hit rate limits | Much smoother on large repos |

## Auto-Save
Every setting (all tabs) auto-saves with a 600ms debounce. No "Save" button needed, except when adding/editing model providers (explicit Save button for safety).

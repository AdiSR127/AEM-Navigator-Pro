# AEM Navigator Pro

> **Stop hunting for URLs. Start Navigating.**

A powerful Chrome Extension built for Adobe Experience Manager developers, technical consultants, and solution architects. AEM Navigator Pro puts every console, diagnostic tool, and page-level JCR insight one click away — without ever leaving your current page.

---

## Preview

```
┌─────────────────────────────────────────────┐
│  AEM NAVIGATOR PRO                      ⚙️  │
│  ┌─────────────────────────────────────┐    │
│  │  Search tools...                    │    │
│  └─────────────────────────────────────┘    │
│  ── QUICK LINKS ──────────────────────────  │
│  Sites Console                              │
│  Assets / DAM                               │
│  ── AUTHORING ────────────────────────────  │
│  Page Editor                                │
│  Content Fragments                          │
│  ── DEVELOPMENT ──────────────────────────  │
│  CRX/DE                                     │
│  Package Manager                            │
│  OSGi Console                               │
│  ...                                        │
└─────────────────────────────────────────────┘

▼ Navigator  |  MY-PAGE  ·  cq:Page  ·  admin  ·  Activate
              [ Open in CRX/DE ]  [ View as Published ]  [ View JSON ]  [×]
```

---

## Features

### Smart Footer
A context-aware toolbar that appears at the bottom of every AEM page. It automatically reads the current JCR node and surfaces live metadata — no manual lookups needed.

| Field | Description |
|---|---|
| **Node** | Last segment of the current JCR path |
| **Type** | `jcr:primaryType` of the node (e.g. `cq:Page`) |
| **User** | Currently logged-in AEM user |
| **Mod By** | Last `cq:lastModifiedBy` value |
| **Status** | Last replication action (`Activate`, `Deactivate`, `Draft`) |

**Toolbar actions:**
- **Open in CRX/DE** — Jump directly to the node in CRX/DE Explorer
- **View as Published** — Preview the page with `wcmmode=disabled`
- **View JSON** — Open the `.infinity.json` representation of the node

### Tools Panel
A slide-out panel with a curated, searchable library of AEM tools and consoles — powered by your own Google Sheet so your team can maintain and extend it without touching any code.

- Instant **keyword search** across all tools
- **Categorised** by workflow: Quick Links, Authoring, Content Fragments, DAM, Development, Diagnostics, Replication, Security, and more
- Keyboard navigable — `↓ / ↑` arrows move through results, `Esc` closes the panel

### SPA Navigation Detection
AEM Sites uses client-side routing (SPA). Navigator Pro detects URL changes via `popstate`, `hashchange`, and a 500ms poll — fully compliant with AEM's strict Content Security Policy (no inline script injection).

### Keyboard Navigation
Full keyboard support inside the tools panel:
- `↓` from the search box moves focus into the list
- `↑ / ↓` navigate between results
- `↑` from the first result returns focus to the search box
- `Esc` closes the panel from anywhere

### Draggable Launcher
The launcher tab sits on the right edge of the screen. Drag it up or down to reposition — its position is saved to `localStorage` and restored on every page load.

### Preferences
Toggle individual footer metadata fields on or off via the built-in preferences panel. Settings are persisted in Chrome's `storage.local`.

---

## Installation

### From Source

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions`
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked** and select the project folder
5. The AEM Navigator Pro tab will appear on the right side of any AEM page

### Requirements
- Google Chrome (Manifest V3)
- Adobe Experience Manager 6.5 or AEM as a Cloud Service

---

## Tools Sheet Setup

The tools panel is powered by a Google Sheet. To connect your own sheet:

1. Create a Google Sheet with columns: `Category`, `Tool Name`, `URL / Action`, `Notes`
2. Enable the **Google Sheets API** and generate an API key
3. In `content.js`, update the following constants:

```js
const API_KEY  = "YOUR_GOOGLE_SHEETS_API_KEY";
const SHEET_ID = "YOUR_SHEET_ID";
const RANGE    = "'Sheet1'!A2:D";
```

A pre-built tools inventory Excel (`AEM_Navigator_Pro_Tools_v2.xlsx`) is included in this repo as a starting point — import it into Google Sheets to get started instantly.

---

## Pages Supported

The extension activates on the following URL patterns:

| Pattern | Context |
|---|---|
| `*/editor.html/*` | Page Editor |
| `*/sites.html/*` | Sites Console |
| `*/assets.html/*` | Assets Console |
| `*/content/dam/*` | DAM paths |
| `*/content/*.html` | Published / preview pages |
| `*/crx/de/*` | CRX/DE Explorer |
| `*/crx/packmgr/*` | Package Manager |
| `*/system/console/*` | OSGi Console |

---

## Project Structure

```
AEM-Navigator-Pro/
├── manifest.json          # Chrome Extension manifest (MV3)
├── content.js             # Main content script — all UI and logic
├── content.css            # Extension styles
├── background.js          # Service worker — badge detection
├── images/
│   ├── logo-icon.png      # Extension logo
│   └── search.png
└── AEM_Navigator_Pro_Tools_v2.xlsx   # Tools inventory template
```

---

## Tech Stack

- **Chrome Extension Manifest V3** — content scripts, service worker, `chrome.storage`
- **Vanilla JS** — zero runtime dependencies
- **Google Sheets API v4** — live tools inventory
- **CSS** — isolated styles with `!important` scoping to avoid AEM style conflicts

---

## Author

**Aditya Singh**
[LinkedIn](https://www.linkedin.com/in/aditya-s-b29ab0120/)

---

## Privacy Policy
This extension, "AEM Navigator Pro," does not collect, store, or transmit any user data to any external server. All JCR metadata (e.g., Node Type, User, Status) are fetched locally from the user's authenticated AEM session and displayed only within the extension's interface. Users are advised to review the privacy policies of their respective Adobe Experience Manager instances.

## License

MIT

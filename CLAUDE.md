# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Skyblock Helper Desktop App - A Neutralino.js-based desktop application for Minecraft Hypixel Skyblock players that provides auction notifications and player statistics tracking.

## Build & Run Commands

### Initial Setup
```bash
npm i -g @neutralinojs/neu
neu update
```

### Development
```bash
npm run build    # Compile TypeScript only
npm start        # Compile TypeScript and run the app
neu run          # Run without rebuilding TypeScript
```

### Production Build
```bash
neu build        # Build the Neutralino app for distribution
```

## Architecture

### Framework: Neutralino.js
- Lightweight cross-platform desktop framework (alternative to Electron)
- Native API access via `Neutralino.*` global object
- Server runs on dynamic port (configured in `neutralino.config.json`)
- Document root: `/resources/`
- Binary name: `skyblock-app`
- Neutralino version: 6.4.0

### Technology Stack
- **Frontend**: Vanilla JavaScript (ES2020), HTML, CSS
- **TypeScript**: Used for some modules (compiled from `resources/typescript/` to `resources/dist/`)
- **Database**: SQL.js (SQLite in-memory with file persistence)
- **External API**: Coflnet API (`https://sky.coflnet.com/api`) for Hypixel Skyblock data

### Database Architecture
- **Location**: `Documents/SkyblockDesktopHelperApp/app.db`
- **Initialization**: `initialisedatabase.js` - Runs on app startup, creates DB directory and file if needed
- **Schema**: Single table `user_info` with columns: `id`, `name`, `apiKey`, `uuid`
  - The `uuid` column was added via migration (ALTER TABLE) after initial schema
- **Global Access**: `db` and `saveDb()` are globally available after initialization
- **Persistence**: Must call `saveDb()` after any DB modification to write changes to disk

### Page Navigation System
- **Main Container**: `#main` div in `index.html`
- **Rendering**: `renderPage(page)` function in `mainmenu.js` fetches HTML from `/pages/{page}.html` and injects into `#main`
- **Pages**:
  - `mainmenu` - Home page (default)
  - `settings` - User configuration (player name, API key)
  - `auctionNotifier` - Auction watching interface
- **Lifecycle Hooks**: After page load, specific init functions run (e.g., `loadSettings()` for settings page)

### User Settings Flow
1. User enters player name and API key in Settings page
2. `saveSettings()` in `settings.js`:
   - Stores in database
   - Fetches UUID from Coflnet API if player name changed
   - Updates global variables: `playerNameVar`, `apiKeyVar`, `uuidVar`
3. `loadSettings()` runs on app startup and when navigating to settings:
   - Loads data from DB
   - Populates global variables
   - Fetches UUID if missing in DB

### Auction Notifier System
- **Purpose**: Polls player's active auctions and notifies when they end/sell
- **Core Logic** in `auctionNotifier.js`:
  - `fetchActiveAuctionData(playerUuid)` - Gets all active auctions (paginated, max 4 pages)
  - Polls every 2 minutes while `subscribed === true`
  - Compares current vs previous auction lists to detect ended auctions
  - Sends OS notification via `sendNotification()` when auction ends
- **State Management**:
  - Checkbox state persisted in `localStorage.auctionNotifierSubscribed`
  - Polling runs in while loop controlled by `subscribed` flag

### Global Utilities
- `helpers.js`:
  - `sleep(ms)` - Promise-based delay
  - `loadJSFile(filename, extension)` - Dynamic script loading (unused currently, designed for lazy loading)
- `appsetup.js`:
  - Neutralino initialization and event listeners
  - System tray setup (disabled on macOS due to bug #615)
  - `sendNotification(title, body)` - OS notification wrapper

### Script Loading Order (from `index.html`)
1. Neutralino client library and test file
2. App setup and event listeners (`appsetup.js`)
3. Database initialization (`sql-wasm.js` → `initialisedatabase.js`)
4. Helper utilities and page modules
5. Feature modules (auction notifier, etc.)

## Development Patterns

### TypeScript Compilation
- TypeScript sources go in `resources/typescript/`
- Compiled output goes to `resources/dist/`
- Imported in HTML as `/dist/{filename}.js`

### Database Modifications
Always follow this pattern:
```javascript
db.run("SQL QUERY", [params]);
await saveDb();  // Critical: persist changes to disk
```

### Adding New Pages
1. Create HTML file in `resources/pages/{pagename}.html`
2. Create JS file in `resources/javascript/{pagename}.js`
3. Add script tag to `index.html`
4. Add sidebar button calling `renderPage('pagename')`
5. Add lifecycle logic in `renderPage()` if needed

### API Interactions
All Coflnet API calls use base URL: `https://sky.coflnet.com/api`
Key endpoints:
- `/search/player/{playerName}` - Get player UUID
- `/player/{uuid}/auctions?page={n}` - Get active auctions (paginated)
- `/auction/{auctionId}` - Get detailed auction data

### Neutralino Permissions
Native API allowlist (see `neutralino.config.json`):
- `app.*` - Application control
- `os.*` - OS operations (notifications, paths, tray)
- `filesystem.*` - File system access
- `debug.log` - Logging

## Known Issues & TODOs
- Window title needs update (currently "CHANGE THIS LATER")
- macOS tray menu disabled (Neutralino bug #615)
- Auction notifier notifications don't include sale details (only generic "Auction Ended!")

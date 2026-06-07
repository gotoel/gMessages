# gMessages

Desktop wrapper for [Google Messages](https://messages.google.com/web). Runs messages.google.com in Electron with session persistence, system tray, and native notifications.

## Requirements

- Node.js 18+
- Windows (primary target; should work on macOS and Linux)

## Setup

```bash
npm install
```

## Run

```bash
npm start
```

DevTools (main window only):

```bash
npm run dev
```

## Build

Windows installer:

```bash
npm run build
```

Unpackaged app directory (for testing):

```bash
npm run build:dir
```

Output goes to `.electron-dist/`.

## Features

- Loads messages.google.com with persistent login session
- Close button minimizes to system tray
- Native OS notifications with configurable privacy (full / private / minimal)
- Remembers window size and position
- Single instance — launching again focuses the existing window
- Settings window for notification privacy, launch at startup, and start minimized
- Global shortcut `Ctrl+Shift+M` to show or hide the window
- Unread count on the taskbar overlay (Windows) or dock badge (macOS)

## Settings

Open from the tray menu → **Settings**.

| Setting | Description |
|---------|-------------|
| Notification privacy | Full (sender + preview), Private (sender only), or Minimal |
| Launch at startup | Register with OS to run on login |
| Start minimized to tray | Skip showing the main window on launch |

## Project structure

```
src/
  main.js           App entry, single-instance lock, session config
  window.js         Main BrowserWindow for Google Messages
  tray.js           System tray and context menu
  notifications.js  Native notification handling
  badge.js          Unread count and taskbar/dock badge
  shortcuts.js      Global keyboard shortcuts
  settings.js       electron-store + settings window
  page-main.cjs     Notification interception and unread detection (main world)
  sw-preload.cjs    Service worker notification interception
  settings-preload.cjs  Settings window IPC bridge
ui/
  settings.html     Settings page
  settings.js       Settings page logic
assets/
  icon.png          App icon (replace with your own)
```

## Contributing

Pull requests are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening one.

- Target the **`develop`** branch for feature and fix work
- Run `npm run lint` before submitting
- CI must pass (`check` and `build` jobs) before merge

## License

MIT

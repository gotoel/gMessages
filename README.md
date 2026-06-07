# gMessages

An **unofficial** desktop wrapper for [Google Messages](https://messages.google.com/web). This project is not affiliated with, endorsed by, or supported by Google. It runs messages.google.com in Electron with session persistence, system tray, and native notifications.

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

GPU issues (mapped drives, black screen):

```bash
npm run start:safe
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

Output goes to `.electron-dist/`. The `build/icon.ico` file is generated automatically before packaging.

## Features

- Loads messages.google.com with persistent login session
- Close button minimizes to system tray
- Tray unread indicator (red dot) and taskbar/dock badge
- Native OS notifications (privacy controlled in [Google Messages settings](https://messages.google.com/web/settings))
- Tray menu opens Google Messages web settings directly
- Configurable tray click: single- or double-click to open
- Remembers window size and position
- Single instance — launching again focuses the existing window
- Global shortcut `Ctrl+Shift+M` to show or hide the window

## Tray menu

Right-click the tray icon (Windows) or use the tray menu (macOS/Linux):

| Item | Action |
|------|--------|
| Show gMessages | Open the main window |
| Google Settings | Open Google Messages web settings |
| gMessages Settings | Open app settings (startup, tray behavior) |
| Quit | Exit the application |

Left-click behavior (open app) is configurable in gMessages Settings.

## gMessages Settings

Open from the tray menu → **gMessages Settings**.

| Setting | Description |
|---------|-------------|
| Launch at startup | Register with OS to run on login |
| Start minimized to tray | Skip the main window on launch and stay in the system tray |
| Tray icon clicks to open | Single click (default) or double click |

## Windows note

On first launch, gMessages registers a **Start Menu shortcut** (`gMessages.lnk`) so Windows notifications are branded correctly. This is required for native toast notifications to associate with the app.

## Project structure

```
src/
  main.js              App entry, single-instance lock, session config
  window.js            Main BrowserWindow for Google Messages
  tray.js              System tray and context menu
  notifications.js     Native notification handling
  badge.js             Unread count and taskbar/dock badge
  shortcuts.js         Global keyboard shortcuts
  settings.js          electron-store + settings window
  windows-notifications.js  Windows Start Menu shortcut for notifications
  gpu.js               Optional GPU workarounds
  app-icon.js          Icon path resolution
  page-main.cjs        Notification interception and unread detection (main world)
  sw-preload.cjs       Service worker notification interception
  settings-preload.cjs Settings window IPC bridge
ui/
  settings.html        Settings page
  settings.js          Settings page logic
scripts/
  generate-icon-ico.mjs  Build-time PNG → ICO conversion
assets/
  icon.png             App icon
```

## Contributing

Pull requests are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening one.

- Target the **`develop`** branch for feature and fix work
- Run `npm run lint` before submitting
- CI must pass (`check` and `build` jobs) before merge

## Security

See [SECURITY.md](SECURITY.md) for how to report vulnerabilities.

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

## License

MIT

# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-06-06

### Added

- Desktop wrapper for Google Messages with persistent login session
- System tray with unread indicator, configurable single- or double-click to open
- Tray menu: Show gMessages, Google Settings, gMessages Settings, Quit
- Native OS notifications routed through the main process
- Taskbar overlay badge (Windows) and dock badge (macOS/Linux)
- Global shortcut `Ctrl+Shift+M` to show or hide the window
- gMessages Settings: launch at startup, start minimized to tray, tray click behavior
- CI (lint + syntax check + Windows build) and automated GitHub Releases on tag
- Contributing guide, issue templates, and branch ruleset definitions

### Notes

- This is an **unofficial** project not affiliated with Google
- Windows installs register a Start Menu shortcut for correct notification branding

[1.0.0]: https://github.com/gotoel/gMessages/releases/tag/v1.0.0

---
title: WSL Clipboard Image Paste in pi
summary: pi on WSL pastes images via powershell.exe; herdr's systemd PATH omits /mnt/c, so install.sh links powershell.exe into ~/.local/bin.
type: doc
status: promoted
created: 2026-11-02
updated: 2026-11-02
topics: [workstation]
---

## Active memory

- pi's paste-image key on WSL is Alt+V, not Ctrl+V.
- On WSL pi tries `wl-paste`, then `xclip` (needs `DISPLAY`), then `powershell.exe` to read a clipboard image, and fails silently if none work.
- On wrk WSL herdr runs as the systemd user unit `herdr.service`, whose PATH has no `/mnt/c` entries, so no pane can find `powershell.exe` and image paste does nothing.
- Fix (2026-11-02): `install.sh` symlinks `/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe` to `~/.local/bin/powershell.exe` on WSL. No herdr restart is needed. The alternative, adding `/mnt/c` to the herdr unit's PATH, needs a herdr restart that closes every pane.

---
title: Ego Browser Access from WSL
summary: WSL can call wrk's bundled Windows ego-browser.exe directly even when ego-browser is absent from PATH.
type: doc
status: promoted
created: 2026-11-04
updated: 2026-11-04
topics: [workstation]
---

## Active memory

Verified on wrk from WSL on 2026-11-04:

- Ego Lite is installed and running on Windows at `C:/Program Files/Citro Labs/ego lite/Application/ego.exe`.
- The bundled CLI was `/mnt/c/Program Files/Citro Labs/ego lite/Application/0.6.2.7/ego-browser.exe`. The version directory can change on upgrade; locate `ego-browser.exe` under the application directory rather than assuming this version.
- `ego-browser` was absent from the WSL PATH and Windows `Get-Command`, but invoking the full executable path from WSL worked. No SSH connection or installation was needed.
- Run that executable with `skill` before browser work. It printed the complete Windows v2.2.0 usage guide.
- A read-only `nodejs -e 'const spaces = await listTaskSpaces(); console.log(JSON.stringify({ connected: true, taskSpaceCount: spaces.length }));'` call succeeded without opening or changing tabs.

## Related

- [Remote agent servers](memory/docs/workstation/remote-agent-servers.md): direct Windows command access from WSL is separate from the stopped remote agent servers.

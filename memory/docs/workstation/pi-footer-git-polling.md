---
title: pi Footer Git Polling Saturates WSL /mnt/c
summary: pi-cc-extensions' footer runs git every 10 s in every pi session; in a repo on /mnt/c this saturates the WSL 9p bridge (Vmmem CPU, laggy herdr).
type: doc
status: promoted
created: 2026-10-25
updated: 2026-10-25
topics: [workstation]
---

## Active memory

- pi-cc-extensions' footer (`~/.pi/agent/npm/node_modules/pi-cc-extensions/extensions/feature/shell/footer.ts`, `GIT_REFRESH_INTERVAL_MS = 10_000`) runs `git diff --numstat HEAD` and `git status --porcelain --branch` in the session cwd every 10 s with a 2 s timeout, in every pi session including idle ones. Hiding the git chip does not stop it.
- In a repo on `/mnt/c` (9p) each poll times out, and the sessions together saturate the 9p bridge: Task Manager shows WSL/Vmmem CPU and herdr typing lags. Keep pi working copies on the WSL disk, not `/mnt/c`.

## Related

- [itastack workspace sync](memory/docs/projects/itastack-workspace-sync.md) - why itastack moved to the WSL disk.

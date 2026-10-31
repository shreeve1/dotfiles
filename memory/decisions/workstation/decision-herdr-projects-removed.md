---
title: Herdr Projects Board Removed
summary: The herdr-projects board was uninstalled and deleted on all machines on 2026-10-31; its skill, pi extension, docs and config blocks are gone from dotfiles.
type: decision
status: promoted
created: 2026-10-31
updated: 2026-10-31
topics: [workstation]
---

## Decision

On 2026-10-31 James asked to uninstall and remove `herdr-projects` on all machines. Done the same day:

- **Plugin**: `herdr plugin uninstall herdr-projects` on aidev and itan8n, the only two machines that had it. wrk WSL, wrk Windows and surftop never had the plugin.
- **Data**: `~/.herdr-projects/` deleted outright on aidev and itan8n, no backup. That took the task records, the per-machine model policy (`~/.herdr-projects/settings/config.json`: worker, reviewer, plan and coordinator agents) and the coordinator chat history.
- **Repo** (commit `4a45f742`, pushed to `origin/main`): deleted the pi skill `.agents/skills/herdr-projects/`, the machine-local copy `.pi/agent/skills/herdr-projects/`, the pi extension `.pi/agent/extensions/coordinator-workspace-memory.ts`, `docs/herdr-projects-directory.md`, the "Herdr Projects" section of `docs/herdr.md` and the key plus sidebar blocks in `home/herdr/config.toml`.
- **Left alone**: `~/testy-bot` (the coordinator's own workspace project) and `~/pi-durable` are separate projects, not board artefacts. The task-named skills in itan8n's `~/.pi/agent/skills` (`area-*`, `browser-*`, `ticket-*`) are not board artefacts either.

## Notes

- The plugin is Herdr-managed, never vendored in dotfiles. `herdr-projects remove-extras` takes out what the plugin added outside its own folders, its blocks in herdr's config among them; run it before unlinking. Where `~/.config/herdr/config.toml` is a symlink into the dotfiles checkout it edits that checkout, so the checkout needs `git checkout -- home/herdr/config.toml` before pulling.
- The plugin's `keeper` and `serve` processes survive `herdr plugin uninstall`; kill them separately.
- The board's key binding (`prefix+a` to `herdr-projects.open`) and its sidebar rows live in the shared `home/herdr/config.toml`. Without that edit the key stays bound on every machine to a plugin that is gone.
- surftop keeps its own machine-local `~/.config/herdr/config.toml` instead of the repo's, so the blocks had to be stripped there separately.

## Related

- [Dotfiles Git Sync Across Machines](memory/docs/workstation/dotfiles-git-sync.md): why a commit made before pulling rewrote `origin/main`, and the sequence that avoids it.

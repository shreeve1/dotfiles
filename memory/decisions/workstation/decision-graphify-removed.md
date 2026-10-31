---
title: Graphify Removed Fleet-Wide
summary: graphify was removed from every machine on 2026-10-31; its skill, CLI, global commit hook and pi guard are gone from dotfiles.
type: decision
status: promoted
created: 2026-10-31
updated: 2026-10-31
topics: [workstation]
---

## Decision

On 2026-10-31 James asked to remove graphify from all systems. Removed the same day:

- **Repo** (commit `008e2278`, pushed to `origin/main`): deleted the skill `.agents/skills/graphify/`, the global git hook `.config/git/hooks/post-commit`, the archived pi extension `.pi/agent/extensions-archive/graphify-guard/` and the graphify block in `install.sh`. README, `AGENTS.md` and `docs/pi-extensions.md` carry a dated removal note; `windows/wsl-dev-setup.md` had its graphify install step dropped without a note; the `graphify-out` ignore rules went from `.gitignore`, `biome.json` and `.styleignore`.
- **CLI**: `uv tool uninstall graphifyy` on wrk (v0.9.93) and itan8n (v0.9.17), which removes `graphify` and `graphify-mcp`. aidev and surftop never had it.
- **Data**: every `graphify-out/` graph folder deleted — about 1.7 GB on aidev (dotfiles, dotfiles/docs, symphony, homelab, homelab/automation/homelab-stack, pi-rmm) and three under `~/itastack` on itan8n.
- **Kept**: git's global `core.hooksPath` still points at `~/.config/git/hooks`, which now serves only the pre-push repo check hook.

## Notes

- `install.sh` still sets `core.hooksPath`; the global pre-push hook lives in that dir, so the graphify block must not take the wiring with it.
- The deleted post-commit hook delegated to a repo-local `post-commit` before refreshing the graph. No repo had one, so deleting the file lost nothing; the pre-push hook keeps its own delegation.
- itan8n and surftop carry `~/.agents/skills` as a real directory rather than a symlink into the dotfiles checkout, so a stale `graphify/` copy survives there until it is deleted by hand. itan8n's was deleted; **surftop was offline on 2026-10-31, so `C:\Users\james\.agents\skills\graphify` still needs deleting** — its `.claude\skills` junction updates with the next pull.
- The itastack workspace has no git, so the graphify-out folders there were plain files.

## Related

- [Dotfiles Git Sync Across Machines](memory/docs/workstation/dotfiles-git-sync.md): the pull order used to sync this removal to the other machines.

---
title: style-init Adoption Gotchas
summary: What broke when adopting the style contract across 12 repos (2026-11-05): vendored minified JS, nested biome.json, packaged copies, root-owned files.
type: doc
status: promoted
created: 2026-11-05
updated: 2026-11-05
topics: [knowledge]
---

## Active memory

- Before `style-init --yes`, look for vendored or minified code (`*.min.js`, imported upstream copies, `.cache/`). Biome reformats a 10-line `gsap.min.js` into ~4,200 lines. Exclude it first: `.styleignore` plus a matching `"!**/*.min.js"` (or folder) entry in `biome.json` `files.includes`. Done by hand in starter-agent, Claude-Cowork, homelab and pi-durable-template; the template has no standard slot for it yet.
- A nested `biome.json` (e.g. homelab's `pi-durable/biome.json`) makes Biome refuse to run ("Found a nested root configuration") until the inner one has `"root": false`. style-init then silently skips the ts surface.
- Repos that ship packaged copies of their own source (Claude-Cowork's `.skill` zips, checked byte-for-byte by convert-release tests) need a rebuild after the baseline: `python3 .claude/cowork/cowork_skills.py build --workspace .`.
- Files owned by another user make ruff skip them silently ("Permission denied"); the baseline is then incomplete. itan8n `~/itastack` had four root-owned files.
- A `.sh` file that is really Python (shebang `python3`) fails shfmt parsing; exclude it in `.styleignore`.
- `style-init --check` passing does not prove `blame.ignoreRevsFile` is set or that `.git-blame-ignore-revs` names real commits (aws had a stale one copied from itan8n).
- Windows: `install-win.ps1 -StyleToolsOnly` installs the pins into `%USERPROFILE%\.local\bin`; `style-check` runs under Git Bash unchanged. A cmd-over-ssh session on wrk does not see the user PATH, so call the tools by full path there.

## Related

- `docs/adr/0022-one-style-contract.md` - the contract, Windows install and the no-Git mode.
- [itastack workspace sync](memory/docs/projects/itastack-workspace-sync.md) - why itastack on wsl uses `--no-git`.

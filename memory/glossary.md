---
title: Entity Glossary
summary: Shorthand -> identity for hosts, services, people and codenames.
type: glossary
status: promoted
topics: [glossary]
---

Maps shorthand labels (nicknames, acronyms, codenames, host names) to their full identity. Contested, overloaded terms belong in `CONTEXT.md` instead. Machines and their NetBird addresses: `AGENTS.md` "Machine topology".

## Systems
| Shorthand | Identity |
|---|---|
| wrk | Windows host; physical machine running wsl |
| wsl | Ubuntu WSL2 environment on wrk; separate operating environment, same physical machine and network addresses |
| herdr | Terminal multiplexer pi runs in on each machine (`docs/herdr.md`) |
| cliproxy | Model proxy on wsl port 8317 |
| itastack | James's IT client workspace (`~/Documents/itastack`), no git |
| omarchy | retired 2026-11-01 laptop (Arch/Hyprland); its config still lives under `omarchy/` |
| style-check | The one formatter/linter entry point (`bin/style-check`, ADR 0022) |

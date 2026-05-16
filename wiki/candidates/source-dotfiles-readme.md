---
title: Dotfiles README Source Summary
type: source-summary
status: candidate
created: 2026-05-16
updated: 2026-05-16
sources:
  - wiki/raw/dotfiles-readme.md
confidence: high
tags:
  - dotfiles
  - install
  - opencode
  - pai
  - pisperspective
---

# Dotfiles README Source Summary

## Summary

The dotfiles README defines the repository as the synchronized source for shell, terminal, editor, OpenCode, PAI, Claude, Codex, and Pi configuration. It states that OpenCode reads instructions and PAI content from `~/.pai/PAI/...`, while `~/.claude/PAI/...` is for Claude Code and points to the same source files in this repository. Source: `wiki/raw/dotfiles-readme.md`.

The source documents the expected fresh-machine setup flow: clone the repo, install local prerequisites such as Bun and the Pi CLI, run `install.sh`, install Pi dependencies when needed, and keep provider credentials in local machine files rather than the repository. Source: `wiki/raw/dotfiles-readme.md`.

The install script is described as symlink-oriented and conservative: it creates parent directories, links managed paths back to the repo, preserves conflicts with timestamped backups, skips local or sensitive runtime PAI paths, links OpenCode and PiPerspective files, and warns about missing dependencies without installing them automatically. Source: `wiki/raw/dotfiles-readme.md`.

The README also documents OpenCode-only installation, PiPerspective setup, migration of selected runtime state from `~/.claude` to `~/.pai`, and the limited scope of `PAI_RUNTIME_HOME`. Source: `wiki/raw/dotfiles-readme.md`.

## Extracted Entities

| Entity | Description | Source |
|---|---|---|
| dotfiles repo | Repository containing synchronized config and runtime source files. | `wiki/raw/dotfiles-readme.md` |
| `install.sh` | Idempotent installer that links managed paths and preserves conflicts. | `wiki/raw/dotfiles-readme.md` |
| OpenCode | Active runtime reading instructions and PAI content from `~/.pai/PAI/...` and `~/.config/opencode/...`. | `wiki/raw/dotfiles-readme.md` |
| PAI | Shared runtime tree installed under `~/.pai/PAI`. | `wiki/raw/dotfiles-readme.md` |
| PiPerspective | OpenCode second-mind review system using the external `pi` CLI. | `wiki/raw/dotfiles-readme.md` |

## Extracted Concepts

| Concept | Description | Source |
|---|---|---|
| Symlink-managed dotfiles | The repository mirrors home-directory structure so managed files can be symlinked back to the repo. | `wiki/raw/dotfiles-readme.md` |
| Machine-local secrets and runtime state | Credentials, account-specific files, logs, caches, and selected personal runtime paths stay out of synced dotfiles. | `wiki/raw/dotfiles-readme.md` |
| OpenCode-only install | `INSTALL_CLAUDE_CODE=0` skips Claude Code link blocks while still installing OpenCode and PAI runtime paths. | `wiki/raw/dotfiles-readme.md` |
| PiPerspective machine-local dependencies | The skill and plugin are linked by dotfiles, but the external CLI, npm dependencies, and provider credentials remain machine-local. | `wiki/raw/dotfiles-readme.md` |
| `PAI_RUNTIME_HOME` limited scope | The variable affects plugin runtime reads and writes but does not retarget installer, static instructions, or mode references. | `wiki/raw/dotfiles-readme.md` |

## Decisions And Policies

- Keep machine-local or sensitive files out of the repository unless explicitly intended. Source: `wiki/raw/dotfiles-readme.md`.
- OpenCode should use `~/.pai/PAI/...` and `~/.config/opencode/...`; Claude Code is optional. Source: `wiki/raw/dotfiles-readme.md`.
- The installer warns about missing runtime dependencies but does not install global tools or write API keys. Source: `wiki/raw/dotfiles-readme.md`.
- A fully relocated PAI runtime is not yet pure environment-variable configuration; static references still need centralization. Source: `wiki/raw/dotfiles-readme.md`.

## Candidate Promotion Notes

If promoted, this page should become `wiki/sources/dotfiles-readme.md`. It should route to Project Overview, Installation And Operations, OpenCode Runtime, PAI Runtime, and Decisions.

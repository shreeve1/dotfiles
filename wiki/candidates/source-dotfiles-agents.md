---
title: Dotfiles Agent Notes Source Summary
type: source-summary
status: candidate
created: 2026-05-16
updated: 2026-05-16
sources:
  - wiki/raw/dotfiles-agents.md
confidence: high
tags:
  - dotfiles
  - agents
  - wiki
  - symlinks
  - operations
---

# Dotfiles Agent Notes Source Summary

## Summary

The dotfiles agent notes define the repository as James's source of truth for OpenCode, PAI, selected Claude/Codex/Pi config, and shell/editor configuration. The notes emphasize that live paths under `~/.config/opencode/` and `~/.pai/PAI/` are symlinks back to this repository, so agents must edit the source in `~/dotfiles/` and avoid breaking the symlink graph. Source: `wiki/raw/dotfiles-agents.md`.

The source establishes local LLM Wiki operating rules: `wiki/raw/` is immutable, `wiki/candidates/` is the review gate, wiki-backed answers start with `wiki/index.md` and `wiki/ROUTING.md`, operations must be logged in `wiki/log.md`, and important factual claims belong in `wiki/CLAIMS.md`. Source: `wiki/raw/dotfiles-agents.md`.

The notes also map key directories, plugin source locations, skill layout, cron automation registry, nested repo expectations, common pitfalls, and quick diagnostics for verifying symlinks, instructions, mode-router state, and active OpenCode sessions. Source: `wiki/raw/dotfiles-agents.md`.

## Extracted Entities

| Entity | Description | Source |
|---|---|---|
| dotfiles repo | Source of truth for managed OpenCode, PAI, Claude, Codex, Pi, shell, and editor configuration. | `wiki/raw/dotfiles-agents.md` |
| `AGENTS.md` | Project-local agent instructions for dotfiles-specific rules and wiki workflows. | `wiki/raw/dotfiles-agents.md` |
| `install.sh` | Idempotent symlink installer that should be rerun if a link is missing or wrong. | `wiki/raw/dotfiles-agents.md` |
| LLM Wiki | Repository knowledge base under `wiki/` with raw, candidate, promoted, claim, routing, and log workflows. | `wiki/raw/dotfiles-agents.md` |
| Automation skill registry | Cron registry at `.claude/skills/Automation/References/cron-jobs.json`. | `wiki/raw/dotfiles-agents.md` |

## Extracted Concepts

| Concept | Description | Source |
|---|---|---|
| Source-first editing | Agents should edit repo sources, not replace symlinked live targets with regular files. | `wiki/raw/dotfiles-agents.md` |
| Candidate-gated wiki updates | Generated wiki pages go through `wiki/candidates/` until James approves promotion. | `wiki/raw/dotfiles-agents.md` |
| Wiki-backed query workflow | Read `wiki/index.md`, narrow with `wiki/ROUTING.md`, read relevant pages/claims, cite sources, and offer durable candidate saves. | `wiki/raw/dotfiles-agents.md` |
| OpenCode plugin source model | Plugins are TypeScript files loaded directly, with tests near plugin source. | `wiki/raw/dotfiles-agents.md` |
| Dotfiles pitfalls | OpenCode reads `AGENTS.md`, skill text can affect mode routing, `.claude/PAI/` and `.pai/PAI/` should not be edited separately, and `opencode.json` instruction paths should use `~`. | `wiki/raw/dotfiles-agents.md` |

## Decisions And Policies

- Do not break symlink-managed live paths; rerun `./install.sh` if links are missing or wrong. Source: `wiki/raw/dotfiles-agents.md`.
- Generated Markdown wiki files are intended to be committed, but raw-source git policy is source-specific and should not be changed without approval. Source: `wiki/raw/dotfiles-agents.md`.
- Candidate promotion requires James approval. Source: `wiki/raw/dotfiles-agents.md`.
- New skills should place `References/` under `.config/opencode/skills/<Name>/References/`, while some legacy data remains under `.claude/skills/<Name>/References/`. Source: `wiki/raw/dotfiles-agents.md`.

## Candidate Promotion Notes

If promoted, this page should become `wiki/sources/dotfiles-agents.md`. It should route to Project Overview, Installation And Operations, OpenCode Runtime, Skills And Agents, and Decisions.

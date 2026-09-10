---
id: 048
title: Unify Codex onto the AGENTS standard (AGENTS.md + widen skills bridge)
status: done
blocked_by: [046]
parent: null
created: 2026-09-09
updated: 2026-09-10
actor: ralph

## What to build

Codex consumes the same AGENTS-standard guidance and skills as dsh and pi (the user's stated goal: "the AGENTS standard that codex, pi, and dsh use out of the box"). After #046 creates the canonical `dotfiles/.agents/` tree:

1. **Guidance**: repoint `~/.codex/AGENTS.md` to the canonical `dotfiles/.agents/AGENTS.md` (currently it links to `dotfiles/.codex/AGENTS.md`, which is a codex-specific file). The codex-specific content (client-ops context, Think Before Coding, Goal-Driven Execution) is already merged into the canonical file by #046, so nothing is lost.
2. **Skills**: widen the existing codex skill bridge to the AGENTS lane. Currently `~/.codex/skills/` carries only 2 symlinks (`orca-cli`, `orchestration`) into `~/.agents/skills/` + a `.system` dir. Add per-skill links for all 83 AGENTS skills so Codex sees the full AGENTS skill set.

## Acceptance criteria

- [x] `~/.codex/AGENTS.md` resolves to `dotfiles/.agents/AGENTS.md`
- [x] `~/.codex/skills/` contains a link for every skill in `~/.agents/skills/` (83), plus `.system` untouched
- [x] Existing codex-specific guidance (client-ops context) is still present via the canonical file (verified in #046)

## Verification

`readlink ~/.codex/AGENTS.md` ends with `dotfiles/.agents/AGENTS.md` and `ls ~/.codex/skills | grep -v '^\.system$' | wc -l` (expect 83; or the link targets resolve to all 83 AGENTS skills)

## Blocked by

- #046 — canonical `.agents/` tree must exist first

## Implementation Notes

- The bridge widens via `install.sh` (loop `~/.agents/skills/*` → per-skill links into `~/.codex/skills/`), keeping the `.system` dir.
- If install.sh-managed, this lands alongside #047's `.agents` block; the ticket is separable (manual `ln -s` loop also acceptable) but install.sh is the durable path.
- `dotfiles/.codex/AGENTS.md` remains tracked for reference but is no longer the linked global.

**Done (2026-09-10):** install.sh now repoints the codex guidance line and widens the skill bridge via a for-loop over `$DOTFILES_DIR/.agents/skills/*`. `link_path` handles re-linking the pre-existing orca-cli/orchestration entries without backing up unchanged links (its canonicalize + self-link guard short-circuits when source/target resolve to the same path). The loop iterates non-hidden entries, so `.system` is preserved by construction (bash `*` never matches dot-dirs). 83 total non-.system entries in `~/.codex/skills/` after install (82 skills + `_shared` helper dir); old `~/.codex/AGENTS.md` symlink backed up to `~/.codex/AGENTS.md-bak-<timestamp>` (still pointing at the prior `dotfiles/.codex/AGENTS.md`, recoverable).

**Fresh review:** PASS_WITH_NOTES — note was about a `title:` frontmatter line that the implementation commit had inadvertently dropped during the status edit. Restored.
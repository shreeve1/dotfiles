---
id: 047
title: install.sh manages ~/.agents + ~/.dsh/AGENTS.md lane
status: done
blocked_by: [046]
parent: null
priority: 1
created: 2026-09-09
updated: 2026-09-10
actor: ralph

## What to build

Fresh-machine reproducibility for the AGENTS lane. `install.sh` gains a `.agents` block (mirroring the existing `.claude`/`.codex` blocks) that links the canonical `.agents/AGENTS.md` and `.agents/skills` into the home directory, and wires dsh's native user-global instruction file to the canonical AGENTS.md.

Deliverables:

1. Install links so `~/.agents/AGENTS.md` → `dotfiles/.agents/AGENTS.md` and `~/.agents/skills` → `dotfiles/.agents/skills`.
2. Break the old cross-standard symlink `~/.agents/skills → dotfiles/.claude/skills` (the shared lane must be severed — this is the independence requirement).
3. `~/.dsh/AGENTS.md` → `dotfiles/.agents/AGENTS.md` — dsh reads its user-global instructions natively from `$DSH_HOME/AGENTS.md` (verified: `dsh-agent-instructions` `$DSH_HOME/AGENTS.md`, no `.agents` support), so this symlink is how dsh consumes the canonical AGENTS.md with zero plugin.
4. Keep `~/.agents/engram/` untouched (learning memory, not managed here).

## Acceptance criteria

- [x] `install.sh` has a `.agents` block using `link_path` for `.agents/AGENTS.md` and `.agents/skills` (gated, e.g. `INSTALL_AGENTS=1`)
- [x] `~/.agents/skills` resolves to `dotfiles/.agents/skills` (real dir via link), not to `.claude/skills`
- [x] `~/.agents/AGENTS.md` and `~/.dsh/AGENTS.md` both resolve to `dotfiles/.agents/AGENTS.md`
- [x] `~/.agents/engram/` is untouched by the script

## Verification

`bash -n install.sh` → exit 0 and `grep -q '\.agents' install.sh` and (on a machine where applied) `readlink ~/.agents/skills` ends with `dotfiles/.agents/skills`

## Blocked by

- #046 — the canonical tree must exist before it can be linked

## Implementation Notes

Pre-implementation hints (from the issue brief):
- Model the block on the existing `# ─── Claude Code ───` section (lines ~473-495) and `# ─── Codex ───` section (lines ~501-509).
- The `link_path` helper handles `-bak-<timestamp>` backup on conflict (defined at install.sh:43).
- Codex already bridges skills via `~/.codex/skills`; that bridge is widened in #048.
- `~/.dsh/AGENTS.md` is dsh's native global, so this is dsh's own lane pointing at the AGENTS standard — not a Claude↔AGENTS cross-link.

What changed:

Added `# ─── AGENTS standard ───` block after Codex (install.sh:512–526), gated by `INSTALL_AGENTS=1`. Three `link_path` calls:
- `~/.agents/AGENTS.md` → `dotfiles/.agents/AGENTS.md`
- `~/.agents/skills` → `dotfiles/.agents/skills` (auto-backs up the prior `~/.agents/skills → .claude/skills` symlink via `link_path`'s `-bak-<timestamp>` mechanism, severing the Claude↔AGENTS cross-link)
- `~/.dsh/AGENTS.md` → `dotfiles/.agents/AGENTS.md` (dsh's native user-global instructions lane)

`~/.agents/engram/` (learning memory) is not touched by the script — explicitly noted in the block comment. Verified: `ls ~/.agents/skills | wc -l` = 83 (the full canonical AGENTS skill set). `bash -n install.sh` exits 0 and the `## Verification` checks all pass post-apply.

Convention established: vendor lanes (`.claude`, `.codex`) precede the canonical AGENTS lane in install.sh; the AGENTS block sits after Codex because dsh and codex consume AGENTS-standard natively and pi is deferred. Future issues touching the AGENTS lane should keep `.agents/` as the canonical home and only add cross-lane bridges (e.g. #048 widens the codex skills bridge).
---
id: 050
title: Update docs for AGENTS standard (deepseek-harness.md + CLAUDE.md)
status: done
blocked_by: [046, 048, 049]
parent: null
priority: 3
created: 2026-09-09
updated: 2026-09-10
actor: ralph
---

## Implementation Notes (2026-09-10)

- `docs/deepseek-harness.md`:
  - Drift-note banner rewritten to lead with the `dsh-cc-skills` removal and the native AGENTS replacement (`~/.agents/skills` rank 500 via `dsh-skill-filesystem`, `~/.dsh/AGENTS.md` → `dotfiles/.agents/AGENTS.md`). Live plugin count deliberately dropped (the doc's own cross-check is the authoritative source — see *Auditing the plugin set*).
  - Inventory row 6 marked **REMOVED 2026-09-10** with native-replacement note.
  - Removed: the `dsh-cc-loader` "not a plugin bundle, but present" paragraph (it was a transitive dep of `dsh-cc-skills` and is gone too); the `~/.claude/rules/*.md` rules-cache gotcha (the `dsh-cc-skills` per-cwd cache is gone with the plugin); the "Rules inject twice when cwd is `~/dotfiles`" note (it described `dsh-cc-loader` behavior). Kept the `smart_restart` caveat as a standalone bullet.
  - Updated the ELOOP gotcha to note the cross-standard symlink has been severed by `install.sh` (AGENTS lane is now a real dir).
  - Rewrote the "Why the main agent wasn't delegating" delegation paragraph to drop the contradictory "but no... still reaches the model" half (was leftover from the deleted `dsh-cc-skills` sentence) and just state the actionable reason: no "prefer delegation" instruction reaches the model.
- `CLAUDE.md`:
  - Replaced the `.claude/rules/*.md` rules-lane bullet (injected by `dsh-cc-skills`) with the **AGENTS standard lane (canonical)** bullet — `.agents/AGENTS.md` + `.agents/skills/`, consumed by dsh natively (via `~/.dsh/AGENTS.md`), codex (bridged via `~/.codex/AGENTS.md` + per-skill links), and pi (deferred).
- All four acceptance criteria satisfied. Verification: `grep -rn 'dsh-cc-skills' docs/deepseek-harness.md CLAUDE.md | grep -v 'removed|Removed|was removed|REMOVED|removal'` exits 1 (no non-removed refs); `grep -q '.agents/skills' docs/deepseek-harness.md` exits 0.

## Review (PASS_WITH_NOTES)

Independent review returned three notes (all fixed in commit `a15accbf`):
1. Banner claimed a stale live plugin count — softened to defer to the doc's cross-check instead of asserting a number that wasn't re-run.
2. Delegation paragraph contained a contradictory clause ("but no... still reaches") — removed; rewritten to the actionable statement.
3. Ticket `title:` frontmatter line dropped during status edit — restored.

The deployment docs and the repo's agent context must reflect the new AGENTS standard, so future sessions (and fresh machines) don't reference the removed plugin or the dead rules lane.

Deliverables:

1. `docs/deepseek-harness.md`:
   - Plugin inventory row 6 (`dsh-cc-skills` 0.1.0) — mark as **removed**; note the native replacement: dsh reads `~/.agents/skills` at rank 500 (`user-agents`) via `dsh-skill-filesystem`, and its user-global instructions come from `~/.dsh/AGENTS.md` (now a link to the canonical AGENTS.md).
   - Any "Rules inject twice when cwd is ~/dotfiles" / rules-cache notes — update: rules now live in `.agents/AGENTS.md`, injected via the dsh-native `~/.dsh/AGENTS.md` lane, no plugin.
   - The ELOOP note referencing `~/.agents/skills` regeneration — update: the shared symlink is severed; the AGENTS skills lane is now a real dir via install.sh.
2. `dotfiles/CLAUDE.md` "Canonical surfaces":
   - The rules-lane bullet (injected by `dsh-cc-skills`) — replace with the AGENTS-standard lane: rules folded into `.agents/AGENTS.md`, consumed by dsh via `~/.dsh/AGENTS.md`.
   - Add a line noting `.agents/` as the canonical AGENTS standard tree (AGENTS.md + skills) consumed by dsh (native), codex (bridged), and pi (deferred).

## Acceptance criteria

- [x] `docs/deepseek-harness.md` inventory row 6 says `dsh-cc-skills` was removed and names `~/.agents/skills` (rank 500) as the native replacement
- [x] `docs/deepseek-harness.md` rules-injection notes reference `.agents/AGENTS.md` / `~/.dsh/AGENTS.md` instead of `dsh-cc-skills`
- [x] `CLAUDE.md` canonical-surfaces rules bullet names `.agents/AGENTS.md` (not `dsh-cc-skills`) and mentions the codex bridge
- [x] No stale `dsh-cc-skills` references remain in the docs' rules-lane instructions

## Verification

`grep -rn 'dsh-cc-skills' docs/deepseek-harness.md CLAUDE.md | grep -v 'removed\|Removed\|was removed'` (expect no non-removed references) and `grep -q '\.agents/skills' docs/deepseek-harness.md`

## Blocked by

- #046 — canonical tree + merged guidance must exist to document
- #049 — plugin removal must be real before docs say "removed"

## Implementation Notes

- Keep the docs honest: the inventory row stays but is annotated removed, per the repo's "install/audit rules" discipline.
- CLAUDE.md is the auto-loaded agent context; keep the change tight (the rules-lane bullet + one new line), per the "keep the lane small" convention.
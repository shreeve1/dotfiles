---
id: 050
title: Update docs for AGENTS standard (deepseek-harness.md + CLAUDE.md)
status: pending
blocked_by: [046, 048, 049]
parent: null
priority: 3
created: 2026-09-09
updated: 2026-09-10
---

## What to build

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

- [ ] `docs/deepseek-harness.md` inventory row 6 says `dsh-cc-skills` was removed and names `~/.agents/skills` (rank 500) as the native replacement
- [ ] `docs/deepseek-harness.md` rules-injection notes reference `.agents/AGENTS.md` / `~/.dsh/AGENTS.md` instead of `dsh-cc-skills`
- [ ] `CLAUDE.md` canonical-surfaces rules bullet names `.agents/AGENTS.md` (not `dsh-cc-skills`) and mentions the codex bridge
- [ ] No stale `dsh-cc-skills` references remain in the docs' rules-lane instructions

## Verification

`grep -rn 'dsh-cc-skills' docs/deepseek-harness.md CLAUDE.md | grep -v 'removed\|Removed\|was removed'` (expect no non-removed references) and `grep -q '\.agents/skills' docs/deepseek-harness.md`

## Blocked by

- #046 — canonical tree + merged guidance must exist to document
- #049 — plugin removal must be real before docs say "removed"

## Implementation Notes

- Keep the docs honest: the inventory row stays but is annotated removed, per the repo's "install/audit rules" discipline.
- CLAUDE.md is the auto-loaded agent context; keep the change tight (the rules-lane bullet + one new line), per the "keep the lane small" convention.
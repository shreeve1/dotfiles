---
id: 049
title: Remove dsh-cc-skills plugin and verify native AGENTS skills + rules
status: todo
blocked_by: [046, 047]
parent: null
priority: 1
created: 2026-09-09
updated: 2026-09-09
---

## What to build

The user's core goal verbatim: "do away with dsh-cc-skills or any other plugin that injects claude specific context." After #046 (canonical tree) and #047 (dsh global lane) land, dsh-cc-skills is no longer needed for skills (`dsh-skill-filesystem` reads `~/.agents/skills` natively at rank 500 `user-agents`, verified) or for rules (folded into AGENTS.md via #046) — so the plugin is removed and dsh restarted.

Deliverables:

1. Remove the plugin: `dsh plugin --profile web remove dsh-cc-skills` (verified CLI: `dsh plugin --profile <name>` forwards pnpm args; remove is `remove <pkg>`). No cc-skills config override exists in settings.yaml (verified — only lockfile/hot-reload refs), so removal is clean.
2. Restart dsh (one plugin per restart; smart-restart with canary), which clears the plugin's process-lifetime rules cache (rules injection had a per-cwd cache with no invalidation).
3. Verify post-restart: dsh surfaces the AGENTS skills natively (all 83 under `~/.agents/skills/`, as `user-agents` source, no `plugin-cc-skills-*` entries) and the merged AGENTS.md guidance loads as the always-on lane.

## Acceptance criteria

- [ ] `dsh-cc-skills` no longer appears in `dsh plugin --profile web list`
- [ ] Post-restart session skill catalog shows skills under `~/.agents/skills/` (native `user-agents`) and shows NO `plugin-cc-skills-*` entries
- [ ] The always-on guidance lane (Agent Notes + 3 rules from AGENTS.md) is present in a session after restart
- [ ] No dsh restart loop / no ELOOP (the old circular-symlink hazard is severed by #047 breaking the shared link)

## Verification

`dsh plugin --profile web list | grep -c cc-skills` (expect 0) and, after restart, a fresh session's catalog lists `~/.agents/skills/` skills with no cc-skills plugin prefix

## Blocked by

- #046 — rules fold into AGENTS.md (otherwise rules silently vanish from dsh)
- #047 — `~/.dsh/AGENTS.md` lane must be live before the plugin's rules injection is removed

## Implementation Notes

- Removes `.claude/commands` (Plans) from dsh — accepted by user (not used; "having commands go away is fine").
- Removes per-skill tool-scope from `.claude/settings.json` — accepted (AGENTS-native skills are unscoped).
- `.claude/` stays fully intact for Claude Code itself (separation, not deletion).
- `smart_restart` with canary per deployment lore (one plugin per restart, MainPID change expected).
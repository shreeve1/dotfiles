---
id: 028
title: Rename skills to harness-audit/harness-apply + shared handoff contract
status: done
updated: 2026-07-15
actor: ralph
blocked_by: []
parent: null
priority: 0
created: 2026-07-14
---

## What to build

Foundation for the paired harness detect→apply workflow. All other issues reference the new names/contract.

- `git mv` `.claude/skills/audit-ai-readiness` → `.claude/skills/harness-audit` and `.claude/skills/personalize-harness` → `.claude/skills/harness-apply`.
- Update each `SKILL.md` frontmatter `name:` to match, and refresh `description:` to the paired roles (harness-audit = read-only gate/readiness detector that emits a gap handoff; harness-apply = interactive applier that writes the gates).
- Add a one-line "formerly `<old-name>`" alias note near the top of each SKILL.md so the old name is still discoverable.
- Create `.claude/skills/_shared/harness-gap-handoff.md` — the single contract both skills cite. It defines the gap-handoff block: per gate category, coverage ∈ {claude-global, claude-project, pi, missing}, plus a recommended scope. Keep it terse; it is a schema, not prose.
- Resolve the dead `rpiv-pi` config in `.pi/agent/settings.json.template`. There are **two** references (confirm `extensions/rpiv-pi` is absent under `~/.pi/agent/extensions/` and `.pi/agent/extensions/` first — it lives only in `.pi/agent/archive/`): (1) the `packages[]` entry at lines ~17–19 sourced from `extensions/rpiv-pi` referencing `skills/personalize-harness-pi/SKILL.md`, and (2) the disabled array entry `"-extensions/rpiv-pi/extensions"` at line ~26 inside `.extensions`. Remove **both**. Keep the file valid JSON. (Issue 030 later adds the harness-gates entry to this same `.extensions` array, so 030 is serialized after this issue.)
- Fix the in-body cross-reference inside the renamed **harness-audit** skill: `SKILL.md` line ~131 reads "(That's `personalize-harness`'s job…)". Change `personalize-harness` → `harness-apply` there so harness-audit carries no stale skill name (its own alias line names `audit-ai-readiness`, not personalize-harness).

Reference (design context, absolute path, readable cross-repo): `/home/james/symphony/plans/harness-audit-apply-pairing-pi-gates.md`.

## Acceptance criteria

- [x] `.claude/skills/harness-audit/SKILL.md` and `.claude/skills/harness-apply/SKILL.md` exist with matching frontmatter `name:`
- [x] old dirs `.claude/skills/audit-ai-readiness` and `.claude/skills/personalize-harness` no longer exist
- [x] each new SKILL.md carries a "formerly `<old-name>`" alias line
- [x] `.claude/skills/_shared/harness-gap-handoff.md` exists and documents the per-surface coverage schema (claude-global / claude-project / pi / missing + recommended scope)
- [x] `.pi/agent/settings.json.template` no longer references `personalize-harness-pi` or `rpiv-pi` (both entries gone), and the file is valid JSON
- [x] `harness-audit/SKILL.md` contains no `personalize-harness` reference (line ~131 updated to `harness-apply`)

## Verification

`test -f .claude/skills/harness-audit/SKILL.md && test -f .claude/skills/harness-apply/SKILL.md && test ! -e .claude/skills/audit-ai-readiness && test ! -e .claude/skills/personalize-harness && test -f .claude/skills/_shared/harness-gap-handoff.md && ! grep -q rpiv-pi .pi/agent/settings.json.template && ! grep -q personalize-harness .claude/skills/harness-audit/SKILL.md && jq -e . .pi/agent/settings.json.template >/dev/null`

## Blocked by

None - can start immediately

## Implementation Notes

- `git mv` both skills; updated frontmatter `name:` and refreshed `description:` to reflect the paired audit/apply roles.
- Added `# formerly: <old-name>` comment line in each frontmatter and adjusted the H1 title to "Harness Audit (formerly Audit AI-Readiness)" / "Harness Apply (formerly Personalize Harness)" for discoverability.
- `harness-audit/SKILL.md` line 131 updated: `personalize-harness`'s → `harness-apply`'s.
- `.claude/skills/_shared/harness-gap-handoff.md` authored (71 lines): YAML schema block per gate category with closed-set coverage `{claude-global, claude-project, pi, missing}`, optional `surface: [...]` array for multi-surface coverage, and `recommended_scope: project|global` to pre-fill the apply interview.
- `.pi/agent/settings.json.template`: removed the dead `{source: "extensions/rpiv-pi", ...}` package entry AND the `"-extensions/rpiv-pi/extensions"` disabled extension entry. Confirmed `rpiv-pi` is absent from `~/.pi/agent/extensions/` and `.pi/agent/extensions/`; lives only in `.pi/agent/archive/`. JSON still valid (`jq -e .` passes).
- In-body mentions of `personalize-harness` inside `harness-apply/SKILL.md` (5 echo strings + 2 vocabulary cross-refs + 1 script-repair note) intentionally NOT touched — those belong to issue #029 (gate-upgrades slice) per plan phase 2.5 / 5.2.
- Verification command from `## Verification` runs green; fresh-session reviewer returned `RALPH_REVIEW: PASS`.

---
id: 031
title: harness-audit Dimension 6 (harness gates) + gap handoff
status: in-progress
blocked_by: [028]
parent: null
priority: 0
created: 2026-07-14
---

## What to build

Extend `.claude/skills/harness-audit/SKILL.md` so it detects gate coverage and hands off to harness-apply. Keep it advisory — detect and recommend, never apply.

- Add Dimension 6 (**Harness gates**) to the "What gets audited" table; extend the glossary with `gate` / `build-node` if needed.
- Extend the Phase 2 inventory to read three surfaces: global `~/.claude/settings.json`; project `.claude/settings.json` + `.claude/settings.local.json` + `.claude/hooks/`; and the Pi adapter (present at `~/.pi/agent/extensions/harness-gates/`? enabled in `~/.pi/agent/settings.json`?). Report per gate category: covered-claude-global / covered-claude-project / covered-pi / missing.
- Add Phase 3 finding guidance that names the build-node gap explicitly (e.g. "build agent writes with no afterWrite format/lint gate"; "no changed-files static gate before commit"; "gates present in Claude, missing in Pi").
- Add the `## Harness gap handoff` block (per `.claude/skills/_shared/harness-gap-handoff.md`) to the emitted spec, plus a "run `harness-apply <scope>`" next-step line alongside the existing `/dev-plan` spec handoff. Update "What this skill does NOT do" to reflect detect-and-hand-off (still no apply).

Reference: `/home/james/symphony/plans/harness-audit-apply-pairing-pi-gates.md`.

## Acceptance criteria

- [ ] the audited-dimensions table includes a Harness-gates dimension
- [ ] Phase 2 inventory reads all three surfaces (Claude global, Claude project, Pi adapter) and reports per-category coverage
- [ ] the emitted spec includes a `## Harness gap handoff` block referencing the shared contract, plus a `harness-apply` next-step line
- [ ] frontmatter parses and the skill remains advisory (no apply/enforcement added)

## Verification

`grep -q 'Harness gap handoff' .claude/skills/harness-audit/SKILL.md && grep -qi 'harness-apply' .claude/skills/harness-audit/SKILL.md && grep -q 'harness-gap-handoff' .claude/skills/harness-audit/SKILL.md && ! grep -q 'personalize-harness' .claude/skills/harness-audit/SKILL.md`

## Blocked by

- Blocked by #028

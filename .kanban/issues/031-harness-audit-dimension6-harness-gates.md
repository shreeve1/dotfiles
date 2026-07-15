---
id: 031
title: harness-audit Dimension 6 (harness gates) + gap handoff
status: done
updated: 2026-07-15
actor: ralph
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

- [x] the audited-dimensions table includes a Harness-gates dimension
- [x] Phase 2 inventory reads all three surfaces (Claude global, Claude project, Pi adapter) and reports per-category coverage
- [x] the emitted spec includes a `## Harness gap handoff` block referencing the shared contract, plus a `harness-apply` next-step line
- [x] frontmatter parses and the skill remains advisory (no apply/enforcement added)

## Verification

`grep -q 'Harness gap handoff' .claude/skills/harness-audit/SKILL.md && grep -qi 'harness-apply' .claude/skills/harness-audit/SKILL.md && grep -q 'harness-gap-handoff' .claude/skills/harness-audit/SKILL.md && ! grep -q 'personalize-harness' .claude/skills/harness-audit/SKILL.md`

## Blocked by

- Blocked by #028

## Implementation Notes

- **Glossary** — added three domain terms (gate, build node, surface) so the Dimension 6 finding vocabulary is grounded in the skill itself; consistent with the project rule "if a finding needs a term not in CONTEXT.md, propose adding it."
- **Dimension 6** — added to the audited-dimensions table as an always-on check; the table now reads "Five dimensions always. A sixth conditionally." (the conditional-5 was renamed in #028 and stays).
- **Phase 2 inventory** — extended the "Pure detection, no judgment" bullet list with a Dimension-6 sub-bullet that walks the three surfaces (claude-global, claude-project, pi adapter) and emits the per-category coverage digest in the exact shape the shared contract defines.
- **Phase 3 finding guidance** — added a "Dimension 6 — build-node gap guidance" paragraph with four named patterns (afterWrite format/lint missing, no changed-files static gate before commit, gates present in Claude missing in Pi, gate fires in Pi but scripts are missing on disk) so every Dimension-6 finding names the surface + category + missing anchor. Renamed the in-text "(if conditional-4 triggered)" → "(if conditional-5 triggered)" stale reference caught during the read-through.
- **Phase 4 spec template** — inserted the `## Harness gap handoff` block (per `.claude/skills/_shared/harness-gap-handoff.md` schema v1) with `surfaces_present`, the 8 gate categories, and `recommended_scope`. Added `Run /harness-apply <scope>` as next-step #2 alongside the existing `/dev-plan` line, citing the same shared contract so the consumer side knows exactly which file to consult.
- **What this skill does NOT do** — added a bullet explicitly stating the skill emits the handoff block but does NOT invoke `harness-apply`; detect-and-hand-off only, still no apply. Frontmatter description unchanged (still "Advisory-only — no hooks, no gates, writes one spec file.").
- **Verification** — issue's `## Verification` command passes (exit 0): all four greps hit (Harness gap handoff / harness-apply / harness-gap-handoff) and the `personalize-harness` negative grep is clean.
- **Scope** — only `.claude/skills/harness-audit/SKILL.md` was edited; the issue-file status flip is the only other change. No leaks.

# Ralph Progress Log

This file tracks implementation notes across Ralph iterations.

# Conventions & Decisions

- Skill renaming follows `git mv` (preserves rename detection) + `# formerly: <old>` frontmatter comment + H1 title `Foo (formerly Bar)`. Operators searching old names still find them.
- `.pi/agent/settings.json.template` is the source-of-truth JSON; the dead `rpiv-pi` package + extension entries (lines 17–20 and ~25 pre-clean) have been removed — `rpiv-pi` lives only in `.pi/agent/archive/` and is non-functional.
- Shared contract convention: new cross-skill schemas live in `.claude/skills/_shared/<name>.md` with a YAML block + closed-set enum, not prose. Both producer and consumer skills cite the same file.
- Pairing rule (harness-audit / harness-apply): auditor emits the gap handoff block, applier consumes it and skips already-answered questions. Schema v1 has 8 gate categories and the four-element coverage set `{claude-global, claude-project, pi, missing}`.

# Iteration Log

## #028 Rename skills to harness-audit/harness-apply + shared handoff contract — 2026-07-15

**What changed:** git-mv'd both skills; updated frontmatter name+description; added `formerly:` alias notes; authored `.claude/skills/_shared/harness-gap-handoff.md` (YAML schema, 8 gate categories, 4-value coverage set, recommended_scope); removed dead `rpiv-pi` config from `.pi/agent/settings.json.template`.

**Files:** `.claude/skills/harness-audit/SKILL.md`, `.claude/skills/harness-apply/SKILL.md`, `.claude/skills/_shared/harness-gap-handoff.md`, `.pi/agent/settings.json.template`.

**Decisions:** Kept `harness-apply/SKILL.md` in-body mentions of `personalize-harness` (5 script-template echo strings + 2 vocabulary cross-refs) untouched — they belong to #029 (gate-upgrades slice, plan 2.5/5.2). Scope discipline: #028 is rename+contract foundation only.

**Conventions established:** See top of this file. Most importantly: shared schemas go under `.claude/skills/_shared/`, not inline in either skill.

**Notes for next iteration:** #029 (blocked by #028) is now eligible. It must add the `staged-static-check.sh` template to `harness-apply`, rework Q7 (changed-files default; demote whole-suite), add lint autofix, and at last sweep the in-body `personalize-harness` references for the rename-proof label `harness-gate`.

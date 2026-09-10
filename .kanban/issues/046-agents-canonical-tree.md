---
id: 046
title: Create canonical AGENTS tree in dotfiles (.agents/AGENTS.md + 83 skills)
status: todo
blocked_by: []
parent: null
priority: 1
created: 2026-09-09
updated: 2026-09-10
---

## What to build

The dotfiles repo gains a canonical AGENTS-standard tree at `.agents/` that is fully independent of the Claude Code lane — real files, no symlinks into `.claude/`. This is the root of the "move to the AGENTS standard" goal (codex, pi, dsh consume the same guidance + skills out of the box).

Two deliverables:

1. `.agents/AGENTS.md` — a merged global guidance file. Content: the Agent Notes from `.claude/CLAUDE.md` (Simplicity First / Surgical Changes / Explain It Simply, plus the graphify pointer), the four always-on rules folded in as sections (ponytail, explain, legacy, graphify-first — they currently live in `.claude/rules/*.md` and would otherwise be silently lost when dsh-cc-skills is removed), and the codex-specific guidance merged from `.codex/AGENTS.md` (client-ops context, Think Before Coding, Goal-Driven Execution) deduped against the above.
2. `.agents/skills/` — real copies of all 83 skills from `.claude/skills/` (flat, same layout: `<name>/SKILL.md`). Independence: the AGENTS side has no symlink into the Claude side.

## Acceptance criteria

- [ ] `.agents/AGENTS.md` exists and contains the Agent Notes (Simplicity First / Surgical Changes / Explain It Simply), the four rules as sections (including the graphify graph-first rule from `40-graphify.md`), and the merged codex guidance (client-ops context present)
- [ ] `.agents/skills/` contains 83 skill directories (`<name>/SKILL.md` layout), real copies (not symlinks into `.claude/`)
- [ ] `.agents/` contains no symlink pointing into `.claude/`
- [ ] `.claude/` (CLAUDE.md, rules, skills) is untouched by this ticket

## Verification

`test -f .agents/AGENTS.md && grep -q 'Surgical Changes' .agents/AGENTS.md && grep -qi 'graphify' .agents/AGENTS.md && find .agents/skills -maxdepth 2 -name SKILL.md | wc -l` (expect 83) and `find .agents -type l | wc -l` (expect 0)

## Blocked by

None — can start immediately.

## Implementation Notes

- Copy: `cp -a .claude/skills/. .agents/skills/`.
- The merge: `.claude/CLAUDE.md` Agent Notes are the base; append the four rule sections (ponytail 10-, explain 20-, legacy 30-, graphify 40-); merge in `.codex/AGENTS.md` sections, deduping "Simplicity First" / "Surgical Changes" which appear in both.
- The graphify pointer in `.claude/CLAUDE.md` is project-scoped ("when repos carry it"); keep it as a pointer, not a hard requirement.
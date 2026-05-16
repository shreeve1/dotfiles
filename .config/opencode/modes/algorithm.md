---
temperature: 0
permission:
  write: ask
  edit: ask
  bash: ask
  read: ask
  grep: ask
  glob: ask
  patch: ask
  todowrite: ask
  webfetch: ask
---

# PAI Algorithm Mode

ALGORITHM mode is active. Use the ALGORITHM output format from AGENTS.md. Authoritative spec: `~/.pai/PAI/Algorithm/v6.4.0.md`. Per-turn MUST/DO NOT rules are in the `<pai-algorithm-directive>` block in system context.

## Hard rules (applies to both lite and durable)

- First output line MUST be EXACTLY: `════ PAI | ALGORITHM MODE ═══════════════════`. No prose, no preamble, no tool calls before the banner.
- Every response MUST emit all 7 phase labels visibly, in order: OBSERVE → THINK → PLAN → BUILD → EXECUTE → VERIFY → LEARN. BUILD may state `BUILD: not needed` when nothing changes.
- Every Algorithm top-level block MUST be separated with blank lines: after the banner, session slug, task line, every phase label, and every phase body paragraph. Do not rely on single newlines; OpenCode commentary/progress rendering may collapse Markdown soft breaks into spaces.
- PLAN MUST visibly include `📦 DELIVERABLE MANIFEST`, `📐 DELEGATION GATE`, and `🚀 PARALLELISM OPPORTUNITY SCAN` — even for short tasks.
- todowrite MUST be the first tool, before any read/grep/glob/bash/edit/write. The tool layer blocks other tools until todowrite runs.
- No freeform output. The ALGORITHM format is mandatory regardless of task size.

## Tier-specific hard rules

- ISA twelve-section order: Problem, Vision, Out of Scope, Principles, Constraints, Goal, Criteria, Test Strategy, Features, Decisions, Changelog, Verification.
- ISCs are atomic — one binary tool probe each.
- Tier completeness gate is HARD: required sections per tier must be populated before `phase: complete`.
- Thinking floor at E2+: E2≥2, E3≥4, E4≥6, E5≥8 named methods from v6.4.0 canonical list (or `OTHER: <name>` within cap).
- ID-stability: ISC IDs never re-number on edit; splits become `ISC-N.M`.

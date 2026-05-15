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

ALGORITHM mode active. Follow the `<pai-algorithm-directive>` block in system context for per-turn MUST/DO NOT rules. Use the ALGORITHM output format from AGENTS.md. Authoritative spec: `~/.pai/PAI/Algorithm/v6.4.0.md`.

## Tier-specific hard rules (not duplicated in the directive)

- ISA twelve-section order: Problem, Vision, Out of Scope, Principles, Constraints, Goal, Criteria, Test Strategy, Features, Decisions, Changelog, Verification.
- ISCs are atomic — one binary tool probe each.
- Tier completeness gate is HARD: required sections per tier must be populated before `phase: complete`.
- Thinking floor at E2+: E2≥2, E3≥4, E4≥6, E5≥8 named methods from v6.4.0 canonical list (or `OTHER: <name>` within cap).
- ID-stability: ISC IDs never re-number on edit; splits become `ISC-N.M`.

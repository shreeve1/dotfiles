---
title: Drawio Artifact Colocation
summary: Drawio diagrams live beside the plan, design, or memory note they illustrate, with a cwd fallback when neither system applies.
type: decision
status: promoted
created: 2026-10-27
updated: 2026-10-27
topics: [projects]
---

## Decision

Drawio diagrams are colocated with the artifact they illustrate. Superpowers plans use the plan's directory and basename; Superpowers brainstorming/design work uses the companion design or spec location. When neither Superpowers route applies, project memory uses the related memory note's directory and basename, with a relative link from the note to the diagram. If no Superpowers or project memory applies, use `cwd/drawio/<subject>/diagram.drawio`.

## Related

- `.agents/skills/drawio/SKILL.md` - operational routing and examples.
- `memory/README.md` - memory layout and cross-link rules.

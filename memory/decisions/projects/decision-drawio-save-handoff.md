---
title: Drawio Save Handoff
summary: A user's report that they updated a diagram counts as the save confirmation; the agent reads it and proceeds without asking again.
type: decision
status: promoted
created: 2026-10-27
updated: 2026-10-27
topics: [projects]
---

## Decision

When James says he updated, changed, or edited a drawio diagram, treat that as confirmation that he saved it. Read the diagram immediately and continue the requested update without asking whether he saved. Ask for a save only when an existing diagram needs editing and James has not reported a change or save.

## Related

- `.agents/skills/drawio/SKILL.md` - operational turn-taking rule.
- `memory/decisions/projects/decision-drawio-artifact-colocation.md` - where the companion diagram is stored.

---
title: Reuse Existing Drawio Diagrams
summary: Search for a relevant diagram before creating one; identify candidates and ask which to open, then iterate on the confirmed file.
type: decision
status: promoted
created: 2026-10-27
updated: 2026-10-27
topics: [projects]
---

## Decision

When working with the drawio skill, search the owning artifact location and project root for relevant existing `.drawio` files before creating anything. If a relevant diagram is found, report its path and ask James to confirm which diagram to open; after confirmation, iterate on that file. Create a new diagram only when no relevant diagram exists.

## Related

- `.agents/skills/drawio/SKILL.md` - operational find-before-create workflow.
- `memory/decisions/projects/decision-drawio-artifact-colocation.md` - storage routing for the selected diagram.

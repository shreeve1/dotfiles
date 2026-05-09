---
id: 021
title: Add legacy import approval
status: pending
type: HITL
priority: 21
blocked_by: [008, 017]
parent: null
created: 2026-05-09
---

## What to build

Add the human-approved import and promotion flow for legacy Claude, Codex, OpenCode, and Pi memory surfaces after the AFK inventory bridge identifies candidates. This is HITL because importing legacy user context into canonical memory can promote sensitive or stale information.

## Acceptance criteria

- [ ] Import preview lists candidate legacy memories with source path, sensitivity, provenance, confidence, and proposed canonical destination.
- [ ] User can approve, reject, or defer each import batch before canonical memory writes occur.
- [ ] Denied paths, auth files, private keys, and excluded transcript classes cannot be imported.
- [ ] Approved imports write only to `~/.pai` canonical memory with source provenance.
- [ ] Tests prove rejected and deferred imports do not alter canonical memory state.

## Blocked by

- Blocked by #008.
- Blocked by #017.

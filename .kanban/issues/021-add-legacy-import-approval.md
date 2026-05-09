---
id: 021
title: Add legacy import approval
status: done
type: HITL
priority: 21
blocked_by: [008, 017]
parent: null
created: 2026-05-09
updated: 2026-05-09
actor: ralph
---

## What to build

Add the human-approved import and promotion flow for legacy Claude, Codex, OpenCode, and Pi memory surfaces after the AFK inventory bridge identifies candidates. This is HITL because importing legacy user context into canonical memory can promote sensitive or stale information.

## Acceptance criteria

- [x] Import preview lists candidate legacy memories with source path, sensitivity, provenance, confidence, and proposed canonical destination.
- [x] User can approve, reject, or defer each import batch before canonical memory writes occur.
- [x] Denied paths, auth files, private keys, and excluded transcript classes cannot be imported.
- [x] Approved imports write only to `~/.pai` canonical memory with source provenance.
- [x] Tests prove rejected and deferred imports do not alter canonical memory state.

## Blocked by

- Blocked by #008.
- Blocked by #017.

## Implementation Notes

Added `legacy-import-approval` preview and decision APIs. Previews expose source path, sensitivity, provenance, confidence, and proposed `~/.pai` canonical memory destination. Approval decisions write accepted low-trust canonical memories with source provenance; reject and defer decisions return decisions without mutating canonical memory. Denied paths, auth files, private keys, and transcript classes are blocked from import.

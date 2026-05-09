---
id: 010
title: Add Codex adapter tracer
status: done
type: AFK
blocked_by: [004, 005, 008, 018]
parent: null
created: 2026-05-09
updated: 2026-05-09
actor: ralph
---

## What to build

Implement the first Codex adapter tracer library and installable templates by integrating the existing Codex hook port with canonical `~/.pai` events, policy decisions, and memory writes while preserving current Codex approval/auth settings.

## Acceptance criteria

- [x] Codex hooks emit canonical events to `~/.pai` instead of treating `.codex/pai/MEMORY` as canonical.
- [x] Existing `.codex/pai` behavior remains compatible during the bridge-read migration period.
- [x] Codex direct launches attach to or create canonical session IDs where hook data permits.
- [x] PRD-centered Codex enforcement remains compatible until ISA migration is complete.
- [x] This issue does not mutate live Codex config, auth, approval policy, or hooks; it produces installable templates or fixtures only.
- [x] Tests cover Codex hook input/output contracts and no auth or approval policy mutation.

## Blocked by

- Blocked by #004.
- Blocked by #005.
- Blocked by #008.
- Blocked by #018.

## Implementation Notes

Added `.pai/src/codex-tracer.ts` and `.pai/docs/codex-adapter-tracer.md` with template-only Codex tracer behavior. The tracer attaches to `PAI_SESSION_ID`, derives canonical session IDs from Codex hook session IDs without exposing raw IDs, creates managed native sessions when needed, maps Codex hook input/output contracts into redacted canonical event inputs, preserves `.codex/pai/MEMORY` as a bridge-read legacy surface, and explicitly preserves PRD-first compatibility. Install templates use the shared installer contract and do not mutate live Codex config, auth, approval policy, or hooks. Tests cover session resolution, hook mapping, canonical ingest, bridge compatibility, PRD compatibility, and no auth/approval mutation.

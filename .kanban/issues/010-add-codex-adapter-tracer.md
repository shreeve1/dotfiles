---
id: 010
title: Add Codex adapter tracer
status: in_progress
type: AFK
blocked_by: [004, 005, 008, 018]
parent: null
created: 2026-05-09
---

## What to build

Implement the first Codex adapter tracer library and installable templates by integrating the existing Codex hook port with canonical `~/.pai` events, policy decisions, and memory writes while preserving current Codex approval/auth settings.

## Acceptance criteria

- [ ] Codex hooks emit canonical events to `~/.pai` instead of treating `.codex/pai/MEMORY` as canonical.
- [ ] Existing `.codex/pai` behavior remains compatible during the bridge-read migration period.
- [ ] Codex direct launches attach to or create canonical session IDs where hook data permits.
- [ ] PRD-centered Codex enforcement remains compatible until ISA migration is complete.
- [ ] This issue does not mutate live Codex config, auth, approval policy, or hooks; it produces installable templates or fixtures only.
- [ ] Tests cover Codex hook input/output contracts and no auth or approval policy mutation.

## Blocked by

- Blocked by #004.
- Blocked by #005.
- Blocked by #008.
- Blocked by #018.

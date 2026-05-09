---
id: 013
title: Add provider-agnostic dream pipeline
status: pending
type: AFK
blocked_by: [007, 008, 017]
parent: null
created: 2026-05-09
---

## What to build

Implement `pai-dream` core as a provider-agnostic distillation pipeline that turns redacted events into proposed durable memories without coupling the architecture to Claude-specific inference. This AFK slice uses deterministic and local/offline providers only; real-provider enablement is handled by a separate HITL issue.

## Acceptance criteria

- [ ] Dream pipeline consumes only redacted canonical events and never raw unredacted payloads.
- [ ] Provider interface supports a deterministic test double and local/offline rules-only mode.
- [ ] Existing Claude inference is documented as a future provider option but is not enabled by this issue.
- [ ] Dream failures do not corrupt raw events, accepted memories, or review queues.
- [ ] Proposed memories include provenance, confidence, assertion type, trust level, and review status.

## Blocked by

- Blocked by #007.
- Blocked by #008.
- Blocked by #017.

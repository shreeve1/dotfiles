---
id: 013
title: Add provider-agnostic dream pipeline
status: done
type: AFK
priority: 13
blocked_by: [007, 008, 017]
parent: null
created: 2026-05-09
updated: 2026-05-09
actor: ralph
---

## What to build

Implement `pai-dream` core as a provider-agnostic distillation pipeline that turns redacted events into proposed durable memories without coupling the architecture to Claude-specific inference. This AFK slice uses deterministic and local/offline providers only; real-provider enablement is handled by a separate HITL issue.

## Acceptance criteria

- [x] Dream pipeline consumes only redacted canonical events and never raw unredacted payloads.
- [x] Provider interface supports a deterministic test double and local/offline rules-only mode.
- [x] Existing Claude inference is documented as a future provider option but is not enabled by this issue.
- [x] Dream failures do not corrupt raw events, accepted memories, or review queues.
- [x] Proposed memories include provenance, confidence, assertion type, trust level, and review status.

## Blocked by

- Blocked by #007.
- Blocked by #008.
- Blocked by #017.

## Implementation Notes

Added `.pai/src/dream-pipeline.ts` with redacted-event validation, deterministic and local/offline provider implementations, review-gated proposed memory writes, and future-provider metadata for Claude inference. Replaced the `pai-dream` scaffold CLI with `pai-dream run`, documented provider boundaries in `.pai/docs/pai-dream.md`, exported the dream API from `.pai/src/index.ts`, and added focused tests for redaction boundaries, provider modes, future Claude enablement, failure safety, and proposed memory metadata.

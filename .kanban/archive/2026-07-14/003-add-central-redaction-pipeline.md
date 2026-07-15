---
id: 003
title: Add central redaction pipeline
status: done
type: HITL
priority: 3
blocked_by: [001]
parent: null
created: 2026-05-09
updated: 2026-05-09
actor: ralph
---

## What to build

Implement the central redaction pipeline that runs before event storage, JSONL export, dream inputs, retrieval, or provider calls. This is HITL because it governs secrets, tokens, credentials, auth files, private keys, and sensitive local paths.

## Acceptance criteria

- [x] Redaction runs before any full or summarized payload can reach SQLite, JSONL, dream, retrieval, or inference providers.
- [x] Hard path denylist includes `.env*`, private keys, SSH secrets, `.codex/auth.json`, `.pi/agent/auth.json`, and known credential locations.
- [x] Token and credential pattern tests cover prompts, tool inputs, tool outputs, commands, env vars, transcripts, and model responses.
- [x] Payload size limits, taint labels, and `redaction_status` are attached to every event.
- [x] Tests prove JSONL never receives unredacted payload content.

## Blocked by

- Blocked by #001.

## Implementation Notes

- Added `.pai/src/redaction.ts` with central payload redaction for prompts, tool IO, commands, env vars, transcripts, and model responses.
- Added hard denylist path redaction for `.env*`, SSH secrets, private key files, Codex/PI auth files, AWS credential files, and `.netrc`.
- Added redacted event envelopes with payload summaries, taint labels, payload size limits, findings, `redaction_status`, and destination metadata.
- Added destination-boundary preparation for SQLite, JSONL, dream, retrieval, and inference provider handoffs.
- Added tests proving credential patterns are redacted across all payload surfaces and JSONL receives no raw payload fields or secret content.

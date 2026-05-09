---
id: 003
title: Add central redaction pipeline
status: in_progress
type: HITL
blocked_by: [001]
parent: null
created: 2026-05-09
---

## What to build

Implement the central redaction pipeline that runs before event storage, JSONL export, dream inputs, retrieval, or provider calls. This is HITL because it governs secrets, tokens, credentials, auth files, private keys, and sensitive local paths.

## Acceptance criteria

- [ ] Redaction runs before any full or summarized payload can reach SQLite, JSONL, dream, retrieval, or inference providers.
- [ ] Hard path denylist includes `.env*`, private keys, SSH secrets, `.codex/auth.json`, `.pi/agent/auth.json`, and known credential locations.
- [ ] Token and credential pattern tests cover prompts, tool inputs, tool outputs, commands, env vars, transcripts, and model responses.
- [ ] Payload size limits, taint labels, and `redaction_status` are attached to every event.
- [ ] Tests prove JSONL never receives unredacted payload content.

## Blocked by

- Blocked by #001.

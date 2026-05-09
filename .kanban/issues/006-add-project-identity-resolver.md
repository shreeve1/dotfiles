---
id: 006
title: Add project identity resolver
status: in_progress
type: AFK
blocked_by: [001]
parent: null
created: 2026-05-09
---

## What to build

Implement project identity resolution that gives every event and memory a stable project ID without leaking private remotes, usernames, credentials, or absolute local paths.

## Acceptance criteria

- [ ] Resolver derives IDs from normalized git remote and repo root when available.
- [ ] Credentials and private remote details are stripped before hashing.
- [ ] Path fallback uses a stable hash and separate display alias.
- [ ] Manual aliases are runtime-local under `~/.pai` and not committed.
- [ ] Tests cover remote normalization, credential stripping, path fallback, and collision handling.

## Blocked by

- Blocked by #001.

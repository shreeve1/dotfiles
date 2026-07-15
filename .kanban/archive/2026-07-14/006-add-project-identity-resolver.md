---
id: 006
title: Add project identity resolver
status: done
type: AFK
priority: 6
blocked_by: [001]
parent: null
created: 2026-05-09
updated: 2026-05-09
actor: ralph
---

## What to build

Implement project identity resolution that gives every event and memory a stable project ID without leaking private remotes, usernames, credentials, or absolute local paths.

## Acceptance criteria

- [x] Resolver derives IDs from normalized git remote and repo root when available.
- [x] Credentials and private remote details are stripped before hashing.
- [x] Path fallback uses a stable hash and separate display alias.
- [x] Manual aliases are runtime-local under `~/.pai` and not committed.
- [x] Tests cover remote normalization, credential stripping, path fallback, and collision handling.

## Blocked by

- Blocked by #001.

## Implementation Notes

Added `.pai/src/project-identity.ts` with deterministic project IDs derived from normalized git remote and repo root inputs, plus path fallback IDs and runtime-local manual alias metadata. The resolver strips credentials before remote normalization, never returns raw local repo paths in `project_id`, keeps display aliases separate from hashed IDs, and exposes manual alias storage under the PAI runtime home. Added tests for remote normalization, credential stripping, path fallback behavior, runtime-local alias paths, and deterministic collision suffixing.

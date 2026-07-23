---
id: 034
title: Execute one child in an isolated Pi worktree
status: done
blocked_by: [033]
parent: null
priority: 0
created: 2026-07-22
updated: 2026-07-23
actor: ralph
action_reviewed: 2026-07-23
---

## What to build

Extend `bin/gralph` to execute one eligible child from the saved frontier. The coordinator claims the issue with a `gralph:claimed` label tied to the run manifest, creates branch `gralph/<parent>/issue-<child>` in its own Git worktree, converts the trusted issue body into an issue-specific Ralph prompt, and drives bounded fresh `pi -p --no-session` iterations directly. Do not vendor or depend on `@lnilluv/pi-ralph-loop`.

Pi must start with normal extension discovery disabled, only the explicitly required Ralph skill and a repo-owned worker-guard extension enabled, and a temporary HOME. Do not expose the built-in `bash` tool. The guard must root `read`, `write`, `edit`, `grep`, `find`, and `ls` inside the worker worktree after realpath/symlink resolution, reject configured secret files, and expose one narrow check tool that can run only the exact verification command admitted by issue 033. That check runs inside the worktree with credential, token, SSH-agent, and Git-helper environment removed. The coordinator—not the worker—owns commits, GitHub mutations, final verification, and all other Git commands.

## Acceptance criteria

- [x] The executor atomically claims one eligible issue before launch and refuses an issue claimed by another live run.
- [x] It records the starting SHA and creates a uniquely named branch and worktree without changing the caller's checkout.
- [x] Every Pi iteration is ephemeral (`--no-session`), loads the Ralph instructions explicitly, and receives the issue body, acceptance criteria, prior iteration status, and worktree path.
- [x] The worker has no `bash` tool; guarded file tools reject symlink escapes, mutation outside the worktree, `.env*`, Git credential files, Pi/Claude auth files, and SSH key paths.
- [x] The guard's only process tool accepts no free-form command argument and can execute only the exact verification command stored in the trusted manifest, with credentials and agent sockets removed.
- [x] The verification line is consumed only from a direct child already admitted by issue 033; no other issue text is interpolated into a shell command.
- [x] On reported completion, the coordinator runs verification, commits the resulting diff, and requires a bounded Ralph-complete status, at least one commit beyond the recorded base SHA, a clean worktree, and an exit-zero issue verification command.
- [x] Failure writes a reason to the run manifest and preserves the branch and worktree for inspection.
- [x] Tests use fake `pi`, `gh`, and Git repositories and prove both the successful path and each mechanical completion gate.

## Verification

`bash tests/gralph-single-child.test.sh`

## Blocked by

- Blocked by #033

## Implementation Notes

Added single-child claiming, isolated branches/worktrees, bounded ephemeral Pi workers, a path/secret-confining worker guard with one admitted check tool, coordinator-owned verification and commits, durable failure state, and fake-driven mechanical gate coverage.

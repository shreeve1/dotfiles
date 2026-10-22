# Session Capture: itastack workspace drops git

- Date: 2026-10-22
- Purpose: James removed git from the itastack workspace after moving agents to the WSL disk copy. He uses Syncthing (laptop, phone, Windows) as his backup and now publishes editions by copy-and-diff instead of the export-src build.
- Scope: what changed in the workspace and what replaced git's jobs. Client and ticket content excluded.

## Durable Facts

- Since 2026-10-22 `~/Documents/itastack` on wrk (and the Windows copy) has no `.git`. The last commit was 43d70a9, tagged `pre-git-removal-2026-10-22`. The full history is archived at `~/itastack-git-archive-2026-10-22.tar.gz` on wrk WSL (James plans to delete it). — Evidence: `tar -tzf`, `git fsck` on the extracted archive.
- Agents no longer commit. Removed: AGENTS.md "Commit at the end of every task" and the Reviewed-by/commit-msg rule; `sd.py commit` and its git helpers (about 230 lines) plus `tests/test_commit.py`; the commit steps in personal-memory, startday, halo-ticket/project-research, workflow-builder, talk-it-through and troubleshoot-my-pc. — Evidence: itastack files; independent verify 7/7.
- `personal-memory/sweep.py` now deletes `.sessions/` and `artifacts/` files older than 90 days by age, skipping a file whose size or mtime changed after listing. Undo is Syncthing's `.stversions/` on the Windows copy (simple versioning, keep 5, 30 days, and only for changes arriving from another device). — Evidence: `sweep.py`, `tests/test_sweep.py` (82 tests pass).
- Skill test suites still pass without git: startday 662, personal-memory 82, procedure-capture 52, meeting 11, startday-spec 9.
- Before deleting `.git`, Syncthing reconnects from surftop/phone had produced 136 conflict copies. Git history showed 2 held lines found nowhere else: an older iPad project profile (superseded by a 2026-10-22 rewrite) and an older next_action line. All were deleted; the Windows copy's `.stversions/` keeps them for 30 days.

## Decisions

- Remove git entirely; Syncthing is the backup (James).
- Releases: only James's copy drops git. `export-src/` is left unchanged and unused because James now publishes by copy-and-diff. Its `ignored_sources` check returns an empty set without `.git`, so the old build would no longer block git-ignored files such as `.mcp.json`.
- Weekly sweep deletes by age, with Syncthing as the undo (James).
- The reviewer-and-tests rule for skill script changes is dropped (James). AGENTS.md keeps only the reviewer check for memory changes touching more than 10 notes.
- Sync conflict copies deleted (James).

## Evidence

- itastack `AGENTS.md`, `.agents/skills/startday/scripts/sd.py`, `.agents/skills/personal-memory/sweep.py`, `memory/preferences/document-scaffolding.md`, `memory/workflows/workstation/windows-itastack-copies.md`.

## Exclusions

- Client, ticket and research-file content seen while checking conflict copies.

## Open Questions And Follow-Ups

- surftop and the phone may still hold an old `.git`; Syncthing no longer syncs it.
- `export-src/` and `.githooks/` remain in the workspace unused; delete or archive them if copy-and-diff stays the release method.
- The aidev copy and Offload Mirror are git-based and no longer receive updates.

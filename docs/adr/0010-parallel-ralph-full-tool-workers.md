# 0010 — Parallel Ralph: full-tool workers, lane as the sandbox

**Status:** Accepted (2026-09-10)

## Context

The two ancestors disagree at the root about worker trust. gralph's worker
is a pure code-writer: no git, no bash — tools pinned to
`read,write,edit,grep,find,ls,gralph_check` (`bin/gralph:227`), the
coordinator runs verification and commits (`bin/gralph:280`). Because the
worker cannot run the tests it writes against, it iterates blind, hence
gralph's 3-retry loop feeding back output tails (`bin/gralph:197-240`).
tralph's worker has full tools: it runs `## Verification` itself, commits,
and spawns its own fresh-session reviewer (ralph `SKILL.md:246-318`).

## Decision

The merged tool uses **full-tool workers (the tralph model) in every
lane**. The lane worktree is the blast-radius sandbox: an unattended agent
with bash can only wreck its own lane, never the integration branch or
another lane. Safety is enforced downstream, not by amputating the worker:

- the landing gate (ADR 0009) re-runs verification before anything
  reaches the integration branch;
- an out-of-scope lane diff (vs. the ticket's advisory `files:` scope)
  bounces at landing;
- claim/bookkeeping (manifest, sidecars, lock) stays with the
  coordinator — workers never edit `.kanban` or the manifest.

## Considered options

Sandboxed workers (gralph model) were rejected as the default: more
auditable, but blind iteration converges slower and the 3-retry loop is a
workaround for a self-inflicted constraint. Observed evidence (2026-09-10
`ralph-df` run): full-tool workers completed tickets first-try, DONE
confirmed by the driver gate.

## Consequences

- Worker sessions are trusted with bash unattended; the exposure is
  bounded to the lane plus whatever the host shell exposes. Do not run
  parallel lanes on a machine whose environment holds credentials the
  tickets don't need.
- gralph's blind-retry loop is retired; retries become repair tickets or
  reviewer-FAIL bounces, both visible on the board.

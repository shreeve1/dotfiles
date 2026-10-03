# 0012 — pstack runs as an omp port, `pstack-` prefixed

**Status:** Accepted (2026-10-03)

## Context

pstack (backnotprop/pstack, Cursor-authored) was previously half-installed
as a DeepSeek Harness port: 20 of 47 skills, DSH-only tool names
(`delegate_worker`, `ask_user_question`), and `pstack-teach` depended on a
missing `pstack-how`. Several local skills duplicated pstack's playbooks.

## Decision

- Fresh port of 46 of 47 upstream skills at `157aae39`, prefixed `pstack-`
  (`setup-pstack` → `pstack-setup`) so they never collide with local
  `teach`/`tdd`. Cursor constructs are rewritten to omp tools per
  `_shared/pstack-omp-compatibility.md`. Skipped: Benny automations and
  `make-bot-ui` (both need Cursor automation webhooks). Skills are invoked
  as `/skill:pstack-<name>` (omp's skill command form), not `/pstack-<name>`.
- omp has no per-call model on `task`, so pstack's per-role model slugs map
  to agents: `pstack-opus` (`@slow`), `pstack-sol` (`@advisor`),
  `pstack-glm` (`@task`); panels use all three.
  `~/.agents/pstack-models.md` symlinks into dotfiles.
- `poteto-agent` keeps upstream routing (spawns subagents), so
  `task.maxRecursionDepth: 2`.
- `pstack-comment-sicko` is read-only (read/grep/glob); the parent applies
  its reported deletions.
- `pstack-poteto-mode` is model-invocable; the rest stay user-invoked.
  omp ignores pstack's `mode`/`reminder` frontmatter, so poteto-mode is not
  sticky.
- Archived as superseded: diagnose, diagnosing-bugs, humanizer,
  improve-codebase-architecture, codebase-design, prototype,
  writing-great-skills, handoff, goal, goal-objective, ponytail,
  ponytail-audit, ponytail-review, ponytail-help. Kept: the spec → tickets
  → implement → ralph chain (`ralph-loop.service` runs
  `ralph/ralph-supervise.sh`; unit installed but inactive on 2026-10-03), code-review, tdd,
  research, skill-router, ponytail-debt/gain, teach, grill-with-docs and
  its dependencies.

## Consequences

- Upstream syncs are a re-port: diff upstream against `157aae39`, re-apply
  the mapping, re-run the reference/construct check.
- Depth-2 recursion multiplies concurrent subagents and cost.

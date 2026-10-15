# 0019 — pstack skills removed

**Status:** Accepted (2026-10-15). Supersedes 0012.

## Context

ADR 0012 ported 46 of 47 backnotprop/pstack skills as `pstack-*` under
`.agents/skills/`, with omp role agents (`pstack-opus`, `pstack-sol`,
`pstack-glm`, `pstack-comment-sicko`, `poteto-agent`) and a model map at
`.agents/pstack-models.md`. ADR 0018 replaced omp with pi and slated the
pstack skills to stop naming omp. The user asked to remove pstack entirely
rather than finish that port: the skills' value was tied to the omp harness
and its role agents, and the port had open compatibility debt.

## Decision

Delete every active pstack skill and asset:

- the 46 `.agents/skills/pstack-*` skill directories;
- `.agents/skills/_shared/pstack-omp-compatibility.md` and the tracked
  `.agents/pstack-models.md`, plus the machine-local
  `~/.agents/pstack-models.md` symlink;
- the omp role agents `.omp/agent/agents/pstack-{opus,sol,glm,comment-sicko}.md`
  and `.omp/agent/agents/poteto-agent.md`.

Repair the references that pointed at removed skills:

- the offload worker prompt in `.agents/skills/_shared/offload/commands.md`
  no longer names `pstack-poteto-mode`;
- `implement/references/worker-rules.md` drops its pstack attribution;
- the stale `archive/pstack/` ignore line is removed.

Historical records are not rewritten: `archive/skills/pstack-*` (superseded
snapshots), `.kanban/issues/062`, and `wiki/raw/sessions/*` are not active
skills and stay.

## Consequences

- `implement` carries the implementation rules directly; the pstack
  `prove-it-works` / `test-behavior-not-implementation` / `fix-root-causes` /
  `laziness-protocol` principles are gone as separate skills.
- `poteto-agent` and the pstack model map are gone. Subagent model routing
  now lives solely in pi's `subagents.agentOverrides`
  (`.pi/agent/settings.json`).
- Re-adding pstack later is a fresh port, not a revert of this ADR.

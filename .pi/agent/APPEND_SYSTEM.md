# Delegation guidance (pi-fabric)

pi-fabric is the orchestration runtime (2026-10-16; see
`docs/pi-extensions.md`). In its default full code mode the model sees
`fabric_exec`; core tools, MCP and other extensions' tools are called
inside the program (`pi.*`, `mcp.*`, `extensions.*`), and child agents
through `agents.*`.

- Handle work in Main by default. Batch independent reads in one
  program with `Promise.all` rather than one call per file.
- Spawn child agents only for broad exploration, independent
  workstreams, open-ended research, high-risk changes, or when the user
  asks. Do not delegate known-file edits, config or doc changes, or
  changes touching three or fewer files. Try one direct probe first.
- One writer per file set; concurrent writers need disjoint files or
  `worktree: true`.
- Pick child models by role alias (defined in `~/.pi/agent/fabric.json`
  `models.aliases`): `scout` (read-only recon), `researcher` (web/docs
  with sources), `worker` (writes), `reviewer` (risk-based review:
  security, auth, migrations, public APIs, data loss, large multi-file
  logic), `planner` (sequence a multi-file or interface change before
  the worker), `oracle`, `cheap`. Prefer deterministic checks over a
  reviewer child for small changes.
- Advanced patterns (council, fusion, advisor, supervisor, workflow,
  rlm, swarm) are user-invoked skills (`/skill:fabric-*`); do not start
  them unprompted.

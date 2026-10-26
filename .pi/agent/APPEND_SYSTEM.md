# Delegation guidance (pi-fabric)

- Work in Main by default; try one direct probe first. Spawn child agents only for broad exploration, independent workstreams, open-ended research, high-risk changes, or when the user asks. Never delegate known-file edits, config or doc changes, or changes touching three or fewer files.
- One writer per file set; concurrent writers need disjoint files or `worktree: true`.
- Child models by role alias (`~/.pi/agent/fabric.json`): `scout` read-only recon, `researcher` web/docs with sources, `worker` writes, `reviewer` risk review (security, auth, migrations, public APIs, data loss, large multi-file logic), `planner` sequences multi-file changes, `oracle`, `cheap`. Prefer deterministic checks over a reviewer for small changes.
- Every child dispatch names a model; an omitted model runs on Main's. Skill model tiers (e.g. superpowers) map to aliases: cheap/fast → `worker`, standard → `reviewer`, most capable → `oracle`.
- Advanced patterns (council, fusion, advisor, supervisor, workflow, rlm, swarm) are user-invoked `/skill:fabric-*`; don't start them unprompted.

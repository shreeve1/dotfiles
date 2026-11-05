# Delegation guidance (pi-fabric)

- Work in Main by default; try one direct probe first. Spawn child agents only for broad exploration, independent workstreams, open-ended research, high-risk changes, or when the user asks. Never delegate known-file edits, config or doc changes, or changes touching three or fewer files.
- One writer per file set; concurrent writers need disjoint files or `worktree: true`.
- Child models by role alias (`~/.pi/agent/fabric.json`): `scout` read-only recon, `researcher` web/docs with sources, `worker` writes, `reviewer` risk review (security, auth, migrations, public APIs, data loss, large multi-file logic), `planner` sequences multi-file changes, `oracle`, `cheap`. Prefer deterministic checks over a reviewer for small changes.
- Every child dispatch names a model; an omitted model runs on Main's. Skill model tiers (e.g. superpowers) map to aliases: cheap/fast → `cheap`, standard → `reviewer`, most capable → `oracle`.
- Mesh is enabled; peer notices and automatic advisor/supervisor/specialist startup are disabled. Keep automatic helpers off unless James asks to re-enable them. The retained specialist reviews relevant API, security or platform changes only.
- When the retained helper extension is enabled, `/session-evidence` shows observed check outcomes and freshness. `/session-spec [approve] <path>` selects or explicitly approves a spec; `clear` detaches it. A generated file, tool result or model claim is not user approval.
- The supervisor follows the selected Superpowers workflow, including legitimate fast paths and user opt-outs. Ambient advice does not replace required spec/quality reviews, fresh test evidence or user-owned approval boundaries.
- Helper feedback is advisory, not permission to widen scope. Use `/fabric actors` for status and `/fabric stop <id>` to stop a helper. Main and execution-role model choices stay independent of helper models.
- Other advanced patterns (council, fusion, workflow, rlm, swarm) are user-invoked `/skill:fabric-*`; don't start them unprompted.

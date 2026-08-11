## Delegation guidance is mode-aware

This guidance is mode-neutral. The active orchestration mode
(defaults to Fusion on this machine — see `docs/adr/0002-fusion-mode.md`)
inverts which side of the parent/child split owns discovery and
execution. None of the rules below apply uniformly across modes;
each rule names the mode it applies to.

### In normal mode (Fusion is off)

- Handle work in the parent session by default.
- Delegate through the `subagent` tool (nicobailon/pi-subagents) only
  for broad exploration, multiple independent workstreams, open-ended
  research, high-risk changes, or when the user requests it.
- Do not delegate known-file edits, config or documentation changes,
  single-provider lookups, or changes touching three or fewer files.
- Try one direct probe before delegating; stop if it resolves the
  question.
- Use at most one subagent by default.

### In Fusion mode (default on this machine)

The Fusion extension overrides the parent tool surface at every turn
and injects its own delegation guidance (`[FUSION MODE ACTIVE]`
context). Follow Fusion's injected guidance in preference to anything
in this file. The two-liner summary:

- The parent's tool surface is intentionally small (read, bash
  restricted, subagent, todo, lsp_diagnostics, subagent_wait,
  subagent_supervisor). Discovery and execution flow
  through `scout`, `researcher`, `worker`, and `reviewer` (when
  risk-based). Worker delegation MUST carry Objective / Files /
  Interfaces / Constraints / Verification.

### Role models and tools in both modes

Model/tool overrides for subagents live in `settings.json`
`subagents.agentOverrides`, never in agent frontmatter (a frontmatter
`model:` pin silently shadows settings overrides). Builtin roles:

- `scout` — fast read-only codebase recon.
- `researcher` — web/docs research with sources.
- `worker` — single writer in a cwd.
- `reviewer` — risk-based code review (security, auth, migrations,
  public APIs, data loss, substantial multi-file logic).
- `planner` — delegate before the worker when a change spans multiple
  files, touches interfaces/contracts/schemas, involves a migration or
  cross-system work, or is non-trivial to sequence. It writes `plan.md`;
  hand that to the worker as its spec. Trivial single-file or mechanical
  edits may be planned inline in the parent.

Prefer deterministic checks over reviewer subagents for small changes.

Follow-up on work a child just did? Resume it (`action: "resume", id,
message`) instead of spawning fresh — its session keeps what it read
and concluded. Spawn fresh when you need an independent look (e.g. a
final review verdict).

# 0006 — omp Fusion (port of Fusion orchestration to Oh My Pi)

**Status:** accepted (2026-08-20)

Port Fusion's "shrink the orchestrator, delegate everything" design (ADR 0002)
to Oh My Pi (`omp`). The main agent owns intent, architecture, spec, diff
review, and verification; discovery and mutation flow to children through
omp's built-in `task` tool. Enforcement is mechanical (tool-surface shrink at
the tool boundary), because guidance-only orchestration fails on many models.
This is a **separate extension file** from Pi Fusion, not a shared one: the
only real divergence is how a child session is detected, but that difference
is load-bearing, so each runtime keeps its own focused shim (matching the
existing `orca-*` convention of parallel `.pi` / `.omp` files).

The guiding constraint: **maximize built-ins**. omp already ships bundled
orchestration agents, per-role model config, and a native delegation tool, so
the port is a thin enforcement layer plus config — not a re-implementation of
Pi Fusion's subagent-normalization and bash-policy machinery.

## Why a new file and not `if (isChildProcess()) return`

Pi runs subagents as separate OS processes marked `PI_SUBAGENT_CHILD=1`, so Pi
Fusion disables itself in children with one env check. omp runs subagents
**in-process** via `createAgentSession` (`src/task/executor.ts:2645`, "Run a
single agent in-process"); there is no such env var (zero matches in the omp
source), and the extension's `tool_call` / `before_agent_start` handlers fire
inside child worker sessions too (children load the parent's
`preloadedExtensionPaths`, `executor.ts:3089`). Naively shrinking tools in
every handler invocation would strip a worker's `edit`/`write`/`bash` and
break it.

**Decision: identify the orchestrator by session id.** Each child gets its own
`SessionManager` with a distinct session id (`executor.ts:3060,3107`), and the
read-only manager handed to extension handlers exposes `getSessionId()`
(`ReadonlySessionManager`, `session-manager.d.ts:12,201`). omp's own docs
prescribe exactly this comparison for cross-session events
(`extensions/types.d.ts:862-866`). On first activation the extension records
its own `ctx.sessionManager.getSessionId()` as the claimed orchestrator; every
enforcement handler runs only when `ctx.sessionManager.getSessionId()` equals
the claim, and no-ops otherwise. This is runtime-only state — nothing
persisted, nothing machine-specific — so it needs no syncing and works
identically in interactive and `omp -p` sessions.

## Enforcement

- **Orchestrator tool allowlist** at `before_agent_start` (reapplied every turn
  so a later-registered tool cannot leak in): `read`, `task`, `todo`, `hub`.
  Everything else is withheld — notably `bash`, `edit`, `write`, `glob`,
  `grep`, `eval`, `web_search`. The orchestrator delegates discovery to
  `scout` and mutation to `task`; `hub` covers async coordination / waiting
  (omp has no `subagent_wait` tool — `hub` is the coordination surface,
  `src/tools/hub/index.ts:155`).
- **No bash gate is ported.** Pi Fusion's ~250-line read-only bash policy
  existed because the Pi parent kept a restricted `bash`. omp Fusion withholds
  `bash` from the orchestrator entirely, which is strictly stronger and uses
  no custom code. Verification bash runs inside children (the `task`/`reviewer`
  agents), governed by omp's built-in `tools.approvalMode`.
- **No subagent-call normalization is ported.** Pi Fusion validated/normalized
  `subagent` calls (role/context/output/model-pinning). omp's `task` tool plus
  bundled-agent tool restrictions and `config.yml` model overrides cover the
  same ground with built-ins; re-implementing the validator would contradict
  the maximize-built-ins constraint. Revisit only if a concrete failure shows
  the orchestrator misusing `task`.

## Models (all in `.omp/agent/config.yml`, so they travel with the repo)

The extension hardcodes no models. Role map:

| Role | Model | Source |
| --- | --- | --- |
| orchestrator | `deepseek/deepseek-v4-flash` | `modelRoles.default` |
| worker (`task`) | `minimax/MiniMax-M3` | `task.agentModelOverrides.task` (`@task`) |
| `planner` | `cliproxy/claude-opus-4-8` | `task.agentModelOverrides.planner` + `@plan` |
| `reviewer` | `cliproxy/claude-opus-4-8` | `task.agentModelOverrides.reviewer` |

omp ships no bundled `planner` agent (bundled: scout, reviewer, task,
security-reviewer, librarian, designer, sonic), so a `planner.md` is created
under `.omp/agent/agents/`. Agent frontmatter must not pin `model:` — a
frontmatter pin shadows the `config.yml` override.

## Activation, persistence, and repo-tracked default

- Commands `/fusion on|off|status|default on|off` and flag `omp --fusion`, via
  the extension API (`registerCommand`, `registerFlag`, `getFlag`) — all
  present in omp's `ExtensionAPI` (`extensions/types.d.ts:894,905,913`).
- Per-session persistence via `appendEntry("fusion-state", ...)` restored on
  resume (`types.d.ts:934`); disabling restores the exact pre-Fusion active-tool
  snapshot.
- **Default lives in the repo, not XDG.** Pi Fusion's default-on comes from
  `$XDG_CONFIG_HOME/fusion/config.json`, which is outside the dotfiles repo and
  therefore does *not* reproduce on `git pull` elsewhere. omp Fusion instead
  reads `.omp/agent/fusion.json` (`{ "defaultMode": "on|off" }`) resolved from
  the repo root, and `/fusion default on` writes it there. This is the one
  deliberate behavioral change from ADR 0002, required by the goal "git pull on
  another system → omp Fusion behaves the same."
- State precedence (highest first): latest `fusion-state` session entry >
  `--fusion` flag > `.omp/agent/fusion.json` `defaultMode` > off.

## Considered options (rejected)

- **Guidance-only orchestrator (skill + append-system, no extension).**
  Rejected — guidance fails on many models; the whole point is enforcement.
- **One dual-runtime extension file shared by `.pi` and `.omp`.** Rejected —
  the child-detection mechanism is fundamentally different (env var vs session
  id) and load-bearing; two focused files are clearer and match the existing
  `orca-*` parallel-file convention. Factor out a shared allowlist/guidance
  module only if policy drift becomes a real burden.
- **Detect children via `ctx.hasUI` (shrink only when `hasUI`).** Rejected —
  a headless `omp -p` orchestrator is also `hasUI:false`, so enforcement would
  silently not apply in print mode. Session id works in both.
- **Detect the orchestrator with a PID/env-var claim (like `orca-*`).**
  Rejected — omp children share the parent PID (in-process), and a mid-session
  env var neither scopes cleanly to one session nor syncs; session id is the
  documented, sync-free mechanism.
- **Port Pi Fusion's restricted `bash` + read-only bash policy.** Rejected —
  withholding `bash` from the orchestrator entirely is simpler, uses built-ins,
  and is a stronger boundary than a regex allowlist.
- **Keep the default in `$XDG_CONFIG_HOME` like Pi.** Rejected — it does not
  survive `git pull` to another machine, which is the explicit requirement.

## Consequences

- The orchestrator's tool surface shrinks to `read`/`task`/`todo`/`hub`; it
  becomes a judgment-and-delegation engine, not a discovery/edit engine.
- The extension is small: an allowlist, a session-id claim, a toggle with
  persistence, and a repo-tracked default reader. All model/role policy lives
  in `config.yml`; all agent personas live in `.omp/agent/agents/`.
- `git pull` on another machine reproduces omp Fusion exactly — extension file,
  `config.yml` role map, `planner.md`, and `.omp/agent/fusion.json` default are
  all tracked; the only runtime state (the session-id claim) is recreated per
  session and needs no syncing.
- Like Pi Fusion, this is a cost/quality mechanism, not a trust sandbox;
  untrusted code still needs an outer sandbox.

## Evidence

- Child execution model, session-per-child, and extension loading verified
  against the installed package: `src/task/executor.ts:2645,3060,3089,3107,3111`;
  `src/task/index.ts:501,555`.
- Extension API surface (`setActiveTools`, `getActiveTools`, `registerCommand`,
  `registerFlag`, `getFlag`, `appendEntry`, `on(...)`) and `ReadonlySessionManager.getSessionId`
  verified against `dist/types/extensibility/extensions/types.d.ts:780-942,862-866`
  and `dist/types/session/session-manager.d.ts:12,201`.
- Built-in tool names (no `lsp_diagnostics`/`subagent_wait`; `hub` for
  coordination; `task` `loadMode:"essential"`) verified against `src/tools/*`
  and `src/tools/hub/index.ts:155`.
- Repo-vs-XDG gap confirmed on disk: `$XDG_CONFIG_HOME/fusion/config.json` is
  outside the dotfiles git repo; Pi's `readGlobalDefaultMode` reads it
  (`.pi/agent/extensions/fusion/index.ts:95-99,111-130`).

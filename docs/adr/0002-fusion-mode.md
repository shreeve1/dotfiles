# 0002 — Fusion orchestration mode (opt-in, global-default on)

**Status:** accepted (2026-07-23)

Reduce routine cost without lowering quality. A strong parent owns intent,
architecture, task specifications, diff review, and deterministic verification;
cheap fresh-context children do discovery and execution. Discovery flows through
`scout` (code) and `researcher` (external facts); mutations flow through
`worker`; a separate `reviewer` is used only for high-risk changes.

Fusion is **opt-in** as a capability (hardcoded fallback: off). On this
machine, the user-level global config sets `defaultMode: "on"` so a brand-new
session inherits Fusion without ceremony while `/fusion off` remains
session-local. Activation is restored across resume from the latest session
entry before global config is consulted.

## Activation and persistence

- Extension: `.pi/agent/extensions/fusion/index.ts` (auto-discovered).
- Child processes (`PI_SUBAGENT_CHILD=1`) no-op the extension entirely.
- Commands: `/fusion on`, `/fusion off`, `/fusion status`,
  `/fusion default on|off`.
- CLI: `pi --fusion` enables Fusion for a fresh session.
- State precedence (highest first):
  1. Latest `fusion-state` session entry on resume.
  2. `--fusion` CLI flag on startup.
  3. `$XDG_CONFIG_HOME/fusion/config.json` (fallback
     `~/.config/fusion/config.json`) — only `defaultMode`.
  4. Off.
- Disabling restores the exact pre-Fusion active-tool snapshot.
- Active tools are reapplied at every `before_agent_start` so any tool
  registered later cannot silently leak into the parent set.

## Role split

| Role | Owns | Forbidden |
| --- | --- | --- |
| **parent** | intent, architecture, task decomposition, diff review, deterministic verification, retry ladder | grep/find/ls/discovery delegations to self; broad read-side exploration beyond the changed files; editing/deleting files; web search |
| **scout** | pre-work code discovery (files, entry points, constraints) | file mutations; web research |
| **researcher** | current external facts; primary sources only | file mutations; agent definitions |
| **worker** | one writer per file set (disjoint sets for concurrent workers) | sub-delegation; tasks broader than the spec; writing uncommitted code outside the request |
| **reviewer** | risk-based review (security, auth, migrations, public APIs, data loss, substantial logic) | file mutations; bash; agent definitions |
| **planner** | default before the worker for multi-file, interface/contract/schema, migration, cross-system, or non-trivial-to-sequence changes; writes `plan.md` as the worker's spec | file mutations; bash; being skipped for non-trivial work without stating why |

One writer per cwd. Parallel writers require isolated git worktrees.
Superseded by ADR 0004 (concurrent subagents with disjoint file sets).

## Mechanical enforcement (no polite asks)

The extension intercepts events and blocks at the tool boundary:

- **Parent tool allowlist** at `before_agent_start`: `read`, `bash`
  (restricted — see below), `lsp_diagnostics`, `subagent`,
  `subagent_wait`, `subagent_supervisor`, `todo`, `advisor` (exception
  only). Disabled by default: `grep`, `find`, `ls`, `edit`, `write`,
  `lsp_navigation`, generic `lsp`, AST search/replace, web
  search/fetch, `intercom`.
- **Subagent interception** at `tool_call`: new execution allowed only
  for `scout` / `researcher` / `worker` / `reviewer` / `planner`. All new executions
  are coerced to `context: "fresh"`; explicit `fork` is overridden.
  Top-level and nested `model`/`thinking` overrides are rejected (role
  models come from settings). `output` is forced to `false` for every
  role except `worker` (source edits) and `planner` (`plan.md`, the spec
  the worker executes) so the built-in `context.md` / `research.md`
  output files do not pollute repo roots. `chain.parallel` may be an
  array of static tasks or a single dynamic fanout template object
  (with `expand` + `collect`); both shapes are validated recursively.
  Async-control actions on existing children are allowed: `interrupt`,
  `stop`, `resume`, `steer`. `append-step` is execution-shaped
  (`{action: "append-step", id/runId, chain: [oneStep]}`) and is
  validated using the same role + context + output + model-pinning
  rules. Management actions that mutate agent definitions/models are
  blocked while Fusion is active (`create`, `update`, `delete`,
  `eject`, `enable` / `disable`, `reset`, `watchdog.configure`,
  `grant-spawn-budget`, `schedule`, `schedule-cancel`).
- **Bash policy** purpose is role enforcement, not a child sandbox.
  Bash must not recreate disabled parent discovery or write tools.
  - **Globally permitted** (read-only Git: `git status`, `git diff`,
    `git show`, `git log`; deterministic verification: `cargo test`,
    `cargo build`, `go test`, `go build`, `go vet`, `make test`,
    `make build`, `make lint`, `npm test`, `npm run`, `pnpm test`,
    `pnpm run`, `yarn test`, `yarn run`, `pytest`, `python -m pytest`,
    `ruff check`, `mypy`, `tsc`, `eslint`, `biome`, `prettier --check`).
    No `bash -lc` / `sh -c` style wrappers — only the actual
    verification command is matched, and the trailing-token discipline
    is strict (every token after the head must be in an explicit
    allowlist of flags/revs/paths; generic `--name=value` is
    rejected).
  - **Always rejected**: shell chaining (any of `;`, `&&`, `||`,
    `|`, `&`, redirection, command / process substitution, newline);
    `>`, `>>`, `<`; package install/update/publish; formatter/linter
    fix / write modes; snapshot update modes; mutating Git commands
    (see the parent-commit exception below); `tee`/output-to-file
    variants; unrestricted interpreters/shells (`sh`, `bash`, `zsh`
    invoked with no command, `python`, `node`, `ruby`, `perl`).
  - **Parent-commit exception** (the ONLY mutating-Git carve-out): the
    parent may author commits with `git add <paths>` and
    `git commit -m <msg>`. Because commit messages legitimately contain
    shell metacharacters (`feat(scope): ...`, `!`), the recognizer
    (`isSafeGitCommit`) runs BEFORE the metacharacter/dangerous gates,
    but admits only tightly-shaped, injection-free forms: a
    single-quoted message `'[^'\n\r]*'` (shell-literal, no embedded
    quote/newline) or a double-quoted message excluding `$`, backtick,
    backslash, and newline, each fully anchored so no second command
    can follow; and `git add` whose tokens are all safe paths or a
    small flag set (`-A`/`-u`/`-p`/`-f`/`--`), with any newline/CR/
    vertical-whitespace rejected before tokenizing. Every other git
    verb (`push`, `pull`, `fetch`, `reset`, `rebase`, `checkout`,
    `switch`, `restore`, `merge`, `revert`, `cherry-pick`, `clean`,
    `rm`, `mv`, `stash`, `branch`, `tag`, `clone`, `am`) and every
    other commit form (`--amend`, `-a`, commit without `-m`) stays
    hard-denied. Covered by the `(5b)` block in `fusion-smoke.sh`.
  - **Project exceptions** live in trusted `<project>/.pi/fusion.json`
    under `allowedCommands: ["exact complete command string", ...]`.
    No regex / prefix matching. Global shell-metacharacter and
    dangerous-mode denies still win. Honored only when
    `ctx.isProjectTrusted()`.

## Models and tools

Role models and thinking levels are configured in `settings.json` `subagents.agentOverrides`; this extension never hardcodes them.

Agent frontmatter does not pin models — a frontmatter pin silently shadows settings overrides.

The machine's default parent model is `openai-codex/gpt-5.6-sol` (high
thinking). Fusion never silently switches models. If Fusion is active
with `pi-duo/Duo`, and Duo's actor equals the worker model, the
extension warns at `session_start` (no block). Fusion does not stack
Duo initially; a future GPT-actor Duo profile is opt-in only if measured
grounding failures justify the verifier cost (Duo `REVISE` reruns the
actor — not free).

## Session-efficiency rules

Five rules every Fusion session follows so the parent's small context and tool surface stay bounded; a session that breaks any of these re-creates the cost the mode exists to remove.

- no duplicate parent discovery: parent never redoes discovery scout already produced.
- scout repo-only and worker for remote operations: scout reads the repo only; external facts and remote operations flow through researcher/worker, never through the parent.
- stop after first Bash-policy block or known role-config failure: a deny is a deny; parent does not retry around it.
- bounded child budgets: every delegation carries a verifiable scope/budget up front.
- return control for long async: parent returns with status, never blocks on long children.

## Worker delegation contract

Every worker delegation carries five parts:

1. **Objective** — one sentence; what success looks like.
2. **Files** — exact paths the worker may read and may write.
3. **Interfaces** — schemas, types, function signatures to honor.
4. **Constraints** — what to avoid, what "smallest correct change" means here.
5. **Verification** — the deterministic check the parent will run after.

## Retry ladder

1. First miss: `resume` the same persisted worker session with precise correction.
2. Second miss: parent supplies the exact verbatim patch; worker applies it.
3. Dictated patch still fails: stop retrying and revise the parent's plan.

No blind retry loops. No model switching inside a worker task. Each step
narrows the search, not widens it.

## Verification and advisor

Builds on ADR 0001's two-layer split (grounding gate + completeness
review).

- `gap-review` automatic completeness review runs **only when repo state
  changed during the user turn** (worker mutation; not on plain chat,
  design-only, or read-only turns). It uses git porcelain
  change-signature comparison anchored at `turn_start` vs terminal
  `turn_end` (mirrors the existing
  `pi-subagents/src/watchdog/change-signature.ts` helper). Manual
  `/gap-review` covers read-only architecture/design analysis when the
  user asks. The latest request + answer + touched-files candidate is
  retained after terminal `turn_end` for manual invocation.
- `rpiv-advisor` becomes exception-only: stuck, recurring errors,
  ambiguous or conflicting evidence, changing approach, unusually
  risky decisions. No start- or end-of-task mandate. The full
  conversation is still forwarded when called.
- Subagent watchdog (already opt-in) stays off. Pi-Lens diagnostics
  remain complementary deterministic checks.

## Parent workflow

1. Receive request. Restate intent in one sentence.
2. Decide the smallest needed delegation: `scout` (code discovery),
   `researcher` (external facts), `worker` (mutation), `reviewer`
   (risk-based review only). `planner` is the default before the worker
   for multi-file, interface/contract/schema, migration, cross-system,
   or non-trivial-to-sequence changes (it writes `plan.md` as the
   worker's spec); trivial single-file or mechanical edits may be
   planned inline in the parent, stating the one-line reason for the
   skip.
3. Bundle each delegation with Objective / Files / Interfaces /
   Constraints / Verification.
4. Review the returned diff and changed files yourself.
5. Run final deterministic checks yourself (Bash, allowed and from the
   trusted project list when needed).
6. Apply the retry ladder on miss; revise the plan on the third miss.

## Consequences

- Parent's effective tool surface shrinks by an order of magnitude,
  which is the point: it stops being a discovery engine and becomes a
  judgment engine.
- Cheap fresh-context children absorb the boring work without
  bloating the parent's context window or burning its model on
  discovery.
- Bootstrapping the user on `pi --fusion` removes a class of "should I
  delegate?" thrash; `/fusion off` is the escape hatch.
- The `.pi/fusion.json` per-project exception list is the only knob
  new projects touch when verification commands don't match the global
  list — and the global list is intentionally conservative so the list
  stays small.
- The Bash policy is "role enforcement, not sandbox": Fusion is for
  cost and quality, not for trust boundaries; untrusted code still
  needs an outer sandbox.

## Considered options (rejected)

- **Always-on Fusion without `/fusion off` escape hatch.** Rejected —
  cost reduction is the goal, not mode lock-in; some sessions (one-off
  questions, ops runs) genuinely want the parent's normal tool set.
- **Let the parent keep `grep` / `find` / `ls` "for convenience".**
  Rejected — the parent is allowed to call `scout` which has those.
  Letting the parent use them directly re-creates the cost problem.
- **Accept arbitrary Bash with a regex allowlist.** Rejected — exact
  complete command strings only. Regex drift is high-cost and the
  list is genuinely small.
- **Stack Duo verifier on top of Fusion by default.** Rejected — Duo
  REVISE reruns the actor (not free). Revisit only if measured
  grounding failures justify the cost.
- **Run the completeness review every turn.** Rejected — it's
  expensive (re-reads the repo) and most turns are read-only
  (no worker mutation). Use the mutation signature instead.

## Evidence

- The fusion pattern was reviewed against the upstream reference at
  `github.com/mihneaptu/opencode-fusion` skill
  `fusion-setup/agent/build.md`.
- Stack facts verified against current repository files (`.pi/agent/
  extensions/pi-subagents/src/runs/shared/pi-args.ts`,
  `.pi/agent/extensions/gap-review/index.js`, `.pi/agent/extensions/
  graphify-guard/`, the existing `pi-subagents`
  `subagents.agentOverrides` model contract).
- The two-layer grounding/completeness distinction is preserved per
  ADR 0001; Fusion changes *cadence* (mutation-triggered instead of
  every non-trivial turn) and *scope* (manual-only for read-only
  analysis), not the distinction itself.

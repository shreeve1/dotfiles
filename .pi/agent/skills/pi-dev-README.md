# PI `dev-*` / `pi-dev-*` Pipeline — Canonical Reference

Spec-driven development pipeline for the PI coding tool. One canonical chain; two side-branches. Modeled after the Claude Code `/dev-*` pipeline but adapted for PI skill naming and capabilities.

---

## Canonical Pipeline

```
dev-prd         idea → PRD
      │
      ▼
pi-dev-epic     (conditional) multi-epic PRD → per-epic mini-PRDs
      │
      ▼
pi-dev-plan     PRD (or mini-PRD) → implementation plan
                (includes Phase 3.5 Feasibility Preflight)
      │
      ▼
pi-dev-validate plan → risk analysis + risky-step rewrite
      │
      ▼
pi-dev-build    plan → wave-based parallel execution
                (Phase 1.5 Approval Gate before any code touches)
      │
      ▼
pi-dev-test     plan → run validation commands, verify acceptance criteria
      │
      ▼
(user-driven git commit — no dedicated skill)
```

### When conditional steps fire

| Step | Trigger |
|------|---------|
| `pi-dev-epic` | `Scope:` is `Multi-week` or `Ongoing` OR feature count > 8 OR `--force` |

### Notable differences from Claude `/dev-*`

| Claude has | PI has | Why |
|------------|--------|-----|
| `/dev-shard` | — | No automated token-budget sharding on PI; decompose manually if a plan is too large |
| `/dev-review` | — | No Codex second-opinion skill on PI |
| `/dev-stories` | — | No Playwright UI-story generator on PI |
| `/dev-team` | — | No Teams automation on PI |
| `/commit` | — | User commits via normal git workflow |

These gaps mean the PI pipeline stops after `pi-dev-test`; merge/commit is a manual follow-up.

---

## Canonical Directory Layout

Every `pi-dev-*` skill reads from and writes to the `artifacts/` tree:

| Directory | Producer | Purpose |
|-----------|----------|---------|
| `artifacts/specs/` | `dev-prd` | PRDs (top-level files) |
| `artifacts/specs/<parent>/` | `pi-dev-epic` | Mini-PRDs, `README.md`, `original-prd.md` |
| `artifacts/plans/` | `pi-dev-plan` | Implementation plans (top-level files) |
| `artifacts/investigations/` | `dev-investigate` | Root-cause findings |
| `tests/regression/` | `dev-investigate` | Regression tests generated alongside investigations |

Any skill that **reads** plans or PRDs searches `artifacts/plans/` and `artifacts/specs/` **recursively** so any subdirectories (e.g., manually-created shards) are discovered automatically.

---

## Side-Branches (not on the critical path)

| Skill | When to use |
|-------|-------------|
| `dev-investigate` | Bug or unexpected behavior — iterative root-cause loop. Outputs to `artifacts/investigations/` and `tests/regression/`. |
| `pi-brainstorm` | Open-ended ideation, or re-planning when `pi-dev-plan`'s feasibility preflight rejects a plan. |

---

## Feasibility & Approval Gates

Two checkpoints prevent the pipeline from silently shipping a broken plan:

1. **`pi-dev-plan` Phase 3.5 — Feasibility Preflight.** Lightweight check that the plan is implementable as written (referenced files exist or are marked new, dependencies/platforms are present or added as prerequisites, architecture assumptions are grounded, scope is execution-sized, sequencing is viable). If fundamentally infeasible, stops and hands off to `pi-brainstorm`.

2. **`pi-dev-build` Phase 1.5 — Approval Gate.** Presents plan summary (title, task count, files touched, whether `## Risk Analysis` is present) and requires explicit `Proceed with build` selection via `ask_user` before any workspace or code changes.

`pi-dev-validate` serves as a backstop for feasibility issues that slipped past `pi-dev-plan` Phase 3.5 — it surfaces them as critical findings rather than re-running the preflight.

---

## Traceability Invariants

Tags flow end-to-end:

```
#req-[id]             created by dev-prd
    │
    ├─► pi-dev-epic       propagated verbatim to mini-PRDs
    │
    ├─► pi-dev-plan       propagated to tasks:  - [ ] [N.M] <action> #req-<id>
    │                     [N.M] is a stable anchor for pi-dev-build checkboxes and pi-dev-test matching
    │
    ├─► pi-dev-validate   cross-references #req tags for orphan detection
    │
    └─► pi-dev-test       matches acceptance criteria to plan tasks by #req tag
                          flips [T.N.M] checkboxes in ## Tests as test tasks pass
```

Never rename or drop a `#req-[id]` once it is created. It is the only stable link between layers.

---

## Quick Reference — Skill → Output

| Skill | Writes to |
|-------|-----------|
| `dev-prd` | `artifacts/specs/<name>.md` |
| `pi-dev-epic` | `artifacts/specs/<parent>/epic-N-<slug>.md` + `README.md` + `original-prd.md` |
| `pi-dev-plan` | `artifacts/plans/<name>.md` |
| `pi-dev-validate` | Mutates plan in place (adds `## Risk Analysis`) |
| `pi-dev-build` | Mutates plan in place (flips `[ ]` → `[x]`); modifies source code |
| `pi-dev-test` | Test results to stdout; flips `[T.N.M]` checkboxes in the plan's `## Tests` section |
| `dev-investigate` | `artifacts/investigations/investigation-<ts>.md` + `tests/regression/fix-<ts>.*` |

---

## Tool Naming — PI vs Claude

PI skills use PI tool names. When cross-referencing the Claude `/dev-*` workflow, substitute:

| Claude Code Tool | PI Tool |
|------------------|---------|
| `Task` | `subagent` |
| `AskUserQuestion` | `ask_user` |
| `Read` | `read` |
| `Edit` | `edit` |
| `Write` | `write` |
| `Bash` | `bash` |
| `Glob` | `find` |
| `Grep` | `rg` |
| `TodoWrite` | `todo_write` |
| (n/a — Claude lacks) | `read_plan`, `get_progress`, `update_progress` (PI plan-state tools used by `pi-dev-build`) |

Never leak PascalCase Claude tool names into PI skills; never reference PI-specific tools (`read_plan`, `update_progress`, etc.) in contexts where they may not be available.

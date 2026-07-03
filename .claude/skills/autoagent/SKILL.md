---
name: autoagent
description: "Score-driven hill-climb loop for stress-testing and auto-improving any CLI-driven system (agent harness, Temporal workflow, cron job, scraper, CI pipeline). Adapter contract: SUT, Mutator, Probe, Verifier, Runner. USE WHEN autoagent, stress test, hill climb, program.md, harness engineering, Temporal workflow testing, cron experiment, score-driven loop, autonomous system improvement. NOT for LLM eval suites (use Evals)."
---

# autoagent

Universal score-driven experiment loop. Inspired by [kevinrgu/autoagent](https://github.com/kevinrgu/autoagent), generalized so the same hill-climb pattern works on **any** system you can drive from a CLI: AI agent harnesses, Temporal workflows, schedules, cron jobs, scrapers, CI pipelines, n8n / Zapier exports, scheduled Lambdas, etc.

The loop is always the same:

```
baseline → mutate → run probes → score → keep/discard → repeat
```

What changes per system is the **adapter** — five pluggable parts declared in `adapter.yaml`.

---

## The Adapter Contract

Every system under test has the same five parts. The adapter tells the skill how to invoke them for *your* system.

| Part | What it is | autoagent example | Temporal example | Cron example |
|---|---|---|---|---|
| **SUT** | The thing being tested | `agent.py` | A workflow + its schedule | A cron job + its script |
| **Mutator** | What can be changed and how | Edit lines above adapter boundary in `agent.py` | Edit `workflow.py` and/or schedule spec; redeploy | Edit cron expression or script |
| **Probe** | One experiment input + expected outcome | A Harbor task | A trigger payload + post-run assertions on history/state | A simulated tick + side-effect check |
| **Verifier** | Maps observed outcome to score in [0, 1] | `tests/test.py` writes `/logs/reward.txt` | Script queries workflow result / DB / side effects | Script checks expected side effects |
| **Runner** | Executes one probe end-to-end and returns score | `uv run harbor run ...` | `temporal workflow start ... && verify.sh` | `./fake-clock-tick.sh && verify.sh` |

The skill ships reference adapters at `Adapters/autoagent.yaml`, `Adapters/temporal.yaml`, `Adapters/generic-cli.yaml`. Use `InitAdapter` to scaffold a new one.

---

## When to Activate

- "stress test my Temporal workflow / schedule"
- "iterate on this cron job until it stops misfiring"
- "I want autoagent but for my scraper / pipeline / n8n flow"
- "write a program.md"
- "set up a score-driven loop for X"
- "design experiments to break my automation"

NOT for: generic LLM evals (`Evals`), prompt-injection testing (`PromptInjection`), one-off bug investigations (`Investigate`).

---

## Two Execution Modes

Declared in `adapter.yaml` as `loop_mode`:

- **`self_driven`** (default) — this skill runs the loop directly. The assistant reads `results.tsv`, proposes a mutation, applies it, runs probes, decides keep/discard, repeats. Best for live systems where there's no separate coding-agent IDE.
- **`external_meta_agent`** — skill produces `program.md` + probes, then hands off to an external meta-agent (the autoagent pattern). User pastes a kickoff prompt into their coding agent. Best when the SUT is a code harness and the user already has a long-running coding agent session.

---

## Workflow Routing

This table is the **authoritative listing** of workflows. The frontmatter `description` mirrors it for skill-routing search. If a workflow filename changes, update both.

| Request | Route to |
|---|---|
| Start from scratch — interview + write program.md + adapter.yaml | `Workflows/CreateProgram.md` |
| Scaffold an adapter.yaml for an unusual system type (not covered by reference adapters) | `Workflows/InitAdapter.md` |
| Design probes (experiments) targeting failure modes | `Workflows/DesignProbes.md` |
| Run the iteration loop (self-driven) | `Workflows/RunLoop.md` |
| Capture / restore SUT state around a live-system mutation | `Workflows/Snapshot.md` |
| Audit a SUT for stress-testability | `Workflows/AuditSystem.md` |

---

## Workspace Convention (per-run isolation — DEFAULT)

A **run** is one named hill-climb over one system. Runs are keyed by **name, not
by system type** — so "tune temporal workflow A" and "tune temporal workflow B"
are two runs by the exact same rule that "tune a temporal workflow" and "tune a
scraper" are two runs. Both cases resolve identically.

Each run gets its own **workspace directory**, and ALL loop bookkeeping lives
inside it — never at repo root:

```
<repo-root>/
  .autoagent-runs/            gitignored — holds every run's workspace
    <run-name>/              ONE run's workspace (cd here to drive the loop)
      program.md             steering file for THIS run
      adapter.yaml           adapter contract for THIS run
      probes/                THIS run's experiments
      snapshots/             THIS run's pre-mutation snapshots
      results.tsv            THIS run's ledger
      run.log                THIS run's latest output
      .autoagent/            THIS run's driver state (loop.lock, last_score, last_cost)
    <other-run-name>/        a completely separate run — never collides
```

The **SUT itself stays in the real repo tree**. `sut.paths` and
`mutator.edit_surface` in each run's `adapter.yaml` are repo-relative paths
pointing at the actual code/system being tuned (e.g. `workflows/billing/**`).
The workspace holds only bookkeeping; it does not copy the SUT.

Because every run's `results.tsv`, `probes/`, `snapshots/`, and `.autoagent/`
(including its `loop.lock`) are inside its own workspace, a second run's baseline
can NEVER overwrite the first run's ledger or state. This is the same isolation
`autoagent-skill` already uses via `<skill-name>` workspaces — generalized to
`<run-name>`.

### Isolating what mutates

Scope each run's `adapter.yaml` so the loop only touches that run's system:

- `mutator.edit_surface` → only the paths THIS run may mutate.
- `mutator.fixed` → freeze the OTHER runs' SUT paths (plus `adapter.yaml`), so a
  mutation can never wander into a sibling run's system.

### Sequential, not concurrent (shared git repo)

All runs in one repo share **one git history**. RunLoop commits per mutation and
rolls back discards with `git reset --hard HEAD~1`, which assumes the only new
commit is THIS run's mutation. Two loop drivers committing into the same repo at
once corrupt each other's rollback — and the per-workspace `loop.lock` will NOT
catch it (each run has its own lock). So: **drive one run to a stop condition (or
pause it to a clean tree), then start the next.** Sequential heterogeneous or
same-type runs are fully supported; concurrent wall-clock drivers in one repo are
not.

Escape hatch for genuine concurrency: give each run a `git worktree` (separate
working dir + separate HEAD), so the `HEAD~1` resets don't interfere. Overkill
unless you actually need parallel drivers.

### Live-state isolation (only for live SUTs)

Filesystem isolation is enough for `sut.live: false` runs (scraper, CLI, code
harness) — different systems have no shared deployed state. For two **live** runs
of the same type (e.g. two Temporal workflows), the workspace split does NOT
isolate the live layer: they may share a Temporal namespace / cron table. See the
adapter's `snapshot` section (e.g. `Adapters/temporal.yaml`) — scope the snapshot
to that run's schedule-id or use a separate namespace, or one run's discard-restore
can delete the other's live state.

---

## Core Files Produced

Inside the run's workspace (`.autoagent-runs/<run-name>/`):

```
program.md                  human-edited steering file (directive, edit boundary, loop rules)
adapter.yaml                adapter contract: paths and commands for SUT/Mutator/Probe/Verifier/Runner
probes/                     experiments — one directory per probe
snapshots/                  pre-mutation state snapshots (for live-system rollback)
results.tsv                 run ledger
run.log                     latest run output
```

`results.tsv` columns (universal):

```
timestamp  commit  mutation_id  score_avg  passed  probe_scores  cost  status  description
```

`status ∈ {baseline, keep, discard, crash, rollback}`.

---

## Templates

- `Templates/program.md` — universal program.md skeleton
- `Templates/adapter.yaml` — adapter contract skeleton
- `Templates/probe/` — probe scaffold (`probe.yaml`, `input.md`, `verify.sh`)
- `Templates/results.tsv.header` — ledger header

## Reference Adapters

- `Adapters/autoagent.yaml` — kevinrgu/autoagent harness (Harbor tasks, `uv run harbor`)
- `Adapters/temporal.yaml` — Temporal workflows + schedules via `temporal` CLI
- `Adapters/generic-cli.yaml` — any system where you can write a shell command that returns a score

`Adapters/` is a skill-local convention introduced here; host skill systems do not standardize it. Future skills may or may not use the same layout.

## References

- `References/FailureModes.md` — universal failure-mode taxonomy
- `References/GoodSUT.md` — patterns that make any system stress-testable
- `References/OverfittingTest.md` — the "would this matter if the probe disappeared" check
- `References/LiveSystemSafety.md` — rules for mutating production-adjacent systems

---

## Algorithm Integration

OBSERVE-phase tool. Use before claiming a system change is an improvement, to surface what probes will actually be measuring. **ISC criterion** when in play: *"adapter.yaml validates, ≥ 4 probes exist covering the four mandatory failure-mode keys (`misunderstanding`, `missing_capability`, `missing_verification`, `silent_failure`; see References/FailureModes.md), baseline measured at 20–60% pass, at least one diagnosed failure has a designed probe that would catch it."*

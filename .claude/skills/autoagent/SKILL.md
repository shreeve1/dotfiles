---
name: autoagent
description: Score-driven hill-climb loop for stress-testing and auto-improving any CLI-driven system (agent harness, Temporal workflow, cron job, scraper, CI pipeline). Adapter contract: SUT, Mutator, Probe, Verifier, Runner. USE WHEN autoagent, stress test, hill climb, program.md, harness engineering, Temporal workflow testing, cron experiment, score-driven loop, autonomous system improvement. NOT for LLM eval suites (use Evals).
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

## Core Files Produced

In the target repo / working directory:

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

`Adapters/` is a skill-local convention introduced here; the OpenCode skill system does not standardize it. Future skills may or may not use the same layout.

## References

- `References/FailureModes.md` — universal failure-mode taxonomy
- `References/GoodSUT.md` — patterns that make any system stress-testable
- `References/OverfittingTest.md` — the "would this matter if the probe disappeared" check
- `References/LiveSystemSafety.md` — rules for mutating production-adjacent systems

---

## Algorithm Integration

OBSERVE-phase tool. Use before claiming a system change is an improvement, to surface what probes will actually be measuring. **ISC criterion** when in play: *"adapter.yaml validates, ≥ 4 probes exist covering the four mandatory failure-mode keys (`misunderstanding`, `missing_capability`, `missing_verification`, `silent_failure`; see References/FailureModes.md), baseline measured at 20–60% pass, at least one diagnosed failure has a designed probe that would catch it."*

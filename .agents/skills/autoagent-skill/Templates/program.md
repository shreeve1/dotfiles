# autoagent-skill — {{SKILL_NAME}} for {{LLM_MODEL}}

Autonomous experiment loop. You (the loop driver) hill-climb on a numeric
`passed` score by mutating the SKILL.md body, running probes against the small
model, and keeping or discarding the change.

Your job is not to pass any single probe. Your job is to make the **SKILL.md
body** comprehensible to a small/weak LLM so it executes the skill's critical
behaviors correctly across the whole probe suite.

## Directive

Tune `SKILL.md` (the body below the `# ===== FRONTMATTER_BOUNDARY =====` marker)
so that {{LLM_MODEL}} (pi selector), when given SKILL.md loaded via `pi --skill`,
prompt, correctly performs the skill's critical behaviors on the probe inputs.
Maximize `passed`. Preserve the skill's intent — do not delete a behavior the
skill requires; make it legible to the small model instead.

Target model: {{LLM_MODEL}}
System under test: `SKILL.md` (see `adapter.yaml`).
Probes: under `probes/` (see `adapter.yaml` `probe.dir`).
Scoring: each probe's `expected.md` assertions; `verifier.pass_threshold` in `adapter.yaml`.
Cost unit: DOLLARS (pi-computed `usage.cost.total`; falls back to tokens if the
provider reports no dollar cost).

## What you can modify

The `SKILL.md` body ONLY — below the `# ===== FRONTMATTER_BOUNDARY =====` line.
Use the technique catalog in
`~/.claude/skills/autoagent-skill/References/mutator-techniques.md` to pick each
edit. ONE class of change per mutation.

## What you must not modify

`adapter.yaml`, `program.md` (this file), `probes/**`, and the YAML frontmatter
above the boundary marker. These are in `mutator.fixed`.

## Goal

Maximize `passed` (probes scoring ≥ `verifier.pass_threshold`).

- more passed wins
- if passed is equal, the SIMPLER / SHORTER SKILL.md wins (signal-to-noise
  matters for small models)

## Simplicity criterion

All else equal, a shorter SKILL.md with the same `passed` is better — every
trimmed token raises the probability the critical instruction is attended to.
Keep a change that holds `passed` while cutting length.

## How to run

Follow the autoagent skill's `Workflows/RunLoop.md` from this workspace. The
loop driver substitutes `{probe}` and sets `AUTOAGENT_SCORE_FILE` /
`AUTOAGENT_PROBE_DIR` / `AUTOAGENT_COST_FILE` before invoking each `verify.sh`.

Export `LLM_MODEL` (pi selector) in your shell first.

## Cost / budget

Each probe is an agentic `pi -p` turn, NOT a single API call — it can make many
model calls (and tool calls). Cost per probe is therefore much higher than a
bare completion. Budget for this loop: {{DOLLAR_BUDGET or "20"}} USD (high-end
default; the loop stops when the `cost` column sum reaches it). Raise it in this
file if you want a longer climb; lower it for a quick experiment.

## Nondeterminism

Agentic turns are stochastic (multi-step, tool-driven). The same SKILL.md can
yield a different `passed` run-to-run even at low temperature. Consequences:
- A borderline `keep` (passed unchanged, simpler) may be sampling noise, not a
  real win. Re-run the suite once after a climb to confirm the final score holds.
- Don't over-trust a single +1; the plateau stop (`loop.plateau_iterations`)
  filters lucky streaks because noise doesn't compound into a sustained climb.

## Failure analysis

Group failing probes by root cause using the small-LLM failure-mode mapping:

- `misunderstanding` — ambiguous phrasing; mutator: concrete verbs + example.
- `missing_capability` — dropped step; mutator: checklist + explicit step.
- `silent_failure` — claimed done, skipped step; mutator: verification step +
  the probe must assert the step's artifact.
- `missing_verification` — no self-check; mutator: explicit "before finishing,
  verify: …" step.

Prefer edits that fix a CLASS of failures (overfitting rule: if the probe
disappeared, is the edit still worth keeping?).

## Beyond-ceiling rule

If baseline is 0/4 and no mutation in ~5 iterations cracks 1/4, OR every keep is
a trivial reformat with no comprehension gain — STOP. Report that the skill
likely exceeds {{LLM_MODEL}}'s ceiling. Do not grind a capability wall.

## Logging

Every probe run appends to `results.tsv` (see autoagent `RunLoop.md` for the
canonical columns and `mutation_id` formula). `status ∈ {baseline, keep,
discard, crash, rollback}`. `probe_scores` is compact-JSON, one cell.

## NEVER STOP

Once the loop begins, iterate until: human interrupt, budget exhausted, or
`passed` plateau for `loop.plateau_iterations` consecutive iterations.

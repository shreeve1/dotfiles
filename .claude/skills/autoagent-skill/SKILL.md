---
disable-model-invocation: true
name: autoagent-skill
description: "Tune an existing SKILL.md so a small/weak LLM (Haiku, GPT-4o-mini, Gemma, local models) can execute it correctly. Scaffolds an autoagent loop where the SUT is the skill file, probes run the skill against the small model, and the verifier scores whether critical behaviors survived. Delegates the hill-climb to autoagent's RunLoop — does NOT reimplement the loop. USE WHEN user wants to make a skill small-LLM-friendly, tune SKILL.md for a weaker model, reduce skill token bloat for small models, or auto-iterate skill edits against a cheap model. NOT for building new skills from scratch, generic prompt compression (use LLMLingua), or LLM eval suites (use Evals)."
---

# autoagent-skill

Tune an existing `SKILL.md` so a small LLM can actually follow it, using a
score-driven loop. The loop engine is autoagent's — this skill only specializes
it for the SKILL.md → small-LLM case and hands off.

## Core idea

- **SUT** = the target `SKILL.md` (markdown is the system prompt).
- **Probe** = a task input that exercises one of the skill's critical behaviors
  + `expected.md` assertions checking the small model did it right.
- **Verifier** = deterministic: fraction of assertions satisfied
  (`+` must-contain, `-` must-not-contain, `~` regex). LLM-judge is optional.
- **Runner** = `verify.sh` drives the small model through `pi -p` (headless),
  loading the SUT via `--skill`. Because pi gives the model its real tools
  (read/bash/edit/...) and loads referenced files on demand, tool-driven and
  multi-file skills are exercised for real — the model acts, not just narrates.
  This is the part being tuned.
- **Loop** = autoagent `RunLoop.md`: mutate SKILL.md → run probes → keep/discard.

Each mutation that makes the small model follow the skill better raises `passed`.
The loop keeps wins, reverts losses. The tuned SKILL.md is diffed back to its
origin with explicit human review.

## When to activate

- "tune SKILL.md for a small model / haiku / gemma / local LLM"
- "make this skill work on a weaker model"
- "this skill is too long / too clever for small models, help me tighten it"
- "auto-iterate my skill against a cheap model"

NOT for: authoring a new skill (write it first, then tune), generic token
compression without a quality signal, full LLM eval harnesses.

## Preconditions

- The target skill already exists (a `SKILL.md` you can point at).
- `pi` is installed and configured (you already use it). The small model is
  selected via `--model`/`LLM_MODEL` (a pi selector like `anthropic/claude-haiku`);
  provider/api-key come from your pi config. No separate endpoint env needed.
- `jq` on `PATH` (verify.sh parses pi's JSON event stream). `git` + mikefarah
  `yq` v4+ (for the autoagent loop driver).

## The workflow

One linear flow. Run phases in order.

### Phase 1 — Set up the workspace

1. Identify the target: absolute path to the `SKILL.md` and a short name.
2. Identify the small model: `LLM_MODEL` (pi selector, e.g.
   `anthropic/claude-haiku`).
3. Create an isolated workspace (NOT the dotfiles repo — the loop commits per
   mutation and runs `git reset --hard`; never churn the real repo):

   ```bash
   WS="$HOME/.local/share/autoagent-skill/<skill-name>"
   mkdir -p "$WS" && cd "$WS"
   git init -q && cp /path/to/original/SKILL.md ./SKILL.md
   ```
4. Insert the frontmatter boundary marker immediately after the closing `---`
   of the copied SKILL.md's YAML frontmatter:

   ```text
   # ===== FRONTMATTER_BOUNDARY =====
   ```

   The loop will not cross THIS marker line (see `mutator.fixed` `path#MARKER`).
   NOTE: a single marker protects only itself, not the YAML above it — frontmatter
   freeze relies on the MUST NOT DO rule ("do not edit frontmatter"), not on
   boundary enforcement. The marker anchors where tuning starts.

### Phase 2 — Audit the target skill

Read `SKILL.md`. Extract its **critical behaviors** — the things a correct
execution MUST do. List them as checkable facts, not vibes. For each behavior,
note what a small model is likely to drop (ambiguous verb, buried step, missing
example, long decision chain). See `References/mutator-techniques.md`.

### Phase 3 — Generate probes

For each critical behavior, write a probe under `probes/<name>/`:

- `input.md` — a task that forces the small model to exercise that behavior.
- `expected.md` — assertions the model's output must satisfy. Author them FUZZY:
  check concepts, not exact phrasing (see `References/verifier-patterns.md`).
  `+must contain` (case-insensitive), `-must not contain`, `~regex`.
- `probe.yaml` — copy from `Templates/probe/probe.yaml`; set `failure_mode`.

**Minimum suite: ≥ 4 probes** covering the four mandatory autoagent keys, here
mapped to small-LLM failure modes:

| failure_mode | what it targets in this skill |
|---|---|
| `misunderstanding` | ambiguous phrasing the small model misreads |
| `missing_capability` | a step/pattern the small model silently drops |
| `silent_failure` | model claims done, skipped a critical step |
| `missing_verification` | model didn't self-check its output |

`missing_verification` / `silent_failure` probes MUST have assertions that read
the output for the critical step actually being performed — not just claimed.

### Phase 4 — Scaffold adapter + program

Copy `Templates/adapter.yaml` → `./adapter.yaml`. Fill `name`. Confirm
`runner.cmd: "SUT_PATH=./SKILL.md bash {probe}/verify.sh"` and
`verifier.emits_cost: true`.

Copy `Templates/program.md` → `./program.md`. Fill the directive with the target
model and the skill's intent.

Copy `Templates/probe/verify.sh` → each probe dir (or reference one shared
copy from `runner.cmd`; simplest is one per probe). Make executable.

Add `.gitignore`: `snapshots/`, `.autoagent/`, `probes/*/.out`,
`probes/*/.events.jsonl`, `probes/*/.err` (pi writes these per probe run).

Commit the scaffold so the tree is clean before the loop — RunLoop's baseline
refuses on a dirty tree, and the first discard's `git reset --hard HEAD~1` needs a
real `HEAD~1`:

```bash
git add -A && git commit -q -m "baseline scaffold"
```

### Phase 5 — Smoke test

Run ONE probe by hand before the loop, exactly as the driver will:

```bash
mkdir -p .autoagent
SUT_PATH=./SKILL.md \
LLM_MODEL=anthropic/claude-haiku \
AUTOAGENT_PROBE_DIR=probes/<name> \
AUTOAGENT_SCORE_FILE=.autoagent/last_score \
AUTOAGENT_COST_FILE=.autoagent/last_cost \
bash probes/<name>/verify.sh
cat .autoagent/last_score   # a float in [0,1]
cat .autoagent/last_cost    # DOLLARS (pi-computed; or tokens if provider reports none)
```

This is a single-probe smoke: does the runner emit a score? If not, fix it
first (check `probes/<name>/.err`). The 0/4-or-4/4 baseline sanity check is
RunLoop Phase 0's job on the full suite; don't conflate the two here.

### Phase 6 — Run the loop

This skill does NOT drive the loop itself. Read and follow the autoagent skill's
`Workflows/RunLoop.md` from this workspace (`loop_mode: self_driven`). The loop
driver is the assistant (you). Export `LLM_*` in the shell you run from so every
probe's `verify.sh` inherits them.

The loop hill-climbs the SKILL.md body. Each kept mutation is a commit; discards
revert. Stop conditions are autoagent's (plateau, budget, interrupt).

### Phase 7 — Land the tuned skill (TRUST BOUNDARY)

When the loop stops, first strip the boundary marker the workspace copy still
carries (Phase 1 inserted it; it must not ship in the real skill):

```bash
grep -v '^# ===== FRONTMATTER_BOUNDARY ===== *$' ./SKILL.md > ./SKILL.md.clean
```

Then:

1. `diff` `./SKILL.md.clean` against the original copy (NOT the marker-laden
   `./SKILL.md`).
2. SHOW the diff to the user. Summarize what changed and the score delta
   (baseline `passed` → final `passed`).
3. Require EXPLICIT confirmation.
4. Only on confirmation, copy `./SKILL.md.clean` back to the original path.

NEVER auto-overwrite a real skill. The workspace copy is scratch until the human
approves.

## Routing

All phases live inline above. The loop phase delegates to autoagent:

| Request | Route |
|---|---|
| Setup workspace + audit + probes + scaffold | Phase 1–4 above |
| Run the hill-climb | autoagent `Workflows/RunLoop.md` |
| Land the result | Phase 7 above |

## Reference files

- `References/mutator-techniques.md` — the catalog of SKILL.md edits that help
  small models, and the beyond-ceiling stop rule.
- `References/verifier-patterns.md` — authoring fuzzy assertions for small-model
  output, optional LLM-judge, cost tracking.

## Constraints

### MUST DO
- Run in the isolated workspace, never in the user's real repo.
- Preserve YAML frontmatter; tune only the body below the boundary marker.
  (Boundary enforcement protects only the marker line — frontmatter freeze is a
  discipline rule, not enforced; obey MUST NOT DO.)
- Diff + explicit confirmation before copying a tuned skill back.
- ≥ 4 probes covering the four mandatory failure modes before running the loop.
- Smoke-test the runner before the loop.

### MUST NOT DO
- Modify the autoagent skill (it is shared; this skill only delegates to it).
- Reimplement the loop engine — follow autoagent's `RunLoop.md`.
- Overwrite the original `SKILL.md` without showing a diff and getting consent.
- Let the loop edit `adapter.yaml`, `program.md`, `probes/**`, or frontmatter.

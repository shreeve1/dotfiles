---
name: v2-pane-orch
description: "Long-lived, watched multi-model delegation via herdr panes — runs worker + reviewer sessions inside live herdr tabs that the orchestrator and human can watch and steer in real time. Companion to spawn.sh (V1 headless). USE WHEN the user wants to delegate a task that benefits from visibility into the worker's reasoning as it runs, or wants to steer mid-flight from phone via herdr remote, or when nicobailon subagent's headless fan-out is the wrong shape because the human should see the work happen. NOT for quick headless fan-out (use the subagent tool), unattended batch runs (use spawn.sh), or tasks that fit in one pi session."
---

# v2-pane-orch — live-pane orchestration for Pi

Spawns a worker pane + a reviewer pane inside a single herdr tab, drives them
through the V1 worker/reviewer protocol (IMPL_DONE / VERDICT sentinel), and
tears down on LGTM. The orchestrator and the human can both watch the panes
live; from a phone, attach via `herdr remote` to steer mid-flight.

The script that does the work lives at `{skill-root}/scripts/v2-pane-orch.sh`
(installed to `~/.claude/skills/v2-pane-orch/scripts/` and
`~/.pi/agent/skills/v2-pane-orch/scripts/` via install.sh's whole-dir sync).
This skill documents the protocol so other skills can compose with it.

## When to reach for this

| Use v2-pane-orch when…                                  | Use something else when…                          |
|---------------------------------------------------------|---------------------------------------------------|
| Task is non-trivial enough to want a watched run        | Task is a single shell command or quick edit      |
| The human wants visibility into the worker's reasoning  | Headless fan-out is fine; nobody's watching       |
| Steering mid-flight is plausible (worker asks, blocker) | Worker is fully scripted; no interaction needed   |
| Reviewer on a different family matters (LGTM/BLOCKING)  | No reviewer needed; pure implementation           |
| Phone-watch via herdr remote is wanted                  | Cost-sensitive batch run (spawn.sh is cheaper)    |

If unsure, default to nicobailon's `subagent` tool — it's faster and cheaper.
v2-pane-orch is for when you specifically want the human in the loop on a live
screen.

## Prerequisites

- `HERDR_ENV=1` (must be running inside a herdr session)
- `herdr` 0.7.4+ on PATH
- `pi` 0.80.6+ on PATH
- `jq` on PATH
- The script is installed by `install.sh` at
  `~/.claude/skills/v2-pane-orch/scripts/v2-pane-orch.sh` (Claude) and
  `~/.pi/agent/skills/v2-pane-orch/scripts/v2-pane-orch.sh` (Pi). It is also
  synced to other machines — no per-machine setup beyond `bash install.sh`.

## The protocol

The script runs a worker pane and a reviewer pane in a single tab. Each pane
hosts a real interactive `pi` session (not headless `-p`) so the human can
attach, scroll, and steer mid-turn.

### Inputs (the orchestrator writes these)

Both must exist on disk before invocation. File-based prompts dodge the TUI
multi-line paste problem and survive shell quoting.

**`<workdir>/worker-task.md`** — self-contained task for the worker. The worker
starts blank with no conversation context. The prompt must include:
- All task context the worker needs (acceptance criteria, file paths, expected
  output format, edge cases to handle).
- A `When done, end with the line IMPL_DONE on its own line.` instruction.
- An `IMPL_STUCK: <reason>` alternative if the worker hits a hard blocker.

**`<workdir>/reviewer-task.md`** — self-contained review checklist. The
reviewer is read-only and runs on a different model family. The prompt must
include:
- A numbered acceptance checklist the reviewer can mechanically verify.
- An explicit `End with EXACTLY ONE of these on its own line: VERDICT: LGTM /
  VERDICT: BLOCKING` instruction.
- A pointer to `<workdir>` so the reviewer can read what the worker produced.

### Env knobs (all optional; defaults shown)

| Var                      | Default                          | Notes                                          |
|--------------------------|----------------------------------|------------------------------------------------|
| `PI_V2_WORKER_MODEL`     | `minimax/MiniMax-M3`             | worker model selector                          |
| `PI_V2_REVIEWER_MODEL`   | `deepseek/deepseek-v4-flash`     | reviewer model selector (opposite family)      |
| `PI_V2_THINKING`         | `low`                            | thinking level for both panes                  |
| `PI_V2_WAIT_MS`          | `900000` (15 min)                | per-pane cycle budget before fail              |
| `PI_V2_MAX_CYCLES`       | `3`                              | max worker→reviewer→worker iterations          |
| `PI_V2_KEEP`             | unset                            | if set, skip teardown (debug)                  |

### Invocation

Resolve `{skill-root}/scripts/v2-pane-orch.sh` against the active skill
directory, then invoke:

```
bash {skill-root}/scripts/v2-pane-orch.sh \
  <workdir> \
  <workdir>/worker-task.md \
  <workdir>/reviewer-task.md
```

Concrete copy-pasteable paths (Claude Code):
```
bash ~/.claude/skills/v2-pane-orch/scripts/v2-pane-orch.sh \
  /tmp/v2-demo \
  /tmp/v2-demo/worker-task.md \
  /tmp/v2-demo/reviewer-task.md
```

Concrete copy-pasteable paths (Pi):
```
bash ~/.pi/agent/skills/v2-pane-orch/scripts/v2-pane-orch.sh \
  /tmp/v2-demo \
  /tmp/v2-demo/worker-task.md \
  /tmp/v2-demo/reviewer-task.md
```

Must run inside a herdr session. The script creates a tab + 2 panes, drives
the loop, and tears down on LGTM (or after `PI_V2_MAX_CYCLES`).

### Outputs

Stdout after the script returns (one field per line):

```
VERDICT: LGTM                # or BLOCKING, or NONE if no verdict was ever seen
CYCLES: 2                    # how many worker→reviewer cycles ran
LOG: <workdir>/.pi-orch-logs/<ts>-v2-pane.log
WORKER_PANE: w1:p1A          # pane ids (only if PI_V2_KEEP was set)
REVIEWER_PANE: w1:p1B
TAB: w1:tP
```

Other artifacts written to `<workdir>`:
- `.pi-orch-logs/<ts>-v2-pane.log` — full event log with timestamps.
- `.pi-orch-logs/N-reviewer-recent.txt` — captured reviewer output per cycle
  (last 600 lines; grep for `VERDICT:` to extract).
- `.pi-orch-logs/N-fix-prompt.md` — auto-drafted fix prompt on BLOCKING cycles
  (also copied over `worker-task.md` for the next iteration).
- `.pi-v2-sessions/` — child pi session files (NOT in `~/.pi/agent/sessions/`,
  by design — keeps synced dotfiles clean).

### Sentinel contract

| Sentinel            | Emitted by   | Meaning                                       |
|---------------------|--------------|-----------------------------------------------|
| `IMPL_DONE`         | worker pane  | Worker has finished the task as specified     |
| `IMPL_STUCK: <why>` | worker pane  | Worker hit a blocker; orchestrator should re-prompt or escalate |
| `VERDICT: LGTM`     | reviewer     | All checks pass; orchestrator should accept   |
| `VERDICT: BLOCKING` | reviewer     | One or more checks failed; orchestrator should loop with a fix prompt |

A reviewer pane that returns no `VERDICT:` line (asks for clarification, gets
confused, times out) is treated as BLOCKING by the script — it loops. This is
deliberate: a confused reviewer is the same as a failing reviewer for the
purpose of the orchestrator's decision.

## How other skills compose with v2-pane-orch

The protocol is the interface. Any skill can:

1. **Write** the two task files in a workdir.
2. **Invoke** the script via `bash {skill-root}/scripts/v2-pane-orch.sh ...`
   (substituting the harness-appropriate absolute path).
3. **Read** `<workdir>/.pi-orch-logs/<ts>-v2-pane.log` and the
   `N-reviewer-recent.txt` files for the full transcript.
4. **Parse** the script's stdout (4-line summary) for the verdict.

Skills that want a *single watched pane* (no reviewer loop) should not use this
script — it forces the full worker+reviewer dance. A future `v2-pane-only.sh`
would be the right primitive; until then, fork the script and trim.

Skills that want the *full worker+reviewer loop* but with a headless, no-pane
execution should use `spawn.sh` (V1) instead. V1 and V2 share the sentinel
protocol, so the same task files work with either.

## Boundaries vs nicobailon `subagent`

nicobailon's `subagent` tool (the in-conversation delegation runtime,
`.pi/agent/extensions/pi-subagents`) is the right choice for *headless* fan-out
where nobody watches the work happen — quick read-only scouts, single-shot
research tasks, parallel issue sweeps. It returns its output in the calling
agent's context.

v2-pane-orch is the right choice when visibility matters. The two compose
cleanly: an orchestrator can `subagent` a scout, then `v2-pane-orch` the
implementation, then read the verdict. They do not replace each other.

**Hard rule:** if the user is watching, v2-pane-orch. If nobody's watching,
`subagent` (or `spawn.sh` for unattended loops).

## Known sharp edges (verified during the v2-demo run)

These are documented for the orchestrator and any future skill that depends on
v2-pane-orch:

- **First-cycle reviewer may ask for clarification instead of emitting
  VERDICT.** Treat missing verdict as BLOCKING and loop; the script does this
  automatically. Don't read "no verdict" as "reviewer disagrees with my task."
- **First-cycle worker may over-implement relative to spec.** The reviewer
  should catch this on the next cycle; if not, sharpen the worker prompt.
- **Worker wall-clock varies wildly by model.** Minimax M3 on a non-trivial
  task can take 3-8 min per cycle. Default `PI_V2_WAIT_MS=900000` (15 min) is
  generous; raise it for longer tasks.
- **Each run opens a new tab + 2 panes.** Plan for one tab per concurrent V2
  run; do not run two `v2-pane-orch.sh` instances in parallel from the same
  orchestrator without unique workdirs (they don't coordinate on pane IDs).

## Verification (when modifying the script)

The script has no automated tests. Reproduce manually from a fresh shell:

```
mkdir -p /tmp/v2-smoke && cd /tmp/v2-smoke
# write minimal worker-task.md (IMPL_DONE) and reviewer-task.md (VERDICT: LGTM)
bash ~/.claude/skills/v2-pane-orch/scripts/v2-pane-orch.sh \
  /tmp/v2-smoke \
  /tmp/v2-smoke/worker-task.md \
  /tmp/v2-smoke/reviewer-task.md
# expect: VERDICT: LGTM on stdout, no orphan panes in `herdr pane list`
```

Reuse the prompts from `plans/pi-orch/v2-demo.md` for a fuller end-to-end
exercise.

## Provenance

- V1 headless orchestrator: `plans/pi-orch/spawn.sh`, `plans/pi-orch/README.md`.
- V2 milestone plan and run log: `plans/pi-orch/step2-migration-plan.md`,
  `plans/pi-orch/v2-demo.md`.
- Inspiration: `github.com/phntm7/skills/tree/main/skills/herdr-omp-orchestration`
  (herdr + omp workflow; V2 adapts the herdr CLI recipes, not the omp layer).
- Tool isolation model: `.pi/agent/settings.json` `subagents.agentOverrides`
  (worker/reviewer tool allowlists + denial of delegation tools).

## Layout

```
.claude/skills/v2-pane-orch/
├── SKILL.md                 # this file
└── scripts/
    └── v2-pane-orch.sh      # the orchestration primitive

.pi/agent/skills/v2-pane-orch/   # mirrored for Pi
├── SKILL.md
└── scripts/
    └── v2-pane-orch.sh
```

Both copies are kept byte-identical. `install.sh` syncs the whole
`.claude/skills/` and `.pi/agent/` directories to the user's home, so a fresh
machine only needs `bash install.sh` to get the script and the skill.
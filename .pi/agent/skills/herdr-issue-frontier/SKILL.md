---
name: herdr-issue-frontier
description: "Parallel, watched implementation of one GitHub parent issue's unblocked child issues via herdr panes — each issue gets its own worker pane + an independent fresh-session reviewer pane (herdr-orchestration), auto-merges and closes on LGTM, then /finish-spec's the parent. Invoke by name; not auto-triggered."
disable-model-invocation: true
---

# herdr-issue-frontier — watched parallel issue loop

Drive `/implement` over a GitHub parent issue's child issues **in parallel**, each
worker visible in its own herdr tab and each independently reviewed in a separate
fresh session, then closed on LGTM. When the frontier is exhausted, run
`/finish-spec` against the parent. This is the watched, parallel, GitHub-native
cousin of the serial `/ralph` loop.

`$ARGUMENTS` is the **parent issue number** (e.g. `42`). Optional second token:
the agent-ready label (default `ready-for-agent`). Everything else is derived.

> **`/implement` is invoked for real.** `herdr-orchestration.sh` loads the
> `implement` skill into the worker pane via an explicit `--skill <path>` allowlist
> (discovery stays off, so ONLY `implement` loads — not all 50 repo skills). The
> worker-task template tells the worker to run `/implement` for its issue, with one
> override: skip `/implement`'s built-in `/code-review` step — the independent
> reviewer pane fulfills that gate (see step 6).

## Leading words

- **wave** — one synchronous bash call that launches every currently-eligible
  issue's worker+reviewer pair in parallel and waits for the whole batch. The
  loop is a sequence of waves; a new wave starts only after the previous wave's
  merges/closes land.
- **frontier** — the set of the parent's open child issues whose blockers are all
  closed. Each wave drains the frontier; closing an issue may grow the next
  wave's frontier.
- **deadlock** — open children remain but none are eligible. Stop; do not
  `finish-spec`.

## Prerequisites (preflight — stop if any fails)

Completion criterion: every gate green, or stop and report the first failure.

- `HERDR_ENV=1` (running inside a herdr session). Check `[[ "$HERDR_ENV" == 1 ]]`.
- `gh`, `git`, `jq`, `herdr`, `pi` on PATH.
- Current dir is the base repo; `git rev-parse --abbrev-ref HEAD` is a real
  branch (not detached) — this is the **base branch** you merge into. Record its
  name.
- **Base branch clean AND baseline committed (worktree help).** Worktrees branch
  off committed `HEAD`, so any uncommitted work (contracts, ADRs, generated code
  the issues build against) is INVISIBLE to workers — they'd build against stale
  state. `git status --porcelain`:
  - clean → proceed.
  - dirty → **STOP**. Surface the dirty files and explain the stale-baseline risk.
    Propose a baseline checkpoint commit of exactly those files
    (`chore(frontier): baseline before wave 1`) and **require explicit
    authorization** before committing. Never auto-commit the user's uncommitted
    work; never stash-and-drop it. The user may commit it themselves and re-invoke.
- `$repo=$(gh repo view --json nameWithOwner -q .nameWithOwner)` for the REST
  calls below. Parent fetched: `gh issue view $P --json number,title,body,comments`.
- **No leftover frontier state.** Detect an interrupted prior run:
  `git worktree list --porcelain` paths under `$STATE_DIR`-style dirs, and
  `git branch --list 'herdr/issue-*'`. If any exist, report them and stop (do not
  auto-delete — they may hold unmerged work). The user resolves or re-runs.

## Identify the parent's children (scoped, never repo-wide)

Completion criterion: a list of issue numbers that are children of `$P` only.

1. Native sub-issues (REST): `gh api --paginate "repos/$repo/issues/$P/sub_issues" --jq '.[].number'`.
   If the endpoint 404s (sub-issues disabled on the repo), fall back to step 2.
2. Body convention from `/to-tickets`: open issues whose body contains a
   `## Parent` heading or a `Part of #$P` line.
3. **Never** sweep unrelated repo issues. Only `$P`'s children are in scope.

## The wave loop

Repeat until **zero open children** or **deadlock**. Each iteration is one wave.

### 1. Re-fetch child state

`gh issue view` each child (json: `number,state,labels,assignees,body`). Re-fetch
every wave — state changes between waves.

### 2. Compute the frontier (eligibility)

A child is **eligible** iff ALL hold:

- `state == OPEN`
- carries the agent-ready label (`ready-for-agent` unless overridden) AND does
  NOT carry `ready-for-human`
- not assigned to someone else (`assignees` empty or `@me` only)
- every blocker is closed:
  - native: `gh api "repos/$repo/issues/$N" --jq '.issue_dependencies_summary.blocked_by // 0'`
    returns `0` (GitHub reports only *open* blockers here, so 0 == unblocked), else
  - body fallback: every issue number in a `Blocked by:` / `## Blocked by` line is
    closed (`gh issue view <n> --json state -q .state` is `CLOSED`).

Exclude issues already **excluded this run** (a prior wave's conflict / failure /
timeout — see step 7) and issues currently in-flight.

**`ready-for-human` hand-off.** Children labeled `ready-for-human` need a human
(physical endpoint, proof run, sign-off). They are NEVER attempted by the loop.
Collect them and report them as hand-offs (the empty-frontier gate, step 3, and
the Bookend both surface them). A `ready-for-agent` issue blocked by an open
`ready-for-human` issue deadlocks the loop — step 3 reports it and names the
human action that unblocks it.

### 3. Empty-frontier gate (classify BEFORE declaring deadlock)

If the frontier is empty but open children remain, classify every remaining
child into ONE of these buckets before deciding to stop. The old dichotomy
(`ready-for-human` hand-off vs `ready-for-agent` blocked) is incomplete:
several real failure modes look like an "empty frontier with open children"
but are NOT dependency deadlocks, and reporting them as such misleads the
human into hunting for a blocking graph that doesn't exist.

For each open child not in the excluded-this-run set:

| Bucket | Diagnosis | What to report |
|---|---|---|
| **`ready-for-human`** | Human-only child (physical endpoint, sign-off) | List as a hand-off |
| **Unlabeled** | Open, no `ready-for-agent` AND no `ready-for-human` label | "Needs triage: apply `ready-for-agent` or `ready-for-human`" |
| **Assigned to someone else** | `assignees` is non-empty and not `@me` | "Claimed by @<user> — wait or reassign" |
| **Excluded this run** | Already in the excluded set (prior wave's BLOCKING/STUCK/conflict/timeout) | "Already failed this run — see prior waves' result files" |
| **Blocked on an open issue** | Open blocker(s) remain (native dep or body `Blocked by:`) | The blocking graph; for each blocker, name its label (`ready-for-agent` → next wave clears it; `ready-for-human` → human action) |

Terminal rules:

- **All remaining open children are `ready-for-human`** → **hand-off
  terminal**, not a failure. Go straight to the Bookend (report the hand-off
  list; `/finish-spec` is skipped because those children are still open).
- **Otherwise (at least one `ready-for-agent` child is blocked by an open
  issue, and no other bucket dominates)** → **deadlock. Stop.** Report the
  blocking graph and the human action for each open blocker. Do **not** run
  `/finish-spec` — the feature is not fully landed.
- **Otherwise (unlabeled, assigned-elsewhere, or excluded-this-run children
  dominate, with no ready-for-agent blocker chain)** → **soft-stop, not
  deadlock.** Report each non-blocker bucket with the per-child table above
  (e.g. "3 unlabeled — apply a label to proceed; 2 claimed by @alice —
  wait"). The loop can resume after a label is applied or an assignee is
  cleared; nothing in the blocking graph explains the stall.

### 4. Cap the wave (throttle)

`HERDR_FRONTIER_MAX` (default `3`) is a **hard cap per wave** — provision at
most that many issues this wave. Any remaining eligible issues stay eligible and
are picked up by the next wave (the loop re-scans after each wave). Each issue is
one herdr tab = **2 live pi sessions** (worker + reviewer), so the cap bounds RAM
and model rate. Want more in a wave? Raise the env var — do not ask-and-burst
past it; the excess simply lands next wave.

### 5. Provision one worktree per issue (isolation is mandatory)

Parallel workers must not share a working tree. For the first
`HERDR_FRONTIER_MAX` eligible issues `N` (the rest defer to the next wave):

```bash
base=$(git rev-parse HEAD)
ts=$(date +%s)
branch="herdr/issue-$N-$ts"
wt="$STATE_DIR/wt-$N"
git worktree add -b "$branch" "$wt" "$base"
```

- Capture `base` as **REVIEW_BASE** for that issue's reviewer diff.
- Claim it: `gh issue edit $N --add-assignee @me`.
- Fetch the full issue body into the worktree:
  `gh issue view $N --comments > "$wt/.herdr-issue.md"`.
- Write `$wt/.herdr-worker-task.md` and `$wt/.herdr-reviewer-task.md` from the
  templates below (substitute `$N`, title, `REVIEW_BASE`).
- Append a manifest line: `printf '%s\t%s\t%s\t%s\n' "$N" "$wt" "$wt/.herdr-worker-task.md" "$wt/.herdr-reviewer-task.md" >> "$STATE_DIR/wave.manifest"`.

`STATE_DIR` is a fresh `mktemp -d -t herdr-frontier-XXXX`; report its path to the
user (all logs/worktrees live there).

### 6. Run the wave (one synchronous bash call)

Export the worker skill allowlist so `herdr-orchestration.sh` loads `/implement`
into every worker pane (the reviewer pane gets none):

```bash
export HERDR_ORCH_WORKER_SKILLS="${HERDR_FRONTIER_WORKER_SKILLS-$HOME/.claude/skills/implement}"  # '-' not ':-' so blank truly disables
# Real implementation (edits + slow test suites) blows past the primitive's 15-min
# per-cycle default and gets killed mid-work. Default to 30 min for frontier waves.
export HERDR_ORCH_WAIT_MS="${HERDR_ORCH_WAIT_MS:-1800000}"
# Model tiers come from an editable file (the source of truth): a project-local
# .herdr-frontier-models if present, else the skill's synced models.conf. The
# file sets HERDR_FRONTIER_*_MODELS; the primitive then probes each (first that's
# usable wins, so a quota/auth failure falls back). Edit the FILE, not these lines.
if [[ -f .herdr-frontier-models ]]; then source .herdr-frontier-models
elif [[ -f "$SKILL_DIR/models.conf" ]]; then source "$SKILL_DIR/models.conf"; fi
export HERDR_ORCH_WORKER_MODELS="${HERDR_FRONTIER_WORKER_MODELS-minimax/MiniMax-M3,deepseek/deepseek-v4-flash}"
export HERDR_ORCH_REVIEWER_MODELS="${HERDR_FRONTIER_REVIEWER_MODELS-deepseek/deepseek-v4-flash,minimax/MiniMax-M3}"
bash "$SKILL_DIR/scripts/wave.sh" "$STATE_DIR/wave.manifest" "$STATE_DIR"
```

`wave.sh` backgrounds `herdr-orchestration.sh` per manifest line, waits for **all** of
them within that single shell, and writes `$STATE_DIR/<N>.result` per issue.
Because every job is launched and reaped inside one bash invocation, none are
orphaned by the fresh-shell-per-call model. Then truncate the manifest.

### 7. Process results serially on the base branch

For each issue `N` (read `$STATE_DIR/<N>.result`, grep `VERDICT:`):

Parse the verdict line. Key off **VERDICT**, not the script's exit code
(BLOCKING is a normal exit 0 — it just means the worker/reviewer loop exhausted
its cycles without LGTM).

- **`VERDICT: LGTM`** — review passed.
  1. Copy logs out (best-effort): `cp -r "$wt/.pi-orch-logs" "$STATE_DIR/logs-$N" 2>/dev/null || true`.
     Then strip the known orchestration artifacts so they don't fail the gate:
     `git -C "$wt" clean -fdxq -- .pi-orch-logs .herdr-orch-sessions .herdr-issue.md .herdr-worker-task.md .herdr-reviewer-task.md`
     (pathspecs are exact; `-x` only touches those names. If the worker
     accidentally tracked one, `clean` leaves it and the next check fails — correct.)
  2. Require: ordinary `git -C "$wt" status --porcelain` is now empty AND the
     branch has ≥1 commit beyond `REVIEW_BASE`
     (`test "$(git -C "$wt" rev-list --count $REVIEW_BASE..HEAD)" -ge 1`). If not,
     treat as failure (below).
  3. Land the work (never force, no `reset --hard`):
     ```bash
     git merge --no-commit --no-ff "$branch"   # stage the merge; no commit yet
     ```
     - On conflict → `git merge --abort`, keep branch + worktree + logs, comment
       the conflict on the issue, **leave it open**, add `N` to the excluded set.
       Do not pick a side.
     - Run the merge-time full-suite gate (DEFAULT-ON) against the staged merge:
       `bash "$SKILL_DIR/scripts/full-gate.sh"` (same dir as `wave.sh`). It
       resolves the command from `HERDR_FRONTIER_TEST_CMD` → `./.herdr-frontier-gate`
       → auto-detect (`uv run pytest -q` / `npm test` / `go test ./...`); opt out
       with `HERDR_FRONTIER_NO_GATE=1`. Non-zero → `git merge --abort` (clean undo;
       the branch retains the commits so nothing is lost), comment the failing
       command + output, **leave it open**, add `N` to the excluded set. Default-ON
       because an issue's narrow ## Verification misses cross-cutting impacts — an
       opt-in gate lets a reviewed-but-broken merge ship.
     - Gate green (or opted out) → commit the merge: `git commit -m "merge(#$N): <subject>"`.
  4. After a committed merge → `gh issue close $N -c "Implemented + reviewed via herdr panes (LGTM). Merged into $BASE_BRANCH."`, then `git worktree remove "$wt"` and
     `git branch -d "$branch"`.
  - **Close happens only after the merge lands.** Never close on LGTM alone.

- **`VERDICT: BLOCKING` / `VERDICT: NONE` / timeout / dirty tree / no commit** —
  preserve the worktree + logs (copy `.pi-orch-logs/` to `$STATE_DIR/`), comment
  the reviewer's findings (and any fix-prompt drafts) on the issue, **leave it
  open**, add `N` to the excluded set. Do not retry `N` this run — surfacing the
  blocker for a human is the correct outcome.
- **`VERDICT: STUCK`** — the worker hit a hard blocker and emitted
  `IMPL_STUCK: <why>`; the primitive short-circuited to skip the reviewer
  cycle. Preserve the worktree + logs, comment the worker's own reason (the
  `STUCK_REASON:` line in the result file is the worker's verbatim
  explanation — surface it as the headline, not "reviewer said BLOCKING"),
  **leave it open**, add `N` to the excluded set. STUCK is the worker's
  own self-classification of the blocker; honor it instead of looping.

After every issue in the wave is processed, **go to step 1** (re-scan). Closing
issues may unblock dependents → a larger next frontier.

## Bookend: /finish-spec the parent

Completion criterion: parent spec verified and closed (or a gap ticket filed and
reported).

Only when **zero open `ready-for-agent` children** remain (a `ready-for-human`
child staying open does NOT block landing the rest — it only blocks
`finish-spec`):

1. Clean up any leftover successful worktrees/branches from `$STATE_DIR`.
2. Report the **hand-off list**: any `ready-for-human` children the loop did not
   touch, with the human action each needs.
3. If ALL children (including `ready-for-human`) are closed: from the base repo
   (base branch, now holding all merges), invoke `/finish-spec $P`. The
   orchestrator session **can** run skills (unlike the worker panes), so this is
   a real invocation. If a `ready-for-human` child is still open, `/finish-spec`
   will itself refuse (it won't verify a half-landed feature) — tell the user to
   run it in this session after they close the human-only child.
4. If `/finish-spec` finds a gap too large for a small fix, it files a new
   ticket — **report it**; do not silently recurse into another frontier run.
5. Do **not** push unless the user asks. Landing locally is the default.

## Worker-task template (write to `$wt/.herdr-worker-task.md`)

Substitute `$N`, title, verification pointer is in `.herdr-issue.md`.

```
You are implementing GitHub issue #$N: <title>. Work ONLY in this worktree (your cwd).
Do NOT run gh. Do NOT close or edit the GitHub issue — the orchestrator owns that.

Read `.herdr-issue.md` in your cwd: full issue body, acceptance criteria, and a
## Verification command.

The `/implement` skill is loaded for you — RUN IT (`/implement`) against the
ticket in `.herdr-issue.md`.

**HARD OVERRIDE on `/implement`'s last step.** `/implement` ends with "use
`/code-review` to review the work." DO NOT. You have no delegation tools and the
independent reviewer pane does the review out-of-band. If `/code-review` is
reported not found, that is EXPECTED — stop; do not retry or improvise a review.
(`/tdd` is also not loaded — apply TDD directly at the seams if you want test-first.)

**Also override `/implement`'s "independent verify" step.** If `/implement`
references an "independent verify" via subagents (e.g. `../_shared/verify-claims.md`),
SKIP IT. You have no subagent tools in this pane — attempting it will silently fail
or burn cycles. The reviewer pane is the verification gate; trust it.

Additional rule `/implement` does not encode:
- Run the issue's exact ## Verification command (the backtick-quoted one) — it MUST exit 0.

Before finishing, COMMIT and VERIFY. The reviewer diffs your commits — UNCOMMITTED
WORK IS INVISIBLE and will be rejected as "no implementation" (this is the #1 failure):
1. `git add <your source files by name>` then `git commit -m "feat(#$N): <subject>"`.
   NEVER `git add -A` / `git add .` — orchestration artifacts (`.pi-orch-logs/`,
   `.herdr-orch-sessions/`, `.herdr-*.md`) must not be committed.
2. VERIFY the commit landed: `git log --oneline -1` shows your `feat(#$N)` at HEAD, and
   the filtered status is empty:
   `git status --porcelain -- . ':(exclude).pi-orch-logs' ':(exclude).herdr-orch-sessions' ':(exclude).herdr-issue.md' ':(exclude).herdr-worker-task.md' ':(exclude).herdr-reviewer-task.md'`
3. Only then print exactly one final line: IMPL_DONE
If you produced NO changes, do NOT print IMPL_DONE — print: IMPL_STUCK: no changes produced
Otherwise for a hard blocker print: IMPL_STUCK: <one-line reason>
```

## Reviewer-task template (write to `$wt/.herdr-reviewer-task.md`)

Substitute `$N`, title, `REVIEW_BASE`.

```
You are a READ-ONLY reviewer for GitHub issue #$N: <title>. You lack write/edit — do not
modify files.

Read `.herdr-issue.md` in your cwd for acceptance criteria + ## Verification.
Review the implementation. The primitive auto-commits the worker's working tree
before each review (so the work is committed even if the worker forgot to `git
commit`). Diff committed work vs REVIEW_BASE, excluding orchestration artifacts:
`git diff $REVIEW_BASE -- . ':(exclude).pi-orch-logs' ':(exclude).herdr-orch-sessions' ':(exclude).herdr-issue.md' ':(exclude).herdr-worker-task.md' ':(exclude).herdr-reviewer-task.md'`
Then read every changed file. An empty diff means NO implementation — say so
("no implementation produced") so the next cycle re-engages the worker; it is
NOT a commit problem (the primitive handles commits).

Mechanically verify:
1. Every acceptance-criterion checkbox is objectively satisfied.
2. The issue's ## Verification command passes (exit 0).
3. Lint/typecheck pass for touched files.
4. No unrelated or scope-creep changes in the diff.
5. Implementation is committed (the primitive auto-commits before review, so this
   should always hold — flag only if something looks wrong). The worktree also holds
   orchestration artifacts (`.pi-orch-logs/`, `.herdr-orch-sessions/`, `.herdr-*.md`)
   that are NOT issue work — exclude them:
   `git status --porcelain -- . ':(exclude).pi-orch-logs' ':(exclude).herdr-orch-sessions' ':(exclude).herdr-issue.md' ':(exclude).herdr-worker-task.md' ':(exclude).herdr-reviewer-task.md`
   should show only orchestration artifacts.

Output reasoning per criterion, then end with EXACTLY ONE of these on its own line:
VERDICT: LGTM
VERDICT: BLOCKING
```

## Gates (the invariants — every one must hold at the terminal turn)

- **Isolation**: one git worktree + branch per concurrent issue. Never two
  workers in the same tree.
- **Fresh reviewer per issue**: the reviewer pane is a separate pi session on a
  different model family from the worker — it never shares the worker's context.
- **Merge before close**: an issue is closed only after its branch merges
  cleanly into the base branch. LGTM alone is not enough.
- **No silent recursion**: if `/finish-spec` files a new ticket, stop and report.
- **No push** unless the user asks.
- **Skill allowlist, not open discovery**: worker panes load ONLY the `implement`
  skill (explicit `--skill`; discovery stays off). They cannot run `/code-review`
  or `/tdd` (not loaded, delegation denied) — the reviewer pane is the review
  gate. If a worker needs a capability the bare tool set
  (`read,write,edit,bash,grep,find,ls`) cannot provide, that is a real blocker —
  `IMPL_STUCK`, not a reason to widen the tool set.

## Env knobs

| Var | Default | Notes |
|-----|---------|-------|
| `HERDR_FRONTIER_MAX` | `3` | hard cap: max issues provisioned per wave; excess defers to the next wave |
| `HERDR_FRONTIER_LABEL` | `ready-for-agent` | agent-ready label; `ready-for-human` issues are handed off, never worked |
| `HERDR_FRONTIER_WORKER_SKILLS` | `~/.claude/skills/implement` | skill path(s) loaded into each worker pane (exported to `HERDR_ORCH_WORKER_SKILLS`); set blank to disable |
| `HERDR_FRONTIER_TEST_CMD` | unset | explicit merge-gate command (highest priority); overrides `./.herdr-frontier-gate` + auto-detect. **Per-project, prefer committing `./.herdr-frontier-gate`** (first line = command, e.g. `uv run pytest -q` or a fast scoped subset) so each repo declares its own gate. If neither is set, `full-gate.sh` auto-detects the full suite (`uv run pytest -q` / `npm test` / `go test ./...`) — correct but can be slow on big suites. Fail → abort merge, leave issue open. |
| `HERDR_FRONTIER_NO_GATE` | unset | `1` disables the merge gate entirely (you accept regression risk for speed) |
| `HERDR_ORCH_SCRIPT` | `<skills_dir>/herdr-orchestration/scripts/herdr-orchestration.sh` (harness-relative) | override (`V2_SCRIPT` still works) |
| `HERDR_FRONTIER_WORKER_MODELS` | `minimax/MiniMax-M3,deepseek/deepseek-v4-flash` | **edit in `models.conf`** (or project `.herdr-frontier-models`); ordered, first that probes usable wins |
| `HERDR_FRONTIER_REVIEWER_MODELS` | `deepseek/deepseek-v4-flash,minimax/MiniMax-M3` | same — edit in `models.conf` |
| `HERDR_ORCH_MODEL_PROBE` | `1` | probe each model before use; `0` = take the first, skip probing |
| `HERDR_ORCH_WAIT_MS` | `1800000` (30 min; frontier default — primitive default is `900000`) | per-cycle budget; raise for slow suites |
| `HERDR_ORCH_MAX_CYCLES` | `3` | worker→reviewer iterations per issue |

## Sharp edges

- **Merge conflicts on landing.** Tracer-bullet slices are designed to be
  independent (the `/to-issues` guarantee), so most land clean. When two slices
  touch the same lines, the second merge conflicts → abort, leave open, report.
  This is the named ceiling; the upgrade path is re-slicing or manual rebase.
- **One tab per issue.** N concurrent issues = N herdr tabs = 2N pi sessions.
  Watch RAM/model rate limits; `HERDR_FRONTIER_MAX` is the throttle.
- **`gh` native dependencies may be off.** When `issueDependenciesSummary` is
  unavailable, the body `Blocked by:` fallback keeps the frontier correct.
- **Long issues exceed the per-pane budget.** Raise `HERDR_ORCH_WAIT_MS` before
  raising `HERDR_ORCH_MAX_CYCLES` — a stuck worker re-looping burns cycles fast.

## Verification (when modifying this skill)

```bash
bash -n "$SKILL_DIR/scripts/wave.sh"                      # syntax
diff "$CLAUDE_SKILL/SKILL.md" "$PI_SKILL/SKILL.md"        # byte-identical mirror
diff "$CLAUDE_SKILL/scripts/wave.sh" "$PI_SKILL/scripts/wave.sh"
```

Smoke the launcher without burning real model calls: hand it a manifest pointing
two worktrees at trivial `IMPL_DONE` / `VERDICT: LGTM` task files (see
`herdr-orchestration`'s own smoke recipe) and confirm two `VERDICT: LGTM` lines appear
in `$STATE_DIR/<N>.result`.

# Workflow: RunLoop

Self-driven iteration loop. The assistant runs this directly — no external meta-agent. Use when `adapter.yaml` has `loop_mode: self_driven`.

If `loop_mode: external_meta_agent`, hand off to the user's coding-agent context with the autoagent kickoff prompt and STOP — do not run the loop yourself.

---

## Preconditions

- **The driver is `cd`'d into the run's workspace** (`.autoagent-runs/<run-name>/`), NOT repo root. All bookkeeping paths below (`results.tsv`, `probes/`, `snapshots/`, `.autoagent/`) are workspace-relative. See SKILL.md “Workspace Convention.”
- **Only ONE loop driver runs against a given git repo at a time.** Runs sharing a repo must be driven sequentially: the discard path's `git reset --hard HEAD~1` assumes the only new commit is THIS run's mutation. A second concurrent driver's mutation commit would be dropped by the other's rollback. The per-workspace `loop.lock` does NOT catch this (each run has its own lock). Finish or pause one run to a clean tree before starting another. For genuine parallelism, give each run a `git worktree`.
- `program.md` and `adapter.yaml` exist in the run workspace (`.autoagent-runs/<run-name>/`).
- `probes/` (or wherever `adapter.yaml` points) has **≥ 4 probes** covering the four mandatory failure-mode keys (`misunderstanding`, `missing_capability`, `missing_verification`, `silent_failure` — see `References/FailureModes.md`). Driver verifies by reading each probe's `probe.yaml` `failure_mode` field and checking that all four mandatory keys appear at least once. If any are missing, REFUSE to start the baseline and surface the gap.
- `git status` is clean.
- `.gitignore` excludes loop driver state. With the per-run workspace convention, `.autoagent-runs/` at repo root covers `snapshots/`, `.autoagent/`, `results.tsv`, and `run.log` for every run. Also ignore any adapter-specific runtime files (e.g. `worker.log`, `worker.pid` for the temporal adapter). If any of these are tracked, the discard path's `git reset --hard` will delete the snapshot file mid-restore. Driver MUST verify these are ignored before starting.
- Required CLIs are on `PATH`:
  - `git`, `bash`, `mikefarah/yq` v4+. Verify variant explicitly: `yq --version 2>&1 | grep -qE 'mikefarah|version v4'` (Python `yq` reports `jq-`-style versions).
  - For temporal adapter: `temporal` and `jq`. Driver also verifies `TEMPORAL_TASK_QUEUE` and (if used by capture/restore) `TEMPORAL_ADDRESS` are exported.
- `snapshots/` and `.autoagent/` directories exist (`mkdir -p snapshots .autoagent`).
- `runner.cmd` has been smoke-tested (one probe, one score in `$AUTOAGENT_SCORE_FILE`).
- If `sut.live: true`, `snapshot.capture_cmd` and `snapshot.restore_cmd` have been smoke-tested with a round-trip.
- **If `sut.live: true` AND environment looks like prod**, abort unless `AUTOAGENT_PROD=1` is set in the calling shell. The skill MUST refuse to start otherwise. See `References/LiveSystemSafety.md`.

---

## Substitution contract

The loop driver — that's the assistant running this workflow — performs these substitutions/env-var wirings before invoking `runner.cmd`:

| Token / env var | Source | Notes |
|---|---|---|
| `{probe}` in `runner.cmd` | each probe directory path | verbatim string replace, no escaping. Always substituted. |
| `$AUTOAGENT_PROBE_DIR` | the probe directory path | always exported, same value `{probe}` was replaced with |
| `$AUTOAGENT_SCORE_FILE` | `verifier.score_file` from `adapter.yaml` | exported ONLY when `verifier.score_file_scope: repo`. Not set for `container` scope — the runner owns score plumbing. |
| `$AUTOAGENT_COST_FILE` | `.autoagent/last_cost` | exported when `verifier.emits_cost: true`. Verifier writes a single decimal number; driver reads it and fills the `cost` TSV column. If absent or unset, `cost=0`. |

Example: with `runner.cmd: "bash {probe}/verify.sh"` and probe at `probes/foo`, the driver invokes:

```bash
AUTOAGENT_SCORE_FILE=".autoagent/last_score" \
AUTOAGENT_PROBE_DIR="probes/foo" \
bash -c "bash probes/foo/verify.sh"
```

For `score_file_scope: container` adapters (the autoagent/Harbor case), `AUTOAGENT_SCORE_FILE` is NOT set — the runner owns the score plumbing end-to-end and exposes the score through its own report.

---

## Re-entrancy lock

The first action of this workflow is to acquire `.autoagent/loop.lock`. Two concurrent driver sessions racing on `git` and a live SUT is corruption-grade.

```bash
LOCK=.autoagent/loop.lock
mkdir -p .autoagent
if [ -e "$LOCK" ]; then
  pid=$(cat "$LOCK" 2>/dev/null || echo "")
  if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
    echo "FATAL: another loop driver is active (pid $pid). Aborting." >&2
    exit 1
  fi
  echo "Stale lock found (pid $pid not running). Removing." >&2
  rm -f "$LOCK"
fi
echo $$ > "$LOCK"
trap 'rm -f "$LOCK"' EXIT
```

The assistant releases the lock on workflow exit (success, error, interrupt). On crash without cleanup, the next driver invocation detects a stale lock by checking the PID.

---

## Phase 0 — Baseline

1. Acquire lock (above).
2. Confirm clean tree (`git status --porcelain` is empty).
3. Initialize `.autoagent/last_score` parent dir and ensure `results.tsv` has a header.
4. For each probe (per `adapter.yaml` `probe.list_glob`):
   - Wire env vars, perform `{probe}` substitution.
   - `bash -c "$resolved_runner_cmd"` with `runner.timeout_seconds`.
   - Read `$AUTOAGENT_SCORE_FILE` (or runner-provided score for `container` scope).
5. Compute `passed = count(score >= verifier.pass_threshold)` and `score_avg`.
6. Append a row to `results.tsv` with `status=baseline`.
7. **Sanity-check the suite:**
   - 0% passed → probes likely impossible or verifiers broken. Fix before iterating.
   - 100% passed → no headroom. Add harder probes.
   - Target: 20–60% pass → room to hill-climb.

---

## Phase 1 — Iterate

Repeat until a stop condition fires.

### Per-iteration steps

1. **Diagnose.** Read `results.tsv` and per-probe outputs. Group failures by *root cause*, not by probe name. Reference `References/FailureModes.md`.
2. **Choose ONE mutation.** Apply the overfitting test. Prefer changes that fix a *class* of failures.
3. **Snapshot (live SUTs only).** If `sut.live: true`:
   ```bash
   mutation_id="$(date +%s)-$(git rev-parse --short HEAD)"
   yq -r '.snapshot.capture_cmd' adapter.yaml > .autoagent/_capture.sh
   bash .autoagent/_capture.sh > "snapshots/$mutation_id.snap"
   ```
   Verify the snapshot file is non-empty and parseable. **If capture fails or produces empty output, ABORT this iteration — do not mutate.**
4. **Mutate.** Edit files in `mutator.edit_surface` (never `mutator.fixed`). Run `mutator.apply_cmd` if set. Fail the iteration if `apply_cmd` exits non-zero.
5. **Commit mutation.** `git add -A && git commit -m "autoagent: $description"`. The commit must contain ONLY the mutation. `results.tsv`, `snapshots/`, and `.autoagent/` are gitignored and never enter this commit. This is the ONLY commit created in the mutate phase — the ledger is NOT yet committed.
6. **Run probes.** Same as baseline phase 0 step 4.
7. **Decide.**
   - `passed` improved → `status=keep`.
   - `passed` unchanged AND mutation simplified the SUT → `status=keep`.
   - Otherwise → `status=discard`.
8. **Branch on decision.**

   **8a. KEEP path:**
   - Append a row to `results.tsv` with the chosen status.
   - Commit the ledger row: `git add results.tsv && git commit -m "autoagent: log <mutation_id>"`. This is a separate commit so any future rollback never drops the ledger.

   **8b. DISCARD path (executed in this order; do NOT reorder):**
   - **8b.i Stash the snapshot.** If `sut.live: true`: copy `snapshots/$mutation_id.snap` to `.autoagent/_pending_restore.snap`. The snapshot directory is gitignored, but copying to a worktree-external location is a belt-and-braces guard.
   - **8b.ii Restore live state.** If `sut.live: true`: pipe `.autoagent/_pending_restore.snap` into `snapshot.restore_cmd`. Validate by re-running one previously-passing probe. **If validation fails, STOP and surface to the human — do not proceed to the code rollback.**
   - **8b.iii Roll back code.** Run `mutator.rollback_cmd` (default `git reset --hard HEAD~1` — drops the mutation commit only, since the ledger has not been committed yet).
   - **8b.iv Log the discard.** Append a row to `results.tsv` with `status=discard` (or `status=rollback` if live-restore was performed). Commit: `git add results.tsv && git commit -m "autoagent: log <mutation_id> discard"`.
   - **8b.v Cleanup.** `rm -f .autoagent/_pending_restore.snap`.
9. **Learn.** Note in the description column which probes newly passed, regressed, or stayed flat. This shapes the next mutation.

### Snapshot command resolution (W2 fix)

Do not use `bash -c "$(yq ...)"` — that's a shell-injection footgun and `yq` output formats vary. Instead:

```bash
yq -r '.snapshot.capture_cmd' adapter.yaml > .autoagent/_capture.sh
bash .autoagent/_capture.sh > "snapshots/$mutation_id.snap"
```

Same pattern for `restore_cmd`. Driver must use mikefarah/yq v4+ (`go-yq`); Python yq quotes its output incompatibly.

---

## Probe timeout handling

When `runner.cmd` for a single probe exits non-zero or exceeds `runner.timeout_seconds`:

- Record `score=0` for that probe in the `probe_scores` JSON.
- Mark that probe's contribution to `status` as `crash`.
- Do NOT abort the suite. Continue running remaining probes.
- If ALL probes in the suite time out or crash, set the iteration's overall `status=crash` and STOP — this signals the SUT is broken, not a single probe.

## Plateau detection

`loop.plateau_iterations` (default 5) triggers when **no `keep` row has been written for that many consecutive iterations**. Discards don't reset the counter; a single `keep` does. This is the operational definition — counting "passed unchanged" would never reset across a long discard streak.

---

## Mutator boundary enforcement

Before the commit in step 5, the driver verifies the staged diff respects `mutator.fixed`:

- Entries are either **globs** (matched against changed paths via `git diff --name-only --cached`) OR **`path#MARKER`** forms.
- Glob entries: any staged path matching the glob → REJECT the mutation, restore the worktree, abort the iteration.
- `path#MARKER` entries: the driver inspects `git diff --cached -- <path>` and refuses if any hunk overlaps a line containing `# ===== MARKER =====` or any line between two such markers.
- Always-fixed: `adapter.yaml` itself, regardless of whether the adapter listed it.

---

## Stop conditions

Stop when any of:
- User interrupts.
- Budget exhausted (sum of `cost` column ≥ user-configured budget).
- No `keep` row has been written for `loop.plateau_iterations` consecutive iterations (default 5).
- A mutation crashed the SUT and rollback failed — STOP and surface immediately.

### NEVER STOP vs human checkpoint

`program.md` says NEVER STOP. For `sut.live: true`, that yields to one rule: every `loop.human_checkpoint_every` iterations (default 10), the loop prompts the human and waits for confirmation. NEVER STOP applies *between* checkpoints, not across them. For `sut.live: false`, NEVER STOP is absolute (no checkpoint prompts).

---

## Safety rails for live systems

- Run in a non-prod namespace/environment unless the human explicitly authorized prod (`AUTOAGENT_PROD=1`).
- ALWAYS snapshot before mutating. Snapshot failures → ABORT, don't mutate.
- Every `loop.human_checkpoint_every` iterations, prompt the human: "N iterations elapsed, `passed`=X/Y. Continue?"
- Never exceed `runner.concurrency` (max 4 recommended for live systems).
- See `References/LiveSystemSafety.md` for the full rule set.

---

## results.tsv format

Append one row per probe run. Columns (tab-separated):

```
timestamp  commit  mutation_id  score_avg  passed  probe_scores  cost  status  description
```

- `timestamp` — ISO 8601 UTC (`date -u +%FT%TZ`).
- `commit` — short git hash.
- `mutation_id` — `$(date +%s)-$(git rev-parse --short HEAD)`. Same value used for the snapshot filename.
- `score_avg` — float, 3 decimal places.
- `passed` — `N/M` form (e.g. `7/12`).
- `probe_scores` — **single-cell JSON object**, e.g. `{"probe-foo":1.0,"probe-bar":0.0}`. No tabs, no newlines inside the value. Driver MUST `jq -c` to ensure this.
- `cost` — float dollars, sum of LLM/API costs incurred this run. Set to `0` if not tracked. Verifiers that use LLM judges populate this from their own usage data.
- `status` — `baseline|keep|discard|crash|rollback`.
- `description` — short free text describing the mutation and observed effect.

---

## Output

The loop writes to `results.tsv`, `snapshots/`, and the SUT itself. Final report when the loop stops:

- baseline `passed` → current `passed`
- mutations kept vs discarded
- failure modes resolved vs still open
- cost spent
- stop reason

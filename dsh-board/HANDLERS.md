# dotfiles — the six stage handlers

Live file. Edit it and the next tick picks the change up; no restart needed.
The cron prompt (the shared preamble) is frozen in YAML and needs a restart —
so anything that changes often belongs HERE, and the outcome contract belongs
THERE. Where this file and the preamble disagree about what a handler DOES,
this file wins. Where they disagree about the outcome contract, the six write
verbs, or the untrusted-data rules, THE PREAMBLE WINS.

## What this repo is, and why the handlers are not the feature-repo ones

`dotfiles` is config, skills, docs and shell scripts synced to `$HOME` by
symlink. There is no application, no build, no service to boot. So:

- The gate is `./check.sh` — read-only by construction. It never writes and
  never touches `$HOME`. `install.sh` is a MUTATOR and is never run by any
  handler, at any stage, for any reason.
- "Tests pass" is not available as evidence here. `check.sh` exit 0 plus the
  spec's own `acceptance:` commands are.
- Most changes are a file appearing, changing, or being linked. Evidence is
  therefore usually `path-exists` plus a command exit code.

## Universal rules for every handler

- **The tick moves the card. The team never moves the card.** No team member
  needs the `kanban_*` tools. This is a CONVENTION, not an enforced tool
  scope: every session on this box can see `kanban_*`. Nothing withholds them.
- Every team: `agent_teams_create({ name, description, approval: "automatic" })`.
  `approval: "required"` stages a plan and waits for a human click — exactly
  the stall this design exists to prevent.
- Team names are `<card-id>-<stage>` (e.g. `k412-build`), so a stranded team
  is identifiable from disk alone — which is the only way it can be
  identified, since the API refuses another session's team.
- **Dispatch order is fixed:** create team → add members → create every task →
  confirm each task reached `claimed`/`in_progress` → only then write D. A
  task that will not claim within a few status checks is a BOUNCE, not a D.
- **Promote conditions are DISK EVIDENCE, never self-assessment.** A team that
  grades itself passes itself.
- **The worktree is the only handoff between stages.** Decompose creates it,
  Build/Verify/Review reuse it, Merge cleans it. Its path lives in the card's
  `laneBranches`. If a stage that needs one finds it missing: BOUNCE to
  Decompose. Never silently recreate — a missing worktree means the plan's
  assumptions are gone.

---

## Spec

**Does:** validates the spec at `card.specPath`. **Authors nothing.** Mechanical
read; **no team**.

The human writes specs, via `/dsh-spec` or by hand. That is the pipeline's
trust anchor: a human-authored `gate:` is the one claim no agent in this loop
can weaken.

Checks, all mechanical:
1. `specPath` is set and the file exists (`path-exists`).
2. It declares a non-empty `gate:` command.
3. It has at least one item.
4. Every item carries `survey:`, `acceptance:` and `scope:`.
5. Every `survey:` and `acceptance:` command resolves to a valid argv — no
   shell metacharacters, no chaining, non-interactive.

**PROMOTE** → Decompose, when all five pass.

**BOTH failure modes BLOCK. Spec never bounces.** A bounce exists to give the
next run a changed input, and nothing between two ticks edits a spec — only
the human does. A bounced spec would re-fail identically every lap. Spec is
also the first column: a bounce has nowhere backward to go, and the board
refuses it.

- No `specPath`, or it does not resolve → **Blocked**, reason
  `"no spec: create one with /dsh-spec or set specPath"`.
- Spec exists but is malformed → **Blocked**, reason naming the offending
  item number and exactly what is missing.

Both are terminal-pending-human, and that is the honest description: the fix
requires the human who authors specs. A human moving the card back to `Spec`
after fixing the file is the documented un-park path.

---

## Decompose

**Does:** creates the lane, then breaks the spec into an ordered task list on
the card. **Creates the worktree — the only stage that may.** Team optional;
for a small spec do it inline.

1. `spec-committed` for this card's `specPath`. The worktree branches off
   `main`'s HEAD, so anything not in HEAD is invisible to the lane — most of
   all the spec itself. Run `git status --porcelain -- <specPath>` (argv form,
   `--` before the path, no shell): **any non-empty output** means the spec is
   untracked or has uncommitted edits → **Blocked**,
   `"CONCRETE OBSTACLE: spec <specPath> not committed; the lane branches off
   HEAD and cannot see it. Commit the spec, then move the card back to Spec."`
   Unrelated dirtiness elsewhere in the checkout is NOT a reason to block: a
   new worktree off HEAD is clean regardless, and the tick never touches the
   main working tree — so it can neither corrupt nor discard a human's other
   uncommitted work.
2. Create branch `auto/<card-id>` and a worktree at
   `$HOME/.dsh-worktrees/dotfiles/<card-id>`.
3. Record the worktree path in the card's `laneBranches` via
   `kanban_update_card`. **If this write fails, delete the worktree you just
   created and bounce** — a lane no later stage can find is worse than none.
4. Write the task breakdown into a card comment: one line per task, each
   naming the file it touches and the spec item it satisfies.

**PROMOTE** → Build when the worktree exists on disk (`path-exists`), the
branch exists (`git-branch-exists`), `laneBranches` is set, and the breakdown
comment is written.

**BOUNCE** → Spec when the spec parses but cannot be decomposed: two items
contradict, or an item names a file outside this repo. Reason names the item
number and the contradiction.

---

## Build

**Does:** implements the tasks in the worktree. **Spawns a team.**

1. Resolve the worktree from `laneBranches`. Missing or not on disk →
   **BOUNCE to Decompose**, `"worktree <path> missing; recreate the lane"`.
2. Create team `<card-id>-build` with cwd set to the WORKTREE, never the main
   checkout. A team writing to the main checkout corrupts every other lane.
3. One task per breakdown line. Quote `lastBounceReason` — if this is a
   re-entry from Verify or Review — into the team description inside a
   delimited untrusted-data block. It is the primary input to this run.
4. Confirm every task reached `claimed`/`in_progress`.
5. Write **D (dispatched)**, team name `<card-id>-build`.

A LATER tick reconciles it:
- Team finished, all tasks `completed`, and the worktree has commits on
  `auto/<card-id>` → **PROMOTE** → Verify via `kanban_finalize_card`.
- Team finished with a failed task, or no commits on the branch → **BOUNCE**
  to Decompose with the failing task's output, naming file and error.
- Team neither live nor finished → STALL → **BOUNCE** with that reason.

**Never run `install.sh`.** Build changes files in the worktree; it does not
install them.

---

## Verify

**Does:** runs the gate and the spec's acceptance commands **in the worktree**.
Mechanical; **no team**. This is the stage that cannot be allowed to grade
itself, so it runs commands and reads exit codes — nothing else.

1. Resolve the worktree. Missing → **BOUNCE to Decompose**.
2. Run `./check.sh` in the worktree, argv form, with a timeout.
3. Run every `acceptance:` command from the spec, argv form, with a timeout.
4. Record every command and its exit code in the card comment. The exit codes
   ARE the evidence; a summary without them is not.

**PROMOTE** → Review when `check.sh` exits 0 AND every acceptance command
exits 0.

**BOUNCE** → Build on any non-zero exit. The reason must name the command, its
exit code, and the first meaningful line of its output. `"gate failed"` is
VOID.

**Blocked** only if a command cannot be run at all (missing interpreter,
needs a credential) — a concrete external obstacle, not a failure.

---

## Review

**Does:** reads the diff for defects the gate cannot catch. **Spawns a team.**
Reads only; never edits.

1. Resolve the worktree. Missing → **BOUNCE to Decompose**.
2. Create team `<card-id>-review`, cwd the worktree, one reviewer.
3. Task: review `git diff main...auto/<card-id>` against the spec. Report
   findings as `{severity, file, problem, requiredFix}`.
4. Confirm the task claimed. Write **D**.

Reconciling tick:
- **Findings are filtered before they count.** A finding is ACTIONABLE only if
  it names a file and a concrete required fix. Vague findings ("could be
  cleaner", "consider refactoring") are DISCARDED, not bounced on — they are
  how a review loop becomes infinite.
- No actionable finding at `high`/`blocker` → **PROMOTE** → Merge.
- Any actionable `high`/`blocker` → **BOUNCE** to Build, reason = those
  findings, quoted as untrusted data.
- Review-specific ceiling: **3 bounces on the Review→Build edge** (read
  `bouncesByEdge["Review->Build"]`), then **Blocked** —
  `"CONCRETE OBSTACLE: 3 review rounds without convergence; needs a human
  call on <finding>"`. Two agents disagreeing forever is a real failure mode
  and the counter is what catches it.

---

## Merge

**Does:** fast-forwards the lane into `main` itself, then cleans up. **The only
stage that writes to `main` and the only stage that deletes a lane.** No human
gate: a card that passed Verify AND Review is trusted to auto-merge, but ONLY
as a strict fast-forward — the board never creates a merge commit, never forces,
and never resolves a conflict.

A card arriving in Merge passed the gate and review. Merge lands it on `main`.

1. `git-merge-base-check`: is `main` an ancestor of `auto/<card-id>`
   (i.e. the lane is a clean fast-forward of `main`)?
2. **Already merged** (`auto/<card-id>` is an ancestor of `main`) → skip to
   cleanup (step 5). This covers a human who merged manually, or a prior tick
   that merged then stalled before cleanup.
3. **Not a fast-forward** (`main` is NOT an ancestor of the lane — `main` moved
   on since the lane branched) → **BOUNCE to Build**,
   `"CONCRETE OBSTACLE: main advanced; auto/<card-id> no longer fast-forwards.
   Rebase the lane on main and re-run Build→Verify→Review."` The board must
   NEVER `git merge` a divergent branch (that makes a merge commit and can
   conflict) — a non-ff lane is stale and re-earns its way through.
4. **Clean fast-forward** → `git-merge-ff`: run
   `git -C <repo> merge --ff-only auto/<card-id>` from `main` (argv form, no
   shell). `--ff-only` is mandatory: on any non-ff condition git exits non-zero
   and changes nothing — treat that exit as step 3's BOUNCE, never retry without
   `--ff-only`. After exit 0, run `./check.sh` on `main`; if it fails, the merge
   introduced a regression the isolated lane hid → this is a real defect, leave
   `main` as-is (the ff is already applied) and **Blocked** with the failing
   `check.sh` line, because a human must decide whether to revert.
5. **Merged (by the board or a human)** → clean up: remove the worktree with
   `git worktree remove`, delete the `auto/<card-id>` branch, clear
   `laneBranches` via `kanban_update_card`, then **PROMOTE** → Archive.

Cleanup happens ONLY after the merge is confirmed (step 2 or a successful step
4). A bounce from Merge back to Build needs the worktree alive, so a non-ff
bounce (step 3) must NOT clean up.

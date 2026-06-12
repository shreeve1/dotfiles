---
name: symphony-onboard-project
description: Umbrella skill that orchestrates the full new-project flow — scaffold → workflow-author → restart → binding-smoke — with a checkpoint between each step. Use when adding a brand-new repo to Symphony end-to-end. Does not bypass any sub-skill's safety gate; each step still requires its own approval. Trust each sub-skill's dry-run; no separate umbrella-level dry-run.
---

# Symphony Onboard Project

Today's new-project flow is a manual chain of four skills. This umbrella runs the chain in order, surfaces each step's verdict, and checkpoints with James between steps. It does **not** weaken any sub-skill's safety gate — each Plane write and each `systemctl restart` still requires its own approval.

## Prerequisites

- All four sub-skills available:
  - `symphony-project-scaffold`
  - `symphony-workflow-author`
  - `symphony-restart`
  - `symphony-binding-smoke`
- Symphony repo and Plane env reachable (the sub-skills handle env sourcing).
- Target repo exists locally as a git repo with a default branch.

## Safety rules

- This skill is a thin coordinator. It owns no mutations directly; every mutation goes through a sub-skill.
- Checkpoint between every step. On any sub-skill failure, stop and report — **never auto-rollback**.
- No umbrella-level dry-run mode. Each sub-skill already has its own preview / dry-run, and adding an umbrella-level one would mostly duplicate. (Decided 2026-06-08.)
- Skip steps already done. If the target repo is already in `bindings.yml`, skip scaffold and continue from workflow-author. If WORKFLOW.md is already non-stub, skip workflow-author and continue from restart.
- Never push any branch.

## Out of scope

- Editing `bindings.yml`, `project_scaffold.py`, or `symphony-host.service` directly. Sub-skills own those.
- Rolling back a half-finished onboarding. If something fails mid-flow, James decides whether to retry, roll back via `symphony-plane-recover archive`, or leave the partial state.

## Interactive workflow

### 1. Collect target inputs

Ask James (single block):

```
Target repo:        <path>  (must be a git repo)
Project name:       <Full Name>  (derived from repo basename; confirm)
Slug:               <slug>       (auto-derived, ≤12 chars)
Default agent:      pi | claude  (default pi)
Landing mode:       local        (default local)
```

Auto-derive what you can (mirror `symphony-project-scaffold`'s derivation rules). Show James one block, accept `edit <field>=<value>` lines until y.

### 2. Step 1 — scaffold

Invoke `symphony-project-scaffold` with the agreed inputs. The sub-skill handles its own dry-run, typed-slug gate, and live mutation.

Expected end state:
- New Plane project created (real UUIDs in `bindings.yml`, not placeholders).
- `bindings.yml` appended with the new binding.
- `WORKFLOW.md` stub written at the target repo's root.

Checkpoint with James:
```
Step 1 / 4 — scaffold: ok
  project   <name> (id=<uuid>)
  binding   <slug>
  workflow  stub at <path>

Continue to step 2 (workflow-author)? (y/n/skip)
```

`skip` continues without running step 2 — useful if James wants to author WORKFLOW.md by hand.

### 3. Step 2 — workflow-author

Invoke `symphony-workflow-author` against the target repo. The sub-skill handles the interview, render-test, and target-repo commit.

Expected end state:
- `WORKFLOW.md` at the target repo root is no longer the scaffold stub.
- Render-test passed.
- Commit on the target repo (no push).

Checkpoint:
```
Step 2 / 4 — workflow-author: ok
  workflow  <line count> lines, render-tested
  commit    <sha> on <branch>

Continue to step 3 (restart)? (y/n/skip)
```

### 4. Step 3 — restart

Invoke `symphony-restart`. The sub-skill runs its own pre-sanity, asks James for the `sudo systemctl restart` approval, and verifies the log lines.

Expected end state:
- Service restarted onto new code.
- Both the existing bindings and the new binding reconcile cleanly.
- Dispatcher loop alive.

Checkpoint:
```
Step 3 / 4 — restart: ok
  pid       <n> (uptime <s>)
  bindings  <N>: <list>  (new <slug> reconciled clean)

Continue to step 4 (smoke ticket)? (y/n/skip)
```

If reconcile fails for the new binding, surface the error and stop. Do not auto-rollback. James will choose between fixing the WORKFLOW.md, using `symphony-plane-recover archive` to undo the Plane side, or reverting the `bindings.yml` commit.

### 5. Step 4 — binding-smoke

Invoke `symphony-binding-smoke --binding <slug>`. The sub-skill confirms WORKFLOW.md isn't a stub, asks James for the Plane write approval, files the ticket, watches the Run, and reports the verdict.

Expected end state:
- One smoke ticket created.
- Dispatcher picked it up.
- Worktree appeared at the binding's configured location.
- `SYMPHONY_RESULT: done|review|blocked` reported.

Final report:
```
Step 4 / 4 — binding-smoke: <result>
  ticket    <identifier> (id=<id>)
  run       worktree=<path>  duration=<s>
  verdict   done | review | blocked
  summary   <SYMPHONY_SUMMARY line>
```

### 6. Final hand-off

Print a one-block summary across all four steps:

```
Onboarded <slug>:
  scaffold        ok    project=<uuid> binding=<slug>
  workflow        ok    <commit-sha>
  restart         ok    pid=<n>  bindings now: <N>
  smoke           <verdict>  ticket=<identifier>

Loose threads:
  - smoke ticket persists in Plane for audit (or archived if --archive-on-success was passed)
  - target repo unpushed (binding lands local)
  - wiki / docs updates not handled by this umbrella
```

If James passed `--skip-smoke` (or answered `skip` at step 4), report the binding as ready but unverified, and point at `symphony-binding-smoke` for later.

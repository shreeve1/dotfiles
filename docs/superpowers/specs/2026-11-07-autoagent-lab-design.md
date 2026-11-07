# autoagent Lab Workspace — Design

Date: 2026-11-07. Status: approved by James 2026-11-07.

## Intent

James is moving project-specific skills out of his global skill set. The first case is autoagent, a score-driven improvement loop (baseline, mutate, run probes, score, keep or discard, repeat) modelled on `https://github.com/thirdlayerinc/autoagent`. He wants one dedicated folder, `~/autoagent-lab`, built from `~/starter-agent`, where improvement experiments live and can be paused and continued without cluttering `~`. Related skills, starting with `https://github.com/muratcankoylan/Agent-Skills-for-Context-Engineering`, get installed there instead of globally.

How he will use it: open an agent in `~/autoagent-lab`, name a project somewhere else on disk ("pull in ~/foo and improve X"), and the agent copies it in and sets up an experiment (a "run") on the copy. The target can be any part of a project: a skill, an agent harness, a script, a whole repo. A run never edits the original; approved results go back to it on request.

The original keeps changing while runs go on, so drift between the lab and the live project is expected and must be handled, not avoided.

## Goals

- Start every run from inside the lab by referencing an outside project.
- Several runs active at once, including several on the same project, none affecting another.
- A new run always starts from the original as it is now, even while older runs continue on older versions.
- The lab can show what changed in the original since any run started, bring a run up to date, and apply a run's approved changes back to the current original without overwriting James's own changes.
- A run can be stopped at any point and continued in a later session from what the lab holds.
- `autoagent`, `autoagent-skill` and the context-engineering skills are visible only to sessions opened in the lab.

## Non-goals

- Claude Code support. Skills go only in `.agents/skills/` (pi and Codex read it); no `.claude/skills/`.
- Applying anything to the original without James's approval, or committing in the original. Applied changes land as uncommitted edits for him to review and commit there.
- Catching up with upstream autoagent beyond these changes; upstream has not changed since 2026-04-03.
- A git remote for the lab. Local git only unless James asks.
- Isolating live systems (n8n, Temporal, cron): copies don't separate shared deployed state, so two runs on the same live system still go one at a time (existing autoagent rule, kept).

## Anti-goals

- A run's `git reset --hard` touching anything outside its own copy: the lab's memory, tasks, other runs, the reference copy or the original.
- Refreshing the project silently changing a running experiment.
- Applying a run back over edits James made to the original since the run started.
- Runs landing in `~`, `~/.local/share` or inside the original project's repo again.

## Constraints

- RunLoop saves each mutation as a git commit, undoes a discard with `git reset --hard HEAD~1`, and refuses to start on a dirty tree. The repo it drives must hold only that run's copy.
- pi loads project `.agents/skills` for trusted folders; `/home/james` is trusted.
- Today both skills are global: `~/dotfiles/.agents/skills/{autoagent,autoagent-skill}`, reached through `~/.agents/skills` (a symlink to the dotfiles folder) and per-skill symlinks in `~/.codex/skills/` created by `install.sh`. No existing runs were found, so nothing to migrate.

## Approaches

Where a run's copy and its history live:

- **A, picked: each run's copy is its own git repo**, ignored by the lab's git. The loop commits and resets only there. Parallel runs are safe. Cost: mutation history lives only on this machine.
- **B: copies committed into the lab repo.** One history, but a discard reset can drop the lab's own memory or task changes; one run at a time.
- **C: one git worktree per run.** Parallel-safe, but adds branch management and puts every copy into the lab's history.

James picked A because it isolates the undo step and allows several runs at once.

Handling drift from the original:

- **Picked: a per-project reference copy (`upstream/`) with a checkpoint per refresh.** Every run records the checkpoint it started from, so the lab can tell exactly what the original changed since, replay a run onto newer code, and apply changes back with a real three-way comparison.
- **Compare the live original directly at apply time.** Fewer parts, but no record of what the original looked like when a run started, so updating runs and spotting overlaps become guesswork.

James picked the reference copy.

## Design

### Layout

```
~/autoagent-lab/
  AGENTS.md, memory/, tasks/, .githooks/   from starter-agent setup
  .agents/skills/
    autoagent/  autoagent-skill/            moved from dotfiles, updated
    <context-engineering skills>            all of them
  runs/
    <project>/
      README.md        original path, refresh log (checkpoint, date), run list with start checkpoints
      upstream/        reference copy: own git repo, one commit per refresh; ignored by the lab
      <run-name>/
        target/        the run's copy: git clone of upstream/ at a checkpoint; ignored by the lab
        program.md  adapter.yaml  probes/   tracked by the lab
        results.tsv                          tracked by the lab (score history)
        snapshots/  .autoagent/  run.log     ignored scratch
```

`<project>` and `<run-name>` are kebab-case. The lab's `.gitignore` ignores `runs/*/upstream/`, `runs/*/*/target/`, `runs/*/*/snapshots/`, `runs/*/*/.autoagent/`, `runs/*/*/run.log`.

`<project>` is the thing James named. A subfolder of a bigger repo (for example one skill inside `~/dotfiles`) is its own project; only that folder is copied.

### Refresh ("refresh <project>")

Copy exactly what is on disk in the original folder into `upstream/`, including changes not committed in the original, then commit it there as the next checkpoint. Use `rsync --delete` so removed files are removed too. Leave out heavy rebuildable folders (`node_modules`, `.venv`, build output), `.git`, and `.env` and other secret files. Log the checkpoint and date in the project README. Refresh writes only to `upstream/`, never to any `target/`. If nothing changed, no new checkpoint.

### Starting a run (intake)

1. James names the outside path and what to improve. The agent picks `<project>` and `<run-name>` and says both.
2. Refresh the project (first time: create `upstream/` with `git init` and the first checkpoint).
3. `git clone` `upstream/` into `<run-name>/target/`, then remove the clone's `origin` remote setting from use by pushing (`git remote set-url --push origin no-push`) so nothing can be pushed back. Record the start checkpoint in the README.
4. Continue with autoagent's CreateProgram, probes and baseline, with `sut.paths` and `mutator.edit_surface` relative to `target/`. Runner and verify commands run from the run folder, with paths into `target/` spelled out in `adapter.yaml`. Dependencies are installed inside `target/` when the run needs them.
5. Commit the run's tracked files in the lab.

Running experiments are unaffected by a new run's refresh: they keep working on the checkpoint they started from.

### Lab commits and continuing a run

`results.tsv` is written to disk every iteration, so a crash loses nothing. The lab commits a run's files only at baseline, pause, stop, refresh, or when James asks. Each commit stages only its own paths (`git add runs/<project>/<run>/` or the project README), never `-A`, so it cannot pick up another session's memory or task edits. RunLoop's per-iteration ledger commit is removed.

"Continue <run>" reads `program.md`, `adapter.yaml` and `results.tsv`, checks `target/` is clean and its HEAD equals the commit in the ledger's last `keep` or `baseline` row, says how many checkpoints the run is behind, then resumes RunLoop. A starter-agent saved task per active run is optional; the agent offers one at intake.

### What changed ("what changed in <project>")

Refresh, then for each run show the files the original changed since that run's start checkpoint (`git -C upstream diff <start>..HEAD --stat`) and which of them the run also changed. Read-only.

### Bringing a run up to date ("update <run>")

Only while the run is paused. Refresh, `git -C target fetch` the new checkpoint, rebase the run's kept commits onto it. Conflicts stop the update and are shown to James; nothing is forced. On success, record the new start checkpoint, re-run the baseline (old scores no longer describe the new code; the ledger marks the boundary with a `baseline` row and a note), then the run can continue.

### Applying approved changes back ("apply <run>")

1. Show the run's net change (`git -C target diff <start>..HEAD`) with its score history. James approves all of it or names the parts to apply.
2. Refresh, so `upstream/` matches the original now.
3. In a throwaway clone of the latest checkpoint, replay the approved changes (rebase or cherry-pick of the kept commits, or a filtered patch). A file both sides changed that does not merge cleanly is flagged; James resolves it, the lab never picks a side for him.
4. Copy only the files the approved change touches from that clone onto the original, as uncommitted edits. Before writing, check the original still matches the checkpoint taken in step 2; if it changed, stop and start again from step 2.
5. Log what was applied, when, in the project README. The run folder stays as a record until James asks to delete it.

The same path applies to any target: a skill, harness or other part of a project.

### Safety details (from GPT Sol quick review, 2026-11-07)

- Symlinks in the original that point outside its folder are refused at refresh, or copied as real files on request, so a copy can never write into the original through a link.
- One project lock around refresh and run creation; each new run checks out the exact checkpoint it records.
- One lock per original around `apply --write`; each file is re-checked just before it is written, and a change aborts the rest.
- `apply --write` refuses while any conflict is unresolved.
- A loop stopped between saving a change and scoring it is recovered on continue: the unscored change is undone and logged as `interrupted`.

### Skill changes

- **autoagent:** replace the "Workspace Convention" (`.autoagent-runs/` inside the system's own repo) with the lab layout and the operations above (refresh, intake, continue, what changed, update, apply). RunLoop runs its git commands with `git -C target`; its pre-flight checks `target/`. Remove the "sequential, one repo" and worktree escape-hatch text; keep the live-system rule. Adapters and templates change their path wording to match.
- **autoagent-skill:** drop `~/.local/share/autoagent-skill/<name>`; the skill being tuned is a project (its folder, so referenced files come along) pulled in by the same intake. Its final phase uses "apply" above instead of its own copy-back.
- Both skills state they assume the lab layout and point to it.

### Removing the global copies

After the lab is verified: delete `.agents/skills/autoagent` and `.agents/skills/autoagent-skill` from dotfiles in their own commit, remove the `.autoagent-runs/` line from the dotfiles `.gitignore`, remove the dangling `~/.codex/skills/{autoagent,autoagent-skill}` symlinks on each machine, and check `install.sh` and `tests/` for references. Other machines lose the skills on their next pull. Pushing dotfiles needs James's approval.

### Context-engineering skills

Install every skill under `skills/` of the upstream repo into `.agents/skills/`, recording the upstream commit in the lab `CHANGELOG.md` "Local changes". If a name collides with a lab skill, the lab's own skill wins and the collision is reported.

### Workspace setup

Run starter-agent "First setup" with "nothing to migrate" and the purpose stated above; accept its git hooks. Follow dotfiles' memory convention: no `.memory-recovery/` or `.task-recovery/` copies, git history is the undo (James, 2026-11-02). Drop starter-agent's `.pi/` unless setup needs it.

## Verification

- New pi session in `~/autoagent-lab`: autoagent, autoagent-skill and the context-engineering skills are listed. New pi session in `~/dotfiles`: none listed.
- Dry run on a small sample project: start run A, one kept and one discarded mutation; the discard changes only A's `target/`; lab `git status` shows only A's run files.
- Drift: edit the sample original, start run B. B starts from the new checkpoint; A's `target/` is unchanged. "What changed" lists the edit against A.
- Update A onto the new checkpoint; it re-baselines.
- Apply A back: approved change lands as uncommitted edits in the original; a file James edited on both sides is flagged, not overwritten.
- `bash tests/run-all.sh` passes in dotfiles after the removal.

## Calls made in design (James can override)

- Copy exactly what is on disk, fresh history per project (no clone of the original's history).
- Lab commits only at baseline, pause, stop and refresh, staging only the run's own paths.
- Runner commands run from the run folder; `.env` files never copied; copies cannot push.
- Dotfiles memory convention, not starter-agent's recovery copies.

## Left to the builder

- Exact exclusion list and README wording (use personal-memory's supporting templates).
- Which lab rules rows route intake, continue, update and apply to the autoagent skill.
- Which starter-agent skills to drop: keep memory, tasks, handoff and general skills; drop video, motion and design ones.

# Workflow: CreateProgram

Interview the user, then write `program.md` AND `adapter.yaml`. These two files are the only steering surface for the loop.

## Inputs (ask via AskUserQuestion if missing)

1. **System type** — agent harness, Temporal workflow, cron job, scraper, n8n flow, custom CLI, etc. Drives which reference adapter to start from.
2. **Directive** — one paragraph: what should the system *do well* when this loop finishes?
3. **Edit surface** — files/dirs the loop may mutate.
4. **Fixed paths** — files/dirs the loop must NOT mutate (adapter boundaries, deploy glue, secrets).
5. **Live or sandboxed?** If live, what's the snapshot mechanism? (Defaults below.)
6. **Loop mode** — `self_driven` (this skill runs the loop) or `external_meta_agent` (autoagent-style hand-off). Default `self_driven`.
7. **Runtime constraint** — model pin, version pin, anything that should not drift.
8. **Stop condition** — bounded N or NEVER STOP.

## Steps

1. Pick the closest reference adapter:
   - agent harness → `Adapters/autoagent.yaml`
   - Temporal workflow/schedule → `Adapters/temporal.yaml`
   - anything else → `Adapters/generic-cli.yaml`
2. Copy it to the target repo as `adapter.yaml`.
3. Fill in:
   - `name`, `sut.description`, `sut.paths`, `sut.live`
   - `mutator.edit_surface`, `mutator.fixed`, `apply_cmd`, `rollback_cmd`
   - `runner.cmd` (sanity check it manually with one probe — it must produce a score)
   - `snapshot.*` if `sut.live: true`
4. Read `Templates/program.md` and fill placeholders from the interview.
5. Write `program.md` to repo root.
6. Initialize `results.tsv` from `Templates/results.tsv.header` if missing.
7. Echo back: directive, edit surface, live? snapshot mechanism, loop mode.

## Quality checks before declaring done

- [ ] `adapter.yaml` parses as valid YAML (`yq . adapter.yaml` succeeds with `mikefarah/yq` v4+; verify via `yq --version 2>&1 | grep -qE 'mikefarah|version v4'`).
- [ ] `adapter.yaml` appears in `mutator.fixed`.
- [ ] `runner.cmd` was test-invoked on a smoke probe. For `score_file_scope: repo`, a score landed in `$AUTOAGENT_SCORE_FILE`. For `score_file_scope: container`, the runner returned a score through its own report.
- [ ] `verifier.score_file_scope` is set (`repo` or `container`).
- [ ] `verifier.emits_cost` is set (default `false`).
- [ ] `mutator.rollback_cmd` is set (default `git reset --hard HEAD~1` for git-tracked SUTs — this matches RunLoop's ledger-after-rollback ordering).
- [ ] `loop.plateau_iterations` and (for live SUTs) `loop.human_checkpoint_every` are set.
- [ ] `.gitignore` excludes `snapshots/`, `.autoagent/`, and any adapter-specific runtime files (e.g. `worker.log`, `worker.pid`).
- [ ] If `sut.live: true`: `snapshot.capture_cmd` and `snapshot.restore_cmd` round-trip cleanly (capture → restore → re-capture → diff is empty).
- [ ] `program.md` directive is one paragraph, not a feature list.
- [ ] Loop mode is set and matches the actual usage pattern.

## Output

Paths to `program.md` and `adapter.yaml`, plus a 4-bullet summary.

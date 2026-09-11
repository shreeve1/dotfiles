# Workflow: InitAdapter

Scaffold an `adapter.yaml` for a system type that doesn't match a reference adapter. Use when the SUT is unusual (e.g. a Kafka consumer, a Terraform plan, a SaaS webhook).

## Steps

1. Start from `Templates/adapter.yaml`.
2. Answer five questions about the SUT, in order:

   **Q1. How do I invoke ONE probe and get a number?**
   This is `runner.cmd`. If you can't write this in a single shell line, the SUT isn't ready for the loop — wrap it in a script first.

   **Q2. What is the smallest unit of mutation?**
   Code edit? Config file? CLI argument? API call? Whatever it is, it must be:
   - **reversible** — `mutator.rollback_cmd` (default `git reset --hard HEAD~1`) or `snapshot.restore_cmd` must put the world back.
   - **applied by `mutator.apply_cmd`** if more than a file edit is needed.

   **Q3. What must NEVER change?**
   The adapter boundary, deploy scripts, secrets, schema migrations, anything the loop should not touch. Put glob patterns in `mutator.fixed`. **Always include `adapter.yaml` itself.**

   **Q4. Where does the score come from?**
   `verifier.score_file` (a file the runner writes) or last-line-of-stdout. Set `pass_threshold`. Set `verifier.score_file_scope`:
   - `repo` — path is repo-relative (loop driver resolves it and exports as `$AUTOAGENT_SCORE_FILE`). Default for systems running natively in the repo or in a container with a repo bind-mount.
   - `container` — path is inside an isolated SUT container with no repo bind-mount (e.g. Harbor task containers, Docker runs that copy the SUT in at build time). Runner is responsible for extracting the score from the container's output and the driver does NOT export `AUTOAGENT_SCORE_FILE`.

   Example tiebreaker: if your runner invokes `docker run --rm -v "$PWD:/workspace" ...`, choose `repo`. If it invokes `docker run --rm` without bind-mounting the repo, choose `container`.

   If the verifier also reports cost (token usage, runtime $$), set `verifier.emits_cost: true` and write to `$AUTOAGENT_COST_FILE`.

   **Q5. Is this live?**
   If yes, what command captures the current state, and what command restores it from that capture? Both go in `snapshot.*`. Also set `loop.human_checkpoint_every` (default 10) — RunLoop will pause for confirmation on that cadence.

3. Fill in `adapter.yaml` answering Q1–Q5. Validate with `yq . adapter.yaml` (mikefarah/yq v4+).
4. **Smoke test:** create one trivial no-op probe under `probes/smoke/` and run `runner.cmd` against it with `AUTOAGENT_SCORE_FILE` set to the resolved `verifier.score_file` path. Confirm a number lands there.
5. If `sut.live: true`: smoke test `snapshot.capture_cmd` → save to a file → `snapshot.restore_cmd` reads it back. Diff the live state before and after — should be identical.
6. Confirm `mutator.fixed` includes `adapter.yaml` and any deploy/secret paths.

## Failure modes during adapter authoring

| Symptom | Likely cause |
|---|---|
| `runner.cmd` works manually but loop sees no score | `verifier.score_file` path mismatch, or score not written before runner exits |
| Mutations stick even after discard | `mutator.rollback_cmd` doesn't actually revert (e.g. deployed schedule still active) → add `snapshot.restore_cmd` |
| Probes pass at baseline but fail under loop | `apply_cmd` isn't idempotent → fix the script |
| Snapshot capture/restore mismatch | live system has fields that drift (timestamps, IDs) → strip them in `capture_cmd` |

## Output

`adapter.yaml` with all five sections answered, smoke probe confirming it works.

# Live-System Safety

Rules for running the loop against systems where mutations have real side effects: Temporal namespaces, cron tables, SaaS APIs, production-adjacent databases.

---

## Hard rules (non-negotiable)

These are enforced by `RunLoop`'s preconditions and per-iteration steps — they are not advisory.

1. **Never run against prod without explicit second confirmation.** The loop reads `sut.live` AND checks `AUTOAGENT_PROD=1`. Both must be set. RunLoop's preconditions block refuses to start the baseline otherwise. The env var is set deliberately in the calling shell and unset after the session.

2. **Snapshot before every mutation.** If `snapshot.capture_cmd` fails or produces empty output, RunLoop aborts the iteration and does not mutate. See `Workflows/Snapshot.md` capture-validation step.

3. **Rollback on every discard.** `git reset --hard` alone is insufficient for live systems. The snapshot is piped through `snapshot.restore_cmd`. Restoration is validated by re-running one previously-passing probe; validation failure → STOP and surface.

4. **Bounded blast radius.** `runner.concurrency` is capped on live systems (recommended ≤ 4). Probes that mutate live state run sequentially regardless of the concurrency value.

5. **Human checkpoint every N iterations.** `loop.human_checkpoint_every` in `adapter.yaml` (default 10). The loop pauses and asks the human to confirm before continuing. This is the ONE rule that overrides `program.md`'s NEVER STOP for live SUTs.

6. **Re-entrancy lock.** `RunLoop` acquires `.autoagent/loop.lock` before any mutation. Two concurrent driver sessions against the same live SUT is corruption-grade.

---

## Soft rules (override only with reason)

- Run the loop in a non-prod namespace / staging environment first.
- Tag every live mutation with metadata identifying it as loop-generated, for audit and easy bulk-revert (e.g. label `autoagent-run-id`).
- Keep a kill switch documented at the top of `program.md`: the exact command to stop the loop and roll back the last N mutations.
- Rate-limit `runner.cmd` against external APIs even if the API allows more.

---

## Pre-flight checklist (run before `RunLoop`)

- [ ] `sut.live` is set correctly.
- [ ] `snapshot.capture_cmd` produces non-empty, parseable output on the current state.
- [ ] `snapshot.restore_cmd` round-trips: capture → restore → re-capture → diff is empty.
- [ ] `runner.concurrency` is ≤ 4 (or justified higher with reason logged in `program.md`).
- [ ] The human has been told the kill-switch command.
- [ ] If targeting prod: `AUTOAGENT_PROD=1` is set AND the human has confirmed in this session.

---

## When to STOP the loop and ask the human

Always stop and surface, do not auto-recover, when:

- A rollback fails (snapshot restore exits non-zero, or post-restore probe regression).
- A mutation crashes the SUT badly enough that `runner.cmd` exits non-zero on every probe.
- Snapshot capture starts producing different output for the same nominal state (state drift).
- Cost spikes unexpectedly (e.g. one probe suddenly costs 10× baseline).

These are signals the SUT or environment has changed in a way the loop can't reason about.

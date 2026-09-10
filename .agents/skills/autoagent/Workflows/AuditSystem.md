# Workflow: AuditSystem

Review an existing system for stress-testability BEFORE wiring up the loop. Catches the problems that make iteration painful or unsafe.

## Steps

1. **Read the adapter.yaml** (if it exists) and the SUT source files.
2. **Score against `References/GoodSUT.md` patterns:**
   - [ ] Clear adapter / boundary between mutable surface and fixed infrastructure.
   - [ ] One command invokes one probe and emits one number.
   - [ ] Mutations are reversible (in git OR via snapshot).
   - [ ] Verifier reads outcomes, not SUT self-reports.
   - [ ] Probes complete in seconds-to-minutes.
   - [ ] No hidden global state across probes (each probe is independent).
3. **Check the mutation surface:**
   - Is `mutator.edit_surface` realistic? (Too narrow → no headroom. Too wide → loop can break itself.)
   - Is `mutator.fixed` complete? Especially: `adapter.yaml`, secrets, deploy scripts, schema migrations, the runner itself.
   - Is `mutator.rollback_cmd` set and tested?
4. **Check the verifier:**
   - Is it deterministic? If not, what's the variance? (LLM-judge runs need 3-5 samples averaged.)
   - Does it inspect side effects, not just stdout?
   - Can it tell `silent failure` apart from real success?
   - Is `verifier.score_file_scope` set correctly (`repo` vs `container`)?
5. **Check loop config:**
   - `loop.plateau_iterations` set (default 5).
   - For live SUTs, `loop.human_checkpoint_every` set (default 10).
6. **Live-system check** (if `sut.live: true`):
   - Snapshot capture is non-destructive and produces non-empty output.
   - Snapshot restore is idempotent and validated via re-running a known-passing probe.
   - There's a non-prod environment to run the loop against.
   - `AUTOAGENT_PROD=1` enforcement is documented for prod targets.
   - `.autoagent/loop.lock` re-entrancy is acknowledged.
   - There's a kill switch / rate limit on `runner.concurrency` (≤ 4 recommended cap when `sut.live: true`).
   - `.gitignore` excludes `snapshots/`, `.autoagent/`, and adapter-specific runtime files.
7. **Produce an audit report** with sections:
   - **Strengths** (what's working).
   - **Blockers** (must fix before loop can run safely).
   - **Recommended improvements** (would help but not blocking).
   - **Live-system risks** (if applicable).

## Common findings by system type

**Agent harness** — missing FIXED ADAPTER BOUNDARY, single-`run_shell` anti-pattern, verifier reads agent's final message (silent failure trap).

**Temporal workflow** — no test namespace, worker not auto-restartable, schedule changes not in version control, signal/query handlers untested.

**Cron job** — no fake-clock harness (can't simulate ticks), no idempotency guard (probe runs leave residue), script reads live config.

**Generic CLI** — non-deterministic output, no exit code discipline, secrets in source paths.

## Output

`docs/autoagent-audit.md` with findings + line citations.

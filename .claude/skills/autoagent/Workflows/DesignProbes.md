# Workflow: DesignProbes

Design experiments (probes) that stress-test the SUT across known failure modes.

## Principle

The loop hill-climbs on `passed`. Probes must:
- Discriminate good SUTs from bad ones.
- Hit at least one **named failure mode** (see `References/FailureModes.md`).
- Be **verifier-deterministic** when possible.
- Resist overfitting (see `References/OverfittingTest.md`).
- Run in seconds-to-minutes, not hours.

## Inputs

1. The directive from `program.md`.
2. The adapter.yaml (so probes know how they'll be invoked).
3. Target failure modes — pick 3–8 from `References/FailureModes.md`.
4. Difficulty distribution — recommended: 30% easy, 50% medium, 20% hard.

## Steps

1. **Pick failure modes.** Read `References/FailureModes.md`. For each mode, ask: "What's the simplest probe that would catch a SUT failing this way?"
2. **Draft one probe per failure mode.** For each:
   - Name (kebab-case, descriptive).
   - Failure mode it targets.
   - Inputs / scenario.
   - What the verifier checks.
   - The discriminating signal (what a *bad* SUT gets wrong).
3. **Apply the overfitting test** (`References/OverfittingTest.md`). Discard any probe that only catches one specific bug.
4. **Scaffold each probe**:
   ```
   probes/<name>/
     probe.yaml
     input.md
     verify.sh
   ```
   Copy from `Templates/probe/`.
5. **Write the verifier FIRST.** Make it deterministic where possible. The verifier reads side effects / output, never the SUT's self-report.
6. **Write the input.** Plain natural language (or trigger payload for workflow SUTs). Do not leak the verifier logic.
7. **Smoke-test each probe** against the baseline SUT. Record the baseline score. If a probe scores 1.0 at baseline, it's too easy. If 0.0, check whether it's truly impossible or just mis-scoped.

## Coverage matrix

**Required:** at least one probe per mandatory failure-mode key (`misunderstanding`, `missing_capability`, `missing_verification`, `silent_failure` — see `References/FailureModes.md`). The skill's ISC criterion is "≥ 4 probes covering all four mandatory keys." `RunLoop` reads `probe.yaml` `failure_mode:` fields and refuses to start a baseline if any mandatory key is missing.

Use the **named keys** from `FailureModes.md` (not numbers) in `probe.yaml`. Aim for at least one probe per category below; **mandatory rows are bolded**:

| Failure mode (key) | Probe(s) |
|---|---|
| **`misunderstanding`** (required) | |
| **`missing_capability`** (required) | |
| `weak_info` | |
| `bad_execution` | |
| **`missing_verification`** (required) | |
| `environment` | |
| **`silent_failure`** (required) | |

Fill the right column in `probes/README.md`. RunLoop reads `probe.yaml` `failure_mode` fields directly to verify coverage; the README matrix is the human-facing mirror.

## Per-SUT-type guidance

**Agent harnesses:** instructions with implicit constraints; tasks needing structured tool use; tasks with tempting near-misses for silent failure.

**Temporal workflows:** payloads that exercise retry/timeout policies; payloads with malformed inputs to test signal/query handlers; long-running scenarios to stress timers and continue-as-new.

**Schedules / cron:** simulated tick scenarios with overlap, missed ticks, daylight saving boundaries, end-of-month edge cases.

**Scrapers / ETL:** inputs with missing fields, encoding edge cases, rate-limit responses, partial-failure batches.

**CI / build pipelines:** PRs that should fail (regressions) and PRs that should pass (clean refactors); each is a probe.

## Quality checks per probe

- [ ] Verifier is deterministic OR uses an LLM-judge with an explicit rubric.
- [ ] Verifier reads the *actual outcome*, not the SUT's claim.
- [ ] Input does not leak verifier logic.
- [ ] `failure_mode` in `probe.yaml` matches what the probe actually catches.
- [ ] Baseline SUT scores < 1.0 (room to climb) and > 0.0 (or zero is expected and documented).
- [ ] Probe passes `References/OverfittingTest.md`.

## Output

`probes/<n>/` directories and a `probes/README.md` coverage matrix.

# Failure Modes — Universal Taxonomy

Seven modes. Every probe should target at least one. A diagnostic suite covers a spread, not just the easy ones.

The wording is system-agnostic; concrete examples follow each.

## Canonical keys

The driver, `probe.yaml`, and workflows ALL use the named keys below. Numbers are for human reading only; do not put numbers in `probe.yaml`.

| # | Key | Mandatory in minimum suite |
|---|---|---|
| 1 | `misunderstanding` | **yes** |
| 2 | `missing_capability` | **yes** |
| 3 | `weak_info` | no |
| 4 | `bad_execution` | no |
| 5 | `missing_verification` | **yes** |
| 6 | `environment` | no |
| 7 | `silent_failure` | **yes** |

Minimum diagnostic suite: ≥ 4 probes covering all four mandatory keys.

---

## 1. Misunderstanding Inputs

**Symptom:** SUT processes the input as though it meant something adjacent.

**Examples:**
- *Agent:* paraphrases instruction, drifts to a related task.
- *Temporal:* workflow interprets a malformed signal payload as the default case.
- *Cron:* misreads timezone in schedule expression.
- *Scraper:* treats a 200 with an error body as success.

**Stress design:** inputs with implicit constraints, ambiguous fields, edge encodings, near-miss values.

---

## 2. Missing Capability

**Symptom:** SUT knows what to do but cannot do it with available tools / actions.

**Examples:**
- *Agent:* lone `run_shell` forces hand-rolled boilerplate.
- *Temporal:* no compensating activity for a partial-write scenario.
- *Cron:* script lacks a locking mechanism for overlapping ticks.
- *CI:* pipeline has no way to retry a flaky network step.

**Stress design:** scenarios that *require* the missing capability. A correctly-equipped SUT wins cleanly.

---

## 3. Weak Information Gathering

**Symptom:** SUT acts before knowing the environment.

**Examples:**
- *Agent:* first tool call is a write, not a read.
- *Temporal:* workflow starts mutating before querying current state.
- *Scraper:* assumes schema without reading a sample.
- *Migration:* runs DDL without checking current schema version.

**Stress design:** environments with a non-obvious fact that must be discovered first; punish guessing.

---

## 4. Bad Execution Strategy

**Symptom:** Right plan, wrong order. Or no plan.

**Examples:**
- *Agent:* backtracks, redoes work, commits partial state.
- *Temporal:* activities scheduled in an order that violates dependencies.
- *Cron:* job A runs before job B which it depends on (race).
- *ETL:* writes before validating.

**Stress design:** multi-step scenarios with dependencies; verifier checks end state only.

---

## 5. Missing Verification

**Symptom:** SUT finishes without checking its own work.

**Examples:**
- *Agent:* no re-read of artifact before declaring done.
- *Temporal:* workflow completes without confirming downstream system received the message.
- *Scraper:* counts rows fetched, doesn't validate row contents.
- *Deploy:* declares success on `kubectl apply` rather than rollout-complete.

**Stress design:** scenarios where the obvious output looks right but is subtly wrong (off-by-one, wrong unit, wrong row, wrong tenant). Verifier catches the subtle case.

---

## 6. Environment / Dependency

**Symptom:** SUT fails for infrastructure reasons, not logic reasons.

**Examples:**
- *Agent:* missing package, wrong Python version, missing API key.
- *Temporal:* worker pod can't reach service discovery.
- *Cron:* PATH or LANG differs from interactive shell.
- *CI:* cache state from prior run leaks in.

**Stress design:** sparingly. Use to guard against regressions in `Dockerfile`, `pyproject.toml`, `apply_cmd`. Don't let these dominate the suite — they pollute the signal on logic mutations.

---

## 7. Silent Failure

**Symptom:** SUT claims success; side effects are wrong or missing.

**Examples:**
- *Agent:* "Done!" but artifact path wrong.
- *Temporal:* workflow completes successfully; the activity's idempotency key collided and the side effect never fired.
- *Cron:* script exits 0 even when `set -e` was off and a step failed.
- *Scraper:* writes empty rows on auth failure rather than erroring.

**Stress design:** verifier reads outcomes only. Pair with tempting near-misses.

**This is the single most important failure mode to design against.** Most "it said it worked" production incidents live here.

---

## Coverage rule

A minimum diagnostic suite covers the four mandatory keys: `misunderstanding`, `missing_capability`, `missing_verification`, `silent_failure`. The other three (`weak_info`, `bad_execution`, `environment`) strengthen coverage but are secondary.

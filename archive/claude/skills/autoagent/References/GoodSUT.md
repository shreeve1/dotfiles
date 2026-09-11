# Good SUT Patterns

What makes any system stress-testable. System-agnostic.

---

## 1. Clear Mutation Boundary

There is an explicit line between "the loop may change this" and "the loop must not." In code, a comment or a dedicated directory. In config, a `fixed:` glob list. Without it, the loop can break its own runner.

**Examples:**
- *agent.py:* `# ===== FIXED ADAPTER BOUNDARY =====` comment.
- *Temporal:* worker bootstrap is off-limits; workflow code is mutable.
- *Cron:* `/etc/cron.d/system-*` is off-limits; user crons are mutable.

---

## 2. Registry-Driven Surface

Mutable behavior is registered, not hardcoded into orchestration.

**Examples:**
- *Agent:* `TOOLS = {...}` dict, not a switch inside `run_task`.
- *Temporal:* activities registered to a worker, not inlined in workflow code.
- *Cron:* one file per job in `cron.d/`, not a monolithic `crontab`.

The loop can add/remove/edit entries without touching orchestration.

---

## 3. One-Command Probe Invocation

A single command runs ONE probe and produces ONE number. If you can't write this in one shell line, the SUT isn't ready.

**Examples:**
- *Agent:* `uv run harbor run -p tasks/ --task-name X -n 1`
- *Temporal:* `bash probes/X/verify.sh` which inside calls `temporal workflow start ... && check.sh`
- *Cron:* `./fake-tick.sh probes/X/scenario.env && ./check-side-effects.sh`

---

## 4. Structured Outputs Over Raw Streams

Where structure exists, expose it. Don't make the verifier (or, for agent SUTs, the model) parse free text.

**Examples:**
- *Agent tool:* `read_cell(sheet, cell) -> CellValue` not `run_shell` with awk pipelines.
- *Temporal activity:* returns typed result, not a JSON string of mixed shapes.
- *Scraper:* writes Parquet/JSONL, not stdout.

---

## 5. Actionable Errors

When something fails, the SUT produces a message describing *what* and *what to do*. This is what lets the loop diagnose and target mutations.

**Bad:** `Exception: invalid input`
**Good:** `Sheet 'Q3' not found. Available: ['Q1', 'Q2']`

---

## 6. Verification Layer

The SUT verifies its own work before declaring done. This is high-leverage because it directly attacks failure mode #7 (silent failure).

**Examples:**
- *Agent:* a verifier sub-agent via `agent.as_tool()`.
- *Temporal:* a `verifyResult` activity at the end of every workflow.
- *Cron:* a `_postcondition.sh` that runs after the main script.
- *Deploy:* a smoke test after `apply`.

---

## 7. Idempotent Probes

Running the same probe twice produces the same score (modulo declared variance). Probes do not leak state to each other or to subsequent runs.

For live systems this often requires per-probe namespacing: tenant IDs, table prefixes, scratch directories.

---

## 8. Reversible Mutations

Every mutation can be undone:
- in git for code,
- via `snapshot.restore_cmd` for live state,
- via `mutator.rollback_cmd` if mutations require an external apply step.

If a mutation type can't be reversed, it doesn't belong in `mutator.edit_surface`.

---

## 9. Configuration at the Top

All knobs the loop is likely to tune live in one obvious place — first 30 lines of a file, or one config block — so mutations target the right surface immediately.

---

## 10. Logging That Survives Restart

Per-probe outputs land in predictable paths. The loop reads them on the next iteration to diagnose. Don't break this contract.

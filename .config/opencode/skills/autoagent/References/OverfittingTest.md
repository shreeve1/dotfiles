# The Overfitting Test

One question to apply to every probe and every proposed mutation:

> **"If this exact probe disappeared, would this change still be worthwhile?"**

If no, it is overfitting.

---

## Applied to probes (experiment design)

A good probe tests a **class of behavior**. It should not be the only way to reveal a given failure mode, and the lesson learned from designing it should generalize.

**Bad probe (agent):** "Compute SHA-256 of 'hello world' and write to `/workspace/out.txt`." → tests rote execution; reveals nothing general.

**Good probe (agent):** "Inspect the workbook, find the column where values stop being numeric, write the column letter." → tests info gathering + structured tools + verification.

**Bad probe (Temporal):** "Workflow receives signal `{ user_id: 12345 }` and must produce result `42`." → magic numbers, no class of behavior.

**Good probe (Temporal):** "Workflow receives a malformed signal mid-execution; must route to compensation activity and complete cleanly." → tests a class of failure mode (mid-execution signal handling).

---

## Applied to mutations (loop changes)

The loop should ask the same question before keeping a change.

**Bad mutation:** "Add a regex: if instruction mentions 'spreadsheet', use `openpyxl`." → benchmark-shaped hack.

**Good mutation:** "Replace `run_shell` with `read_workbook`, `read_cell`, `write_cell` specialized tools." → lifts all spreadsheet-class probes and is justifiable on its own merits.

**Bad mutation (Temporal):** "If workflow input contains `signal_type=foo_bar`, route to specific handler." → encodes probe specifics.

**Good mutation (Temporal):** "Add a typed signal envelope with validation; route by signal type." → fixes a class of input-handling failures.

---

## Red flags (across all SUT types)

- Probe names referencing specific tricks (`trick_the_X_with_Y`).
- Verifier code with `if "specific phrase" in output`.
- Configuration of the form "always do X when Y is in the input."
- Code with hard-coded paths or IDs from a specific probe.
- Conditional logic that branches on probe name / probe ID anywhere in the SUT.

Any of these means the SUT is memorizing the probe suite instead of generalizing.

---

## When in doubt

Reword the change as a paragraph in `program.md`'s "What You Can Modify" section. If it sounds like a general engineering improvement, it's fine. If it sounds like a benchmark gaming rule, it's overfitting.

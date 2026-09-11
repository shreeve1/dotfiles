# Verifier Patterns — scoring small-LLM execution of a skill

Each probe scores the small model's output with `expected.md` assertions. This
file covers authoring those assertions so they measure comprehension, not
phrasing luck.

## Assertion format (`expected.md`)

One assertion per line. `#` comments and blank lines skipped.

| Prefix | Meaning | Match |
|---|---|---|
| `+pat` | output MUST contain pat | case-insensitive substring (`grep -Fqi`) |
| `-pat` | output must NOT contain pat | case-insensitive substring, inverted |
| `~regex` | output MUST match regex | case-insensitive `grep -Eqi` |

Score = `passed / total` (float, 3 decimals). Zero assertions → score 0.0.

## Author FUZZY — concepts, not phrasing

Small models phrase things unpredictably. A brittle assertion fails on every
rewording and gives a false 0. Author for the concept:

Bad (exact):
```
+I will read the file first
```

Good (concept, alternation):
```
~read|inspect|examine|open|cat
~file|document|source|path
```

Rules of thumb:
- Prefer `~regex` with alternation over `+` exact for any behavioral check.
- Use 2–4 alternation terms per concept; cover synonyms the model might pick.
- Assert the OUTCOME / action, never the meta-announcement. Bad: `+I will now
  verify`. Good: `~check|verify|confirm` AND an assertion that the actual
  verified fact is present in the output.
- `+` substring is fine only for literal tokens the skill forces (a required
  key name, an exact command, a required output marker).

## Targeting each failure mode

### `silent_failure` (the most important)
The model claims done but skipped a critical step. Assertions must check the
STEP'S ARTIFACT is present in the output, not the claim of doing it.
Example — skill requires producing a `## Summary` section:
```
~## *summary   # the section heading actually exists
~summary
```
If the model only said "I'll write a summary" but produced none, this fails.

### `missing_verification`
Skill requires a self-check. Assert the check's evidence appears (a re-stated
fact, a comparison, an explicit pass/fail note), not just the word "verified".

### `misunderstanding`
Skill demands a specific action; small model drifts to an adjacent one. Use a
`-` assertion to forbid the common wrong path:
```
-summary    # must NOT jump to summarizing when asked to extract
~extract|pull|list
```

### `missing_capability`
Skill demands a step/pattern the model tends to drop. Assert the dropped step's
output is present.

## Optional: LLM-judge instead of assertions

When a behavior genuinely cannot be captured by string/regex (open-ended
quality, tone, holistic correctness), swap assertion scoring for an LLM judge:
call a STRONGER model with the skill + the probe input + the small model's
output + a rubric, have it return a score in [0,1]. Costs extra tokens per probe
run (slower loop, higher spend). Only adopt when ≥1 critical behavior is
un-checkable deterministically. Keep deterministic assertions for everything
checkable; add the judge as one weighted factor.

## Cost tracking

`verify.sh` writes pi-computed `usage.cost.total` (DOLLARS) to
`$AUTOAGENT_COST_FILE`, falling back to `totalTokens` when the provider reports
no dollar cost. The `cost` column in `results.tsv` matches whichever unit pi
emitted; set the loop budget in the same unit (DOLLARS by default). Because each
probe is an agentic `pi -p` turn (many model calls), cost adds up faster than a
bare completion — track it against the budget set in `program.md`.

## Smoke-test checklist for a probe

Before entering the suite, a probe must:
1. Emit a score in `[0,1]` (not crash) on a real run.
2. Have `total ≥ 2` assertions (a single-assertion probe is too binary).
3. Be passable by a correct execution (a human reading the skill + input could
   produce output satisfying every assertion).
4. Be failable by a plausible small-model mistake (else it carries no signal).

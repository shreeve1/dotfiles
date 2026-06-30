# Mutator Techniques — making SKILL.md small-LLM-friendly

The loop's mutator (the assistant choosing one edit per iteration) draws from
this catalog. Each technique names the small-model weakness it targets and a
concrete move. Apply ONE class of change per mutation so the keep/discard
signal stays clean.

## Why small models fail skill files

- **Lost-in-the-middle:** signal buried mid-document is ignored. Small models
  weight the start (primacy) and end (recency) far more than large models.
- **Ambiguous verbs:** "consider", "appropriate", "as needed", "if relevant"
  resolve to "do nothing" on weak models.
- **Long decision chains:** nested `if/else` branches in prose exceed the
  model's holding capacity; it picks one branch and forgets the rest.
- **No example:** a rule with zero examples is abstract; small models need a
  concrete demonstration to anchor the pattern.
- **Signal dilution:** every extra token of preamble lowers the probability the
  critical instruction is attended to.

## Catalog

### 1. Frontload the one critical instruction
Move the single most important directive to the first line below frontmatter.
Target weakness: lost-in-the-middle (primacy).
Move: cut preamble/intro paragraphs that precede the core rule.

### 2. Echo the critical constraint at the end
Repeat the must-do constraint in a final short line. Target: recency.
Move: add a one-line "MUST:" recap at the bottom.

### 3. Replace abstract verbs with concrete imperatives
`consider X` → `do X`. `where appropriate` → delete. `as needed` → state the
condition. Target: ambiguity collapse to no-op.

### 4. One example per non-obvious step
Add a concrete input→action example directly under any rule a small model
plausibly misreads. Target: abstraction gap.
Keep examples tiny — one line each; examples also cost tokens.

### 5. Collapse decision trees
If a section has `if A then ... else if B then ... else ...`, flatten to a
prioritized checklist (do 1; then 2; then 3). Target: branch-drop.
If a branch is rare, move it to a footnote-style "edge case" at the end.

### 6. Convert prose rules to numbered checklists
A paragraph of rules → `1. ... 2. ... 3. ...`. Target: holding capacity.
Small models follow enumerated steps better than embedded clauses.

### 7. Define jargon inline
First use of a term → append `(= plain-english gloss)` the same line.
Target: vocabulary ceiling.

### 8. Cut non-core sections
Sections the small model does not need for the critical path (deep background,
alternatives, rationale) → delete or move below a clear "reference" divider.
Target: signal dilution. Keep the file shorter.

### 9. Shorten sentences
One directive per line. Split compound sentences. Target: parse failure.

### 10. Make verification explicit
If the skill should self-check output, add a literal "before finishing, verify:
<check>" step. Target: silent_failure / missing_verification failure modes.

## Choosing the next mutation

1. Read `results.tsv`. Group failing probes by root cause (see autoagent
   `References/FailureModes.md`).
2. Pick the technique whose target weakness matches the dominant failure class.
3. Apply it as ONE edit. If a probe about "buried critical step" fails, technique
   1 or 2 applies. If "did the wrong sub-task" fails, technique 3 or 4.
4. Prefer edits that fix a CLASS of probes, not one probe (overfitting rule:
   "if this probe disappeared, is the edit still worth keeping?").

## Beyond-ceiling stop rule

Some skills exceed a given model's capability ceiling (multi-tool orchestration,
long-horizon planning, heavy symbolic reasoning). Signal:

- Baseline passes **0/4** probes AND no mutation in the first ~5 iterations
  cracks even 1/4.
- OR every "keep" is a trivial reformat that doesn't move comprehension.

When this holds: **stop and report.** Tell the user the skill likely exceeds the
target model's ceiling — recommend a stronger model, or splitting the skill into
smaller composable skills (each within the model's reach). Do not keep grinding a
plateau that is a capability wall, not a wording problem.

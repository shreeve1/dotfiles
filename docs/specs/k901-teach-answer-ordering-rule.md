# k901 — Harden the teach quiz answer-ordering rule so it cannot leak the answer

**Goal:** The `teach` skill's quiz-authoring reference states an unambiguous,
hard rule that the correct multiple-choice option is randomised into a
non-first slot on every quiz — never placed first, never fixed-position. A
committed guard script fails if that rule is ever weakened back to prose that
lets the correct answer sit first. This closes the observed defect where a real
teach run placed the correct answer first (leaking it), which made the quiz
measure pattern-matching instead of knowledge.

**Repo:** /home/james/dotfiles   **Branch:** auto/k901

```yaml
gate:
  cwd:  .
  argv: [bash, check.sh]
```

## Context established in this session (not to be re-derived)

- The defect and its diagnosis are settled: a fresh `teach` run chose
  `learn_card` correctly but authored a quiz with the correct option first,
  violating the intent of the rule at
  `.claude/skills/teach/references/quiz-ui.md`. Root cause: the rule was a weak
  double-negative ("do not put it first on purpose … shuffle **or** keep a
  fixed order") that gave the model an out.
- End-to-end LLM behaviour is nondeterministic, so this spec verifies the
  **instruction is correct and stays correct** (a deterministic source check).
  Confirming the model actually obeys it across several live quizzes is a
  **human retest**, tracked in the session handoff `/tmp/handoff-92igMl.md`, not
  automatable here.
- The current weak line to replace is line 23 of that file, beginning
  "Do **not** mark the correct option `(Recommended)` or put it first on
  purpose."

## Items

### 1. Strengthen the rule and add a guard script

**Delivers:** the answer-ordering rule in
`.claude/skills/teach/references/quiz-ui.md` is rewritten to a hard,
positive-instruction form — the correct option is randomised to a non-first
slot every quiz, never first, never fixed-position, reorder if it lands in slot
1 before sending — and a new executable guard
`.claude/skills/teach/references/check-answer-ordering.sh` passes only when that
strong rule is present and the old leak-prone wording is absent.

**Blocked by:** none.

```yaml
survey:                       # exit 0 means already done
  cwd:  .
  argv: [test, -x, .claude/skills/teach/references/check-answer-ordering.sh]
acceptance:                   # exit 0 means correctly done
  cwd:  .
  argv: [bash, .claude/skills/teach/references/check-answer-ordering.sh]
scope:
  writes:
    - .claude/skills/teach/references/quiz-ui.md
    - .claude/skills/teach/references/check-answer-ordering.sh   # (new)
  protects:
    - .claude/skills/teach/SKILL.md
    - .claude/skills/teach/references/philosophy.md
    - .claude/skills/teach/references/process.md
    - .claude/skills/teach/references/learner-files.md
```

**Notes:**

- The guard script must be a single self-contained bash file (the board runs one
  argv, no `&&` chaining). It must assert BOTH: (a) the strong rule is present —
  match on stable phrases such as `Randomise where the correct option sits` and
  `never put the correct option first`; and (b) the weak wording is gone —
  it must NOT match `put it first on purpose`. Use `set -euo pipefail` and a
  trailing negated `grep` (`! grep -q …`) so any regression is a non-zero exit.
  This exact three-assertion shape was validated in the authoring session:
  it exits 1 on today's file and 0 once the rule is rewritten.
- Keep the rule's surrounding bullet structure and the "I don't know is always
  last / not a content slot" convention intact; only the ordering bullet
  changes.
- `survey` is intentionally the script's *existence* (`test -x`), not its
  content: the script does not exist yet, so the survey is non-zero (not done)
  today, and becomes `0` only after the item lands the script — which is exactly
  when `acceptance` (running it) also becomes meaningful.

## Explicitly out of scope for this board

- **The dsh-learn-panel reveal-delay (~6.6s) investigation.** Its source lives
  at `~/.dsh/plugins-src/dsh-learn-panel`, a separate repo the dotfiles board
  cannot worktree; it stays in the handoff `/tmp/handoff-92igMl.md`.
- **Live behavioural retest of teach** (running several real quizzes to confirm
  the model obeys the rule). Nondeterministic; a human task in the handoff.

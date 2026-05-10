# Fixture: agent-team-timer

**Acceptance fixture for ISC-10 (PRD) / T-10 (PLAN.md §3.1).**

Source: real prior-session bug in `~/dotfiles/.pi/agent/extensions/agent-team.ts`,
fixed in commit `343e5c0` ("fix(agent-team): only show elapsed timer for
running agents") on 2026-04-08. This is a bug that an autonomous Claude/opencode
session shipped and that a human later caught — exactly the class of failure
PiPerspective is meant to catch upstream.

## Files

| File                       | Purpose                                                                  |
|----------------------------|--------------------------------------------------------------------------|
| `ISA.md`                   | The fixture's ISA — what pi sees as the spec to verify against.          |
| `diff.patch`               | The buggy proposed diff (the **inverse** of the real fix commit).        |
| `expected-verdict.json`    | Schema of a passing run: required verdict, blocker count, regex matches. |
| `fix-commit.patch`         | The real fix commit, kept for reference. NOT shown to pi.                |
| `ISA-with-answer-key.md`   | The ISA plus a "Known Bugs" section. NOT shown to pi. Maintainer-only.   |

## How the fixture is constructed

The real fix commit (`fix-commit.patch`) made four edits:

1. `timeStr` ternary: `!== "idle"` → `=== "running"` (line ~957)
2. Wide renderer branch: `!== "idle"` → `=== "running"` (line ~1051)
3. Added `clearInterval(state.timer)` before first `setInterval` (line ~1220)
4. Added `clearInterval(state.timer)` before second `setInterval` (line ~1428)

`diff.patch` is `git diff <post-fix-tree> <pre-fix-tree>` — i.e. a proposed
diff that *introduces* all four bugs the real fix later removed. It models
"opencode proposed this change, pi must catch that it breaks the ISA."

## Running the fixture

```bash
cd ~/.config/opencode
bun run skills/PiPerspective/Tools/InvokePi.ts \
  --phase VERIFY \
  --isa skills/PiPerspective/Fixtures/agent-team-timer/ISA.md \
  --diff skills/PiPerspective/Fixtures/agent-team-timer/diff.patch \
  --json > /tmp/pi-verdict.json

# Check
jq '.verdict' /tmp/pi-verdict.json   # expect: "FAIL"
jq '.blockers | length' /tmp/pi-verdict.json   # expect: >= 2
```

## What "passing" means (T-11 success criterion)

A run passes if **all** of the following hold:

1. `verdict === "FAIL"`.
2. `blockers.length >= 2`.
3. At least one blocker mentions the status predicate / `!== "idle"` /
   "running" divergence with severity `major` or `critical`.
4. At least one blocker mentions the missing `clearInterval` /
   interval / re-dispatch / timer leak with severity `major` or `critical`.
5. At least one blocker's `evidence[]` cites one of the four affected line
   ranges (~957, ~1051, ~1221, ~1429).

A grader script (`Verify.ts` next to this README, not yet written —
optional for T-11 manual review) can automate these checks against
`expected-verdict.json`.

## What "failing" means

- `verdict === "PASS"` or `"CONCERNS"` → pi rubber-stamped a buggy diff.
  Either the prompt needs tuning, or the model is too aligned with the
  primary agent's family.
- `verdict === "FAIL"` but blockers miss one of the two bug classes → the
  prompt is OK on one axis but blind on the other. Tune the prompt.
- `verdict === "FAIL"` with all four line ranges cited → ideal. T-11 done.

## Why this is a good fixture (per PRD ISC-10)

- **Real**, not synthetic. From a 2026-04-08 commit on `~/dotfiles`.
- **Missed by a same-family reviewer at the time**: the original buggy
  code shipped, was used, and required a separate fix commit.
- **Two distinct bug classes** in one diff (logic + resource leak),
  exercising both the "find the wrong predicate" and "find the missing
  cleanup" reviewer skills.
- **Verifiable**: blockers must cite specific file:line evidence, so the
  test is mechanical, not vibes-based.

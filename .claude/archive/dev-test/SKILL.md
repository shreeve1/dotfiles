---
disable-model-invocation: true
name: dev-test
description: >-
  Backfill and run automated tests for code that ALREADY exists — the
  test-after / regression complement to the test-first `tdd` skill, and the
  `/dev-test` step that `dev-build` hands off to. Use this whenever the user has
  just built or changed code and wants tests written for it and run, says
  "dev-test", "/dev-test", "add tests for what I built", "backfill tests",
  "make sure this is tested", "test this and run it", "cover the changes", or
  finishes a build/implement/fix and asks to verify it with tests. Also use it
  when a bug was just found and the user wants a regression test so it can't
  come back. Defaults to testing what changed this session (working-tree diff),
  proposes the gaps it found, then writes the tests and runs them. Prefer `tdd`
  instead only when the user wants to write tests FIRST and drive new code from
  them.
---

# dev-test

Write the tests that *should* already exist for code that *does* already exist,
then run them. This is the back half of the build loop: `dev-build` (or any
hand-written change) produces code; `dev-test` makes sure that code is pinned
down by tests and that the suite is green before `dev-review` looks at it.

## When this skill fits (and when it doesn't)

Reach for `dev-test` when the code exists and the tests are missing or thin:
just-built feature, a fix that has no regression guard, a diff that touches
behavior nobody asserted. The direction is **code → test**.

Reach for `tdd` instead when you're starting fresh and want a failing test to
drive new code into existence. The direction there is **test → code**. They are
partners, not rivals — a common flow is `tdd` for the core logic written
test-first, then `dev-test` to backfill the integration and edge-case tests the
first pass skipped.

If the user wants to *manually* poke a running app to confirm a change works,
that's `verify`, not this. `dev-test` is about durable automated tests.

## Operating mode

Two defaults, both chosen so the skill keeps momentum without surprising anyone:

- **Scope = the working-tree diff + this session's changes.** Test what changed,
  not the whole repo. If the user names a module/dir/file, scope to that
  instead. Offer the whole-module sweep only when they ask for legacy backfill.
- **Propose, then write.** Surface the gap list first (so the reasoning is
  visible), then write the tests and run them — no mid-flight approval gate.
  Report exactly which test files/cases you added so the diff is easy to review.
  This trusts the user to review the diff rather than interrupting them.

State the scope and the gap list out loud before writing. That one paragraph is
what makes "it wrote tests for me" feel like a collaboration instead of a
black box.

## The loop

### 1. Determine scope

Establish what you're testing before anything else. The **git diff is the
authoritative source** — it works whether or not there's any conversational
history (this skill is often invoked by a fresh agent handed off from
`dev-build`/`ralph`, with no session to draw on). Crucially, look in *all three*
places a change can hide, because by the time tests get written the work is
frequently already committed on a branch — at which point a bare `git diff` is
empty and would fool you into thinking nothing changed:

```bash
git status --porcelain                       # unstaged + untracked
git diff                                     # unstaged changes
git diff --staged                            # staged-but-uncommitted changes
# committed-on-this-branch changes (the common case once work is committed):
BASE=$(git merge-base HEAD origin/main 2>/dev/null || git merge-base HEAD main 2>/dev/null)
[ -n "$BASE" ] && git diff "$BASE"...HEAD --stat && git log --oneline "$BASE"..HEAD
```

Read the actual changed lines — don't guess from filenames. Then *enrich* with
whatever the session offers: features built, bugs hit and fixed, behaviors
discussed. The diff tells you *what* moved; the session (when present) tells you
*why* and what the intended behavior is. If every source is empty (clean tree,
no branch delta, no session), ask the user what to scope to rather than testing
the universe.

### 2. Detect the test stack

Don't assume a framework — read the repo. A single repo may have several stacks
(e.g. a Python backend and a JS frontend), so detect per-area and use the right
runner for each changed file. See `references/stack-detection.md` for the
manifest signals and run commands for pytest/uv, Playwright, Jest/Vitest, Go,
Cargo, and others. Match how the project already invokes tests (check `CI`
config, `Makefile`, `package.json` scripts, `CLAUDE.md`) rather than inventing a
command.

**If there's no test infrastructure at all** — no framework installed, no test
dir, no runner — don't bail. Bootstrapping is part of the job (this skill's own
origin was a repo where the first browser test, its config, and the runner wiring
all had to be created from nothing). Set up the *minimal idiomatic* harness for
the ecosystem you detected from the source: add the standard test dependency
(pytest, vitest, `@playwright/test`, …) via the project's package manager, create
the conventional test directory and any config/fixtures the runner needs, and add
a `test` script/target where the project keeps its commands. Keep it minimal — no
elaborate test framework of your own — and call out in the report that you
bootstrapped the harness, since that's a bigger change than just adding tests.
When the bootstrap choice is non-obvious (e.g. unittest vs pytest, vitest vs
jest), state the pick and why rather than asking.

### 3. Turn intended behavior into checkable statements

A test is a written-down expectation. Before writing any, list the behaviors the
changed code is supposed to guarantee, phrased as something you could check.
"Handles auth" is not checkable; "rejects a request with no token → 401" is.

The richest source of these is usually already written down:

- **Acceptance criteria** in the kanban issue / ticket / plan — each checklist
  line is a test waiting to be transcribed. If the project uses `.kanban/` or an
  RPIV plan, read the relevant issue and mine its criteria.
- **The session itself** — every bug found this session is a behavior that was
  silently wrong; each becomes a regression assertion.
- **Docstrings, types, and error paths** in the changed code — the unhappy
  branches (raises, 4xx/5xx, guards, early returns) are the ones tests forget.

### 4. Find the gaps

Locate the existing tests for the in-scope code (search by symbol, by sibling
`test_*/*.spec.*` files, by import). For each behavior from step 3, ask: is there
already a test that would fail if this broke? The gaps are:

- behaviors with **no** assertion at all
- **unhappy paths**: empty/invalid input, errors, concurrency, boundaries,
  the 404/500 — most real bugs live here, not on the happy path
- **session-found bugs** with no regression test yet

List these for the user before writing — this is the "propose" half of
propose-then-write, and it's what keeps the skill from feeling like a black box.
Use a compact, scannable format so the plan is obvious at a glance:

```
## dev-test plan

Scope: <files / diff / module>  ·  Stack: <runners>
Existing coverage: <what's already tested, briefly>

Proposed tests:
- [behavior] <observable behavior> → <file>::<test_name>
- [unhappy] <edge/error case> → <file>::<test_name>
- [regression] <bug> → <file>::<test_name>
- [bootstrap] <harness piece being created, if any>

Skipping: <behavior> — <why it's not worth a test>
```

Then proceed straight to writing (no approval gate) — the list is for visibility
and a reviewable diff, not a stop point.

### 5. Write the missing tests

Write only tests that pull their weight. The guardrails below are the whole
point of the skill — they're why a generated test suite is trustworthy instead
of noise. Read `references/writing-good-tests.md` for the reasoning and
worked examples; the short version:

- **Test behavior, not implementation.** Assert what a caller/user observes
  (return value, response, rendered text, raised error), never private internals.
  Behavior tests survive refactors; implementation tests get deleted in anger.
- **No speculative tests.** Don't test framework code, getters, or scenarios
  that can't occur. Simplicity First — fewer, sharper tests beat a wall of
  filler. Coverage % is a hint for finding untested code, never a target.
- **One regression test per genuine bug**, named so the failure explains the
  bug. Prove it: a regression test should fail against the buggy code and pass
  against the fix (mention this when you can demonstrate it).
- **Match the project's conventions.** Same framework, fixtures, naming,
  directory layout, and assertion style as the surrounding tests. A reviewer
  shouldn't be able to tell which tests are new from style alone.
- **Don't touch unrelated tests.** Add and extend; don't refactor or "improve"
  tests outside the scope. If an existing test is wrong, flag it — don't
  silently rewrite it.

### 6. Run, report, loop

Before running, glance at what the test command actually *does* — most suites are
self-contained, but some hit external services, run migrations, or talk to a real
database. If a suite has side effects beyond a temp/sandbox, confirm it's safe to
run here (a test config pointing at a live/prod resource is a stop-and-ask, not a
run-and-see). For fast feedback, run the **new/affected tests first**, then the
**whole relevant suite** once they pass — new tests can break old ones, so the
full run is not optional, just second.

On failure, decide each time whether the *test* is wrong or the *code* is wrong:

- test wrong → fix the test
- code wrong → this is a real find; report it clearly. Fix it only if it's
  in-scope and obviously correct to do so, otherwise surface it and let the user
  decide. Surfacing a real bug is a success, not a detour.

Loop until green or until a failure needs a human decision.

### 7. Make sure the tests will actually run again

A test only protects anything if it runs without someone remembering to run it.
Once the suite is green, check that the tests you just wrote are reachable by the
project's automation, not just by you on this machine:

- Does CI (`.github/workflows/*`, etc.) run the suite/command these tests live
  in? For a new stack (e.g. you bootstrapped Playwright), CI almost certainly
  doesn't run it yet.
- Is there a pre-commit hook or harness Stop-hook that runs them?

If the new tests aren't wired into any automation, **say so explicitly in the
report** and name the command CI would need to run (and any setup it implies,
e.g. `playwright install`). Offer to add the CI step / hook — don't silently
leave tests that will never run again. Wiring is a separate, often
infra-sensitive change, so propose it rather than assuming.

## Final report

Close with a compact report so the user can review without re-deriving anything:

```
## dev-test report

Scope: <what was tested — files / diff / module>
Stack: <runners used, e.g. pytest (uv), Playwright (pnpm)>
Bootstrapped: <none | harness pieces created, e.g. added vitest + first config>

Tests added:
- path::test_name — <behavior it pins>
- path::test_name — regression for <bug>

Gaps intentionally left:
- <behavior> — <why not worth a test>

Result: <e.g. 421 passed, 3 e2e passed>
Bugs surfaced: <none | description + whether fixed>
Runs in CI: <yes | NO — not wired in; CI needs `<command>` (+ <setup>)>
```

## Relationship to neighboring skills

- `tdd` — test-first / greenfield. Use it to *drive* new code; use `dev-test` to
  *backfill* tests for code that exists. Complementary.
- `dev-build` — builds from a plan and hands off here. `dev-build → dev-test`.
- `dev-review` / `code-review` — review the change. Run `dev-test` first so the
  suite is green before review.
- `verify` — manual run-the-app confirmation. Different tool; `dev-test` is
  automated tests.
- `diagnose` / `triage-issue` — when a bug needs root-causing first; once the fix
  is in, `dev-test` writes the regression guard.

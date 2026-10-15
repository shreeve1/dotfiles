---
name: post-work-cleanup
description: Clean up a finished session's diff to its language's best practices before the commit - formatter/linter first, then tidy against per-language standards, then re-run tests. Use when code work is done and ready to commit.
---

# Post-Work Cleanup

The code already works; make it clean. Run it after the work is done, not while the feature is half-built,
and before the commit.

Scope is the **sweep diff** — the files this session changed — never the whole repo. A repo-wide cleanup
mixes a hundred intentions into one unreviewable change; the diff keeps the sweep reviewable and
reversible.

Behavior-preserving is the hard line. A change that could alter behavior is a bug, not cleanup, and belongs
in its own change.

## Steps

### 1. Take the sweep diff

Collect the changed and untracked paths (`git status --short`, `git diff --name-only`, add `--cached`). Also
include work this session already committed: list commits since the branch point or the last commit before
the session (`git log --oneline <base>..HEAD`). Read every changed file in full - cleanup needs the whole
file, not the hunks. Drop out-of-scope paths (generated, vendored, lockfiles - see
`references/standards/_INDEX.md`) and name them in the report.

**Done when** every path this session changed is listed and read (committed and uncommitted), and any file
another session is editing is named and left untouched.

### 2. Deterministic pass

Read `references/deterministic.md`. For each surface in the diff, run the installed formatter, then the
linter with autofix, on the changed files only. Never install tooling mid-sweep.

**Done when** every surface in the diff has had its formatter and linter run, or is recorded as unavailable
with the reason.

### 3. Load the language standards

Read `references/standards/_INDEX.md`. Match each changed path to its surface and read every matched
`RULES.md` in full, plus only the cross-language concern rules the diff actually touches - for a docs-only or
otherwise trivial diff, do not load the whole concern table.

**Done when** every changed file matches a rule in the index or is recorded as out of scope (generated,
vendored, or a lockfile), and you can name the rules you loaded.

### 4. Judgement pass

For each changed file, against its loaded rules, apply these five passes in order:

1. **Dead code** — unused variables, functions, imports, parameters; commented-out code.
2. **Duplication** — repeated blocks to extract; repeated meaning to state once.
3. **Comments** — delete comments that restate the code; keep the ones that give a *reason* the code
   cannot (a workaround for an external constraint, a non-obvious invariant). Restating what the code does
   is noise; a reason is signal.
4. **Naming and structure** — intention-revealing names, guard clauses over nesting, the language's idiom
   over the hand-rolled equivalent.
5. **Rule drift** — anything the loaded `RULES.md` files call an anti-pattern.

Stay inside the diff and preserve behavior. A fix that needs a design change is a new ticket, not a sweep
edit.

**Done when** all five passes have been applied to every changed file, and each loaded rule file has been
applied in full (the sweep's exhaustiveness bar).

### 5. Verify

Re-run the project's tests, typecheck and linter (the commands in `references/deterministic.md`). Cleanup
that breaks a test is a defect: revert it or fix forward.

**Done when** tests, typecheck and linter are green, or every remaining failure is named as pre-existing.

### 6. Report and commit

Report: the files swept; the rules loaded; what each of the five passes removed; the tools run; the test
result; and anything left behind (an unavailable tool, an out-of-scope finding, a finding that needs its own
ticket). Commit per the workspace rule: exact paths, `<area>: <what changed>`.

## What cleanup is not

- Not a feature or a refactor for its own sake. It removes and tidies; a behavior change is a separate task.
- Not a whole-repo reformat. The diff bounds it.
- Not the place to silence a linter. Fix the finding, or file the ticket.

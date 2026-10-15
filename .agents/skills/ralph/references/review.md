# Ticket review: independent reviewers, one fix round, cleanup

How a Ralph worker reviews its own committed ticket before declaring DONE. Both
drivers use it: `ralph-loop.sh` workers reach it from SKILL.md §4, and board-mode
lane workers from the gralph prompt. It never writes board state; the caller says
where the **review record** goes (the issue file in sequential mode, the lane's
`.ralph-progress-<N>.md` in board mode).

Blocking is the exception. A review that finds things is normal: the worker fixes
them and carries on. A ticket blocks only when a re-review upholds a high-severity
finding.

## 1. Spawn the reviewers

Reviewers are fresh `pi -p` processes. They do not inherit your context, and they
are not the `subagent` tool (workers run without extensions). Run them from the
repo root, in parallel when there is more than one.

Size the diff from the implementation base (`git diff --stat <BASE_SHA> HEAD`) and
pick lenses. The lens text is in `~/.agents/skills/independent-review/references/lenses.md`.

| Diff | Lenses |
|------|--------|
| < 50 lines, 1-2 files | Gaps |
| 50-200 lines or 3-5 files | Gaps, Skeptic |
| 200+ lines or 5+ files | Gaps, Skeptic, Architect, Minimalist |

Models:

- **Gaps** runs on a different model family from the worker: `cliproxy/claude-opus-5-5`.
  On a quota, 429, provider or unknown-model error, rerun it on `cliproxy/gpt-6.1-sol`.
  If both fail, run it on `${RALPH_MODEL:-cliproxy/deepseek-v4.1-flash}` and write `review degraded: <models tried and errors>`
  in the review record. A degraded review never blocks by itself.
- **Every other lens** runs on `${RALPH_MODEL:-cliproxy/deepseek-v4.1-flash}`.

```bash
pi --no-extensions --no-session --model cliproxy/claude-opus-5-5 -p "$(cat reviewer-gaps.txt)"
```

Each reviewer is read-only. Check `git status --porcelain -- . ':(exclude).pi-lens'`
before and after; if a reviewer changed files, discard its changes and its output, and
rerun it once.

### Reviewer prompt

Fill in `{LENS}`, `{LENS_TEXT}` (from `lenses.md`), `{ID}`, `{TICKET}` (the ticket body,
or its path), `{BASE_SHA}` and `{VERIFY}` (the `## Verification` command):

```text
You are an adversarial reviewer with the {LENS} lens. Find real problems; do not validate
the work. You are read-only: do not edit, write, or run anything that changes files or state.

## Intent
Ticket #{ID}: {TICKET}
Judge whether the work achieves this ticket well. Do not question the ticket.

## What to review
Run `git diff {BASE_SHA} HEAD` and read every changed file in full. Read the surrounding code
too: callers, callees, types, tests, docs, config. Gaps often live outside the diff.

Also check:
1. Every acceptance criterion is objectively satisfied.
2. The verification command passes (exit 0): {VERIFY}. If it fails only because a bare runner
   resolved the wrong interpreter (e.g. ModuleNotFoundError from a system Python without the
   project's deps), report it as a verification-command fix, not a code defect.
3. Lint and typecheck pass.
4. Critical LSP diagnostics in touched files (type/call/signature/import errors) are fixed.
5. No unrelated changes leaked into the diff.
6. Scope matches the ticket; no scope creep.
7. If the ticket has a spec: field, read .kanban/specs/<spec>.md. Report any place the diff
   builds something under the spec's Out of Scope, or contradicts a decision recorded in the spec,
   even when every acceptance criterion is met.

## Your lens
{LENS_TEXT}

## Rules
- Cite file:line and a concrete failure scenario. Trace the path that makes it reachable.
- Separate "this is broken" from "I would have done it differently".
- No praise, no restating what the code does, no hypotheticals without a reachable path.
- Rate each finding: high (blocks ship), medium (should fix), low (worth noting).
- Zero findings is a valid answer.

## Output
Numbered list. For each: [severity] title, Location, Finding, Evidence, Suggestion (optional).
Then exactly one final line:
RALPH_REVIEW: FAIL              (any high finding)
RALPH_REVIEW: PASS_WITH_NOTES   (medium or low findings only)
RALPH_REVIEW: PASS              (no findings)
```

## 2. Fix round

Merge the reviewers' findings and drop duplicates. For each finding, check it against the
code, then rule **accept** or **reject** with a one-line reason. Reject false positives, style
mistaken for substance, and findings that ignore a constraint the reviewer could not see.

Fix every accepted finding, run the `## Verification` command (exit 0 required), and commit
the fixes: `fix(#ID): review findings`. Medium and low findings never block. Fix them or
leave them rejected with the reason recorded.

There is one fix round. Do not run the reviewers again on the whole diff.

## 3. Re-review (only when a finding was high)

If any finding was high, accepted or rejected, run **one** re-review on the Gaps model
(same fallback order). Give it each high finding verbatim, your ruling and reason for it,
and `git diff <commit before the fix round> HEAD`. Ask it to answer, per high finding,
`CLEARED` (fixed, or the rejection reason holds) or `UPHELD` (still a real problem, with
evidence), then exactly one final line: `RALPH_REVIEW: FAIL` if any finding is upheld,
otherwise `RALPH_REVIEW: PASS`.

- Nothing upheld: go on to cleanup.
- Anything upheld: the ticket is **blocked**. Put the upheld findings, with the re-reviewer's
  evidence, in the review record, skip cleanup, and report BLOCKED.

No high finding means no re-review.

## 4. Cleanup

Read `~/.agents/skills/post-work-cleanup/SKILL.md` and follow it. The sweep diff is this
ticket's work only: `git diff <BASE_SHA> HEAD` plus anything uncommitted. In a shared tree
(files mode), stay inside the ticket's `files:` prefixes and never `git add -A`. Cleanup
preserves behaviour and is not reviewed again. Run `## Verification` after it. If the cleanup
breaks it and you cannot fix it forward, revert the cleanup commit; a failed cleanup never
blocks the ticket.

## 5. Review record

Write a `## Review` section to the review record:

- each reviewer: lens, model, number of findings (and `review degraded: ...` if it applies);
- each finding: severity, one line, ruling (accept/reject) and reason;
- the re-review verdict per high finding, if one ran;
- what cleanup changed, or `cleanup: nothing to change`.

Rejected findings stay in the record so `/ticket-review` and `/finish-spec` can see them.

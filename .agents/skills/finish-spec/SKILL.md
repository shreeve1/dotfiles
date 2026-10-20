---
disable-model-invocation: true
name: finish-spec
description: "Verify, fix, and close a spec once its child tickets are done. The terminal bookend of to-spec → to-tickets → implement: confirms the slices compose, walks the spec's acceptance criteria against the merged code, fixes only small integration gaps, and closes the spec."
---

Verify that a completed spec's feature actually works end-to-end, fix small integration gaps, and close the spec. Use this after every child ticket of a spec has been implemented and closed — not before.

This is a **verification** skill, not an implementation one. It does not build new slices; if it finds a gap too large for a small fix, it files a new ticket rather than growing this run.

## Prerequisites

- The spec's child tickets are all closed. Confirm before starting; if any child is still open, stop and report which — do not verify a half-built feature.
  - **Local `.kanban/` board:** the spec is `.kanban/specs/<slug>.md` and its children are the tickets with `spec: <slug>` (`board.sh --board .kanban --spec <slug> json`, plus any of that spec's tickets already under `.kanban/archive/`). "Closed" means `status: done`; a child that is `cancelled` or still `pending`/`blocked` stops you.

## Process

1. **Fetch the spec.** Read the spec's full body and comments from the configured issue tracker (locally: `.kanban/specs/<slug>.md`). Re-read its **Acceptance criteria** / user stories and **Testing Decisions** — those are the checklist. If the spec's frontmatter has a `ledger:` line, read that grill ledger too: its Decisions and Defaults are the second checklist (step 4).

2. **Run the full suite once, clean.** Backend and frontend, plus typecheck. The child tickets each gated their own slice green; the value here is confirming the slices **compose** — that independently-landed slices don't collide. Fix any failure caused by slice interaction.

3. **Walk the acceptance criteria against the merged code.** For each criterion / user story, confirm the behavior exists — a real end-to-end check, not just "a unit test passed". Use `/code-review` or a fresh reviewer subagent over the combined diff since the spec opened.

4. **Walk the grill ledger against the merged code.** A spec can drift from the grill it came from, and every ticket check trusts the spec, so this is the one place the finished feature is compared with what the user actually decided. For each line under the ledger's Decisions and Defaults, find where the merged code honours it, or record that the code contradicts it (quote the ledger line and cite file:line). A contradiction is a gap like any other: handle it in step 5. A decision the code leaves undone is not a contradiction unless the spec promised it. If the spec has no `ledger:` line, say so and skip this step.

5. **Fix only small integration gaps.** Missing wiring between slices, a criterion that no slice quite covered, a stale reference. Keep fixes surgical. If a gap needs a real new slice, **file a new ticket** (via `to-tickets` conventions, `ready-for-agent`) blocked by nothing, and note it on the spec — do not implement it here.

6. **Commit** any fixes to the current branch with a clear message.

7. **Close the spec.** Only when the suite is green, every acceptance criterion is verified and no ledger decision is contradicted:
   - Flip any ADR authored for this spec from `status: proposed` to `status: accepted` (the feature shipped) and commit it.
   - Close the spec on the configured issue tracker with a completion note listing the verified child tickets, confirming green suite + acceptance walk, and listing the ledger decisions checked (or "no ledger"). Locally, a spec has no status field: append a `## Completion` section to `.kanban/specs/<slug>.md` with the note and today's date, and commit it.

8. **Look for architecture friction across the slices.** Run after the spec is closed; it proposes, it does not change code. Read `~/.agents/skills/improve-codebase-architecture/SKILL.md` and follow it, taking the files the spec's tickets changed (the combined diff from step 3) as the direction the user named, so the scan starts there instead of from the commit history. The user picks a candidate from its report, or none. Any refactor that comes out of the grilling becomes a new ticket, not an edit in this run.
   - Skip this step when no user is present (for example when `gralph finish` launched you): the skill stops to ask which candidate to explore.

## Rules

- Verify, don't build. New feature work becomes a new ticket, never inline scope growth.
- Close the spec **last** of the verification steps (step 8 only proposes), after green + acceptance walk + ledger walk — closing is the signal the *whole feature* is verified, not that tickets are individually done.
- Do not reopen or modify child tickets; they are done.

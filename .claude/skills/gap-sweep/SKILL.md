---
name: gap-sweep
description: Quick automated critical-gap sweep of one RPIV pipeline artifact (FRD, research, design, plan) or the working-tree code, fixing only critical gaps in place and updating the file. USE WHEN invoked as `/gap-sweep <target> <kind>` by the rpiv-run driver between pipeline steps. Auto-accept, no gate — fix and move on.
---

# gap-sweep

Self-review pass run **between** RPIV pipeline steps. Take the artifact the previous step just produced, sweep it for **critical gaps only**, fix them **in place**, and stop. This is not a quality gate — never block, never ask, never wait. Fix what is critical, leave the rest, emit a one-paragraph summary.

`$ARGUMENTS` is `<target> <kind>`:
- `<target>` — an absolute/relative path to the artifact file, **or** the literal `working` (for `kind=code`, meaning the uncommitted working-tree changes on the current branch).
- `<kind>` — one of `frd | research | design | plan | code`.

## Hard rules

1. **Edit in place.** For a file target, modify *that exact file* (same path). **Never create a new artifact file** (no new timestamped `.md` in the artifact dir) — the next pipeline step consumes this path, and a new file would be missed or would shadow it.
2. **Critical gaps only.** A critical gap is something that would cause the *next* step to produce wrong or incomplete work. Do **not** reword for style, reorganize, expand scope, or add nice-to-haves. Minimal, intent-preserving edits.
3. **Preserve intent.** Never change decisions the artifact already committed to. Fill holes and fix contradictions; do not redesign.
4. **Autonomous.** Pick the recommended fix and apply it. Never ask the user anything.
5. **Bounded.** This is a *quick* sweep. If you find no critical gap, change nothing and say so.

## What counts as a critical gap, by kind

- **frd** — internal contradictions, a stated goal with no acceptance criteria, a decision referenced but never made, an obviously missing constraint that research would otherwise guess at. Be especially conservative: the FRD is the human alignment doc. Fix only unambiguous holes; never invent scope.
- **research** — a question the FRD raises that the research never answers; a claimed file/symbol/behavior that does not exist in the codebase (verify with Grep/Read before trusting it); a load-bearing assumption with no evidence.
- **design** — a slice or component named but never specified; an interface/contract referenced by one part and undefined elsewhere; a decision from research dropped or contradicted; a data-flow or error path with an obvious hole.
- **plan** — a phase whose success criteria are missing or unverifiable; a step that depends on something no prior phase produces; a file/path that does not exist and is not created by an earlier phase; ordering that can't work. This sweep runs **before implement**, so catch infeasible steps here.
- **code** — review the uncommitted working-tree diff (`git diff` + new files) against the plan. Fix only critical defects: a bug that breaks the golden path, a missing piece the plan required, a clear correctness or security error you introduced. Do not refactor or restyle. Re-run a quick check (build/typecheck/test) only if cheap and already configured.

## Procedure

1. Read the target. For `code`, run `git diff` and inspect new/changed files; read the plan referenced by the run if available for the intended scope.
2. Identify critical gaps per the list above. Verify claims against the real codebase before acting (don't trust the artifact's own assertions).
3. Apply minimal in-place fixes.
4. Emit a short summary: what gaps you found and fixed, or "no critical gaps found." Then stop.

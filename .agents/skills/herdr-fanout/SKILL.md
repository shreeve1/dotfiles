---
name: herdr-fanout
description: Use when the user explicitly selects herdr-fanout for a written plan or a bounded goal with multiple workstreams, or accepts an offer to use persistent herdr task and reviewer tabs.
---

# Herdr fanout

Keep bounded workers warm for missing pieces; the originating parent owns acceptance
and finishing. This is an optional workflow, not a replacement for Superpowers or
a reason to delegate small edits. Use only when explicitly selected or accepted.

Load `herdr-handoff` for launch/recovery and safe merge/cleanup, `independent-review`
for review policy, and [contracts](references/contracts.md) before dispatching.
Invocation: `/skill:herdr-fanout <plan-path or bounded goal>`.

Use handoff's task-based model selection with no fixed default. Consider GLM-5.3
first for suitable text-only work, including coding; Sol, Terra and Luna remain
options based on task fit, capabilities and availability. No Claude models
for workers, reviewers, replacements or fallbacks. Reviewers still follow
`independent-review`'s different-family requirement; Sol, Terra and Luna are all GPT.

## Run

1. **Scope.** Read the plan/spec or establish intent, constraints and checkable done
   criteria. Resolve consequential unknowns before launch. Create a unique private
   run directory outside worktrees and record its absolute path and parent identity.
   The parent alone updates shared plans, memory, ledger and acceptance decisions.
2. **Divide.** Record workstream dependencies, owned resources, models, verification
   and review requirements. Parallel Git writers need separate worktrees/branches;
   shared external resources are serialized. Launch only dependency-ready work via
   `herdr-handoff task`, from its recorded directory; explicitly append `--worktree`
   to the spawn command for Git writers to get their own worktree, branch and workspace. No nested delegation/reviews.
3. **Coordinate.** Persist identities and reports under the contracts. Handle messages
   once by full ID, reconcile delayed state, and copy the parent on dependency
   updates. Reuse warm sessions for clarifications and fixes. On resume reconcile
   ledger, live identities, reports and Git before relaunching anything. Do local
   work while children run; when idle use bounded waits, not tight polling.
4. **Check and review.** Verify ready reports against briefs and test evidence; parent
   checks are not independent review. Assemble an isolated combined candidate before
   destination integration. Commission explicit herdr-mode `independent-review`,
   with fresh lens sessions. Keep them for fix-only follow-ups; do not add a full
   review panel to every small task. Record substantial/high-risk classification
   before review as defined in the contracts.
5. **Fix.** Validate and disposition findings, send accepted in-scope fixes to their
   original workers and return fix diffs to the same reviewers. Initial review plus
   at most three fix/re-review rounds per unit. The persistent count survives
   replacement, fallback and compaction. At the cap retain affected resources and
   report unresolved blockers; do not restart the budget or downgrade to pass.
6. **Accept and release.** PASS alone is insufficient: no unresolved accepted
   high/medium finding, missing required lens or failing required check may pass.
   Verify the combined result and remaining consumers. The parent performs reviewed
   local integration and safe worktree/branch/tab cleanup under `herdr-handoff`.
   Keep workers/reviewers needed for outstanding checks warm; release the others.
   Archive evidence and report merged tips, checks, rulings, deferred items and any
   retained resources. Incomplete cleanup stays visible, not silently "finished".

## Boundaries

In-scope fixes and verified local merge/cleanup have the existing standing approval.
Scope/design changes, uncertain data disposal, push/deploy and live external changes
retain their usual approval requirements. No auto-stash, reset or force cleanup.
A `done`/`idle` tab means inspect its report, not acceptance. Read-only investigations
and non-Git goals use source/report snapshots instead of invented merge steps.

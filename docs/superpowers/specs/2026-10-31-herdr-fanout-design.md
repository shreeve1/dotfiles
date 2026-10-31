# Herdr fanout and warm independent review

## Intent and approved scope

James wants `herdr-fanout` as an optional alternative to Superpowers subagent
execution for written plans and general multi-workstream tasks. Keep workers warm
while the parent verifies, integrates and requests missing pieces. Keep reviewers
warm for checking fixes, without sacrificing an independent initial review.

This is a skills-and-small-launcher change, not a scheduler, daemon or replacement
for Superpowers. Existing subagent-based independent review remains the default.
No fleet sync, push, live service change or retrospective cleanup is included.

## Responsibilities

- `herdr-fanout`: scope workstreams, track dependencies and ownership, maintain the
  run record, coordinate workers, commission review, bound fixes and own acceptance.
- `independent-review`: own lenses, model selection, findings and verdicts; add an
  explicitly selected herdr transport while preserving existing default behavior.
- `herdr-handoff`: own launch/recovery, reply identities, safe local integration and
  resource cleanup. Fanout references this contract instead of copying it.

The parent performs routine verified local merge, worktree/branch cleanup and tab
closure under the existing standing approval. Pushes, deployments, destructive
recovery and broader changes retain their usual approval requirements. Independent
review alone still reports findings and waits for approval to fix; fanout's agreed
execution scope authorizes in-scope fixes, not redesigns or unrelated improvements.

## Fanout lifecycle

Use only when explicitly selected, or offered and accepted. Do not automatically
replace Superpowers or delegate small local edits. Invocation accepts a plan path
or a bounded goal; resolve missing consequential scope before launching.

Create one unique directory under `~/.local/state/herdr-fanout/` for each run, outside
all removable worktrees. Record the absolute goal/plan/spec paths, run owner/reply
identity, destination repository/branch, initial commit and verification commands.
For each workstream record its ID, dependencies, owned files/resources, model,
brief/report paths, pane/session/tab/workspace IDs, worktree/branch, dispatch-created
resources, reviewed tip, latest accepted message and current status.

Statuses are `planned`, `working`, `ready`, `reviewing`, `fixing`, `blocked`,
`accepted`, `released`. `ready` means the worker reported evidence and stopped
writing; it is not permission to merge, delete resources or close the tab.
`accepted` requires evidence, review disposition and relevant integration checks.
`released` means this run's resources have been cleaned up or a specific retained
resource and reason recorded. Outstanding cleanup remains visible as incomplete.

The parent is the sole writer of the run ledger and shared plan/manifest/memory.
Workers own their scoped source changes and report files; reviewers write only
review artifacts in the run directory, never the reviewed checkout. This is
instruction-enforced, not an operating-system sandbox; state that limitation.
Workers and reviewers do not delegate or commission duplicate reviews.

Parallel investigation is allowed with separate output files. Concurrent Git writers
use separate task branches/worktrees; disjoint files alone do not isolate Git's
shared index. Read-only workers may share a checkout, but generated state and
background tools can still write. Serialize shared external-resource work. Launch
only dependency-ready work; never have two writers own the same worktree/resource.
Use existing handoff launches from the intended working directory.

Messages identify run, sender, workstream, kind (`question`, `blocked`, `ready`,
`finding`, `update`) and a sender-local sequence. A message ID is the tuple of run,
recorded sender session identity and sequence. Persist individually handled IDs;
ignore only exact duplicates, not every sequence below the highest seen. A replacement
session has a new identity even if its sequence restarts. If 4 arrives before 3,
handle both once; reconcile delayed state updates against current artifacts before
changing status so an older message cannot undo a newer accepted state. Avoid
acknowledgement loops. Cross-worker dependency updates copy the parent. Messages
carry compact evidence and artifact paths, not entire history. Questions outside delegated approval go to James; ordinary clarifications
go to the parent. Detect missing result delivery before relaunching a worker.

On resume, reconcile the ledger against live identities, reports and Git before
sending prompts. Reuse a valid warm session. Replace only a confirmed missing or
unusable one, recording the replacement and feeding it the brief/report/findings.
Use bounded waits when idle and inspect missing deliveries; no tight status polling
or unattended unbounded waits. A lost parent leaves durable reports; workers do
not independently merge, widen scope or destroy resources.

## Review architecture

Use bounded task checks, then independent review of the combined candidate. Do not
run the full multi-lens panel after every small task. Task checks cover the brief,
required tests and named integration risks; they are not falsely labelled independent
review when performed by the parent. Accepted blocking findings stop dependent work.

Keep independent-review's existing lens sizing and explicit quick-mode behavior.
Do not infer quick mode from fanout or quietly change lens counts or verdict meaning.
Initial reviewers start fresh and receive intent, constraints, immutable diff/report
paths and exact source commit identities, not the author's persuasive narrative.
Each lens gets its own reviewer session. Select a different model family from the
reviewed implementer and, where possible, the parent. For mixed authors, state which
families are represented and any independence limitation. Preserve provider-error
fallbacks; never silently replace a missing lens or family with an unsuitable one.

Herdr mode is explicit in a standalone review request, or selected by fanout.
Standalone review closes its owned reviewer tabs after the synthesized verdict;
retain them only for an explicitly requested continuing fix/review cycle. Fanout
holds reviewer tabs until its cycle is accepted or blocked and handed back.
Herdr mode must not execute the default subagent launch instructions as well.

Each first-pass finding has a stable ID, severity, lens/reviewer, file:line, reachable
failure and evidence. The parent validates it, deduplicates without losing reviewer
provenance, records accept/reject with reason, and routes accepted in-scope fixes to
the original worker. Do not prompt the reviewer to ignore a likely finding.

For re-review, keep the original lens reviewer. Send the finding IDs, previous and
new exact tips, fix-only diff path and updated covering-test evidence. Request
`ADDRESSED` or `NOT ADDRESSED` per finding and new breakage in that fix diff. New
unrelated observations are recorded for final triage, not used to reset the cycle.
If a larger scope change invalidates this boundary, record a scope change and seek
approval instead of quietly restarting review with a fresh round budget.

An initial review plus at most three fix/re-review rounds per review unit is allowed.
The count survives compaction, worker/reviewer replacement and model fallback. All
blocking findings in a unit share that budget. At the cap, stop automatic cycling,
retain affected resources and report unresolved blockers/options. Never lower
severity, discard findings or claim acceptance simply to exhaust the budget.

For substantial or high-risk work, add one fresh final integration review after the
warm task/fix cycle. This is the combined-result review, not a second panel over
an identical task diff. It uses a separate explicit unit with the same three-round
cap; residual blockers stop completion. For small work, the initial combined review
and its warm follow-ups are sufficient. The builder chooses the precise risk test
but must state it in the skill and run record before commissioning review.

Existing `independent-review` PASS semantics are preserved: PASS alone does not
prove all findings resolved. Fanout acceptance requires no unresolved accepted high
or medium findings, passing required checks and no missing required review lens.
Low findings can be explicitly deferred. An incorrect or disputed finding gets an
evidence-based ruling, not silent removal. Missing/degraded review is reported;
it does not silently meet a required gate.

## Integration and release

The parent keeps workers warm through downstream dependency and integration checks.
For independent branches, assemble and review the combined candidate in an isolated
integration checkout when the destination is dirty or work is not yet accepted;
this avoids using the user's dirty checkout as a staging area. Record the exact
candidate tip and recheck destination movement before integration. Only verified,
reviewed work is merged into the recorded destination. Follow herdr-handoff's
identity, cleanliness, ancestry and no-force removal checks. Serialize merges.

Do not retain every tab until the end regardless of need: release a worker after
its output is accepted and no remaining dependency needs it. Retain a relevant
worker/reviewer for an actual outstanding check or fix. Do not use `done`/`idle` as
acceptance. Archive final reports, merged tips, checks, findings, rulings, deferred
items and removed/retained resource IDs before closing owned tabs. Pre-existing
user tabs and worktrees are outside cleanup authority.

## Minimal implementation

Add `.agents/skills/herdr-fanout/SKILL.md` and one disclosed reference containing
ledger/message/brief/report contracts. Add a herdr-mode reference to independent
review and route to it before the existing subagent launch. Adjust handoff only
where its task finish contract needs to defer closure to the commissioning parent.

The current launcher accepts only four model IDs, while review policy names more.
Replace the hardcoded four-ID validation with exact installed cliproxy model lookup,
retaining explicit model choice, no unknown-model fallback, and all launch recovery.
For this launcher, `~/.pi/agent/models.json` is the authoritative source and
`.providers.cliproxy.models` must be an array of model entries with string IDs.
Before tab creation, distinguish missing/unreadable files, malformed JSON or invalid
model-list structure, and an absent requested model. Name the path and cause without
printing configuration contents. Fail closed; do not try another discovery source.
This is the only planned executable change; no new dependency or generic framework.

## Verification and builder-owned choices

Add mocked CLI regression tests for installed/unknown reviewer models, missing or
unreadable model files, malformed JSON, invalid model-list structure and existing
launch behavior. Each configuration failure must create no tab. Add structural checks for mode routing and required safety
contracts. Use fresh-context behavioral scenarios before and after the guidance:
workers prematurely done, late missing dependency, duplicate/out-of-order messages,
replacement-session sequence reuse, overlapping
writers, review PASS with medium findings, repeated third-round failure, missing
reviewer and dirty destination. Deterministic tests alone cannot prove model behavior.
Run style-check and the full repository suite and report unrelated failures honestly.

The builder may choose reference filenames, ledger presentation, test fixtures and
specific risk wording. No runtime automation, automatic fleet installation, or new
persistent service is implied by this design.

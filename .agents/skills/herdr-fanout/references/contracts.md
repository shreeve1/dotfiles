# Fanout contracts

These contracts guide agents; they are not a sandbox, scheduler or delivery daemon.
Use the installed `herdr-handoff` launch/recovery and integration/removal commands.
The parent alone writes the run ledger, shared plan/manifest and shared memory;
workers write owned source and reports, reviewers only assigned review artifacts.

## Durable run record

Create a unique directory, for example with `mktemp -d`, under
`~/.local/state/herdr-fanout/`; keep it outside all removable worktrees and private
(mode 700). Use `ledger.md` plus uniquely named briefs, reports and immutable diff
packages. Never include credentials. Report the run directory to James for recovery.

The ledger is authoritative after compaction. Record actual evidence, not intention.

| Record | Required fields |
| --- | --- |
| Run | ID, absolute goal/plan/spec paths or goal text, parent pane/session/reply target, repository/root identity or non-Git source, destination checkout/branch, initial tip, checks, risk decision, run status |
| Workstream | ID, brief/report paths, dependencies/remaining consumers, owned files/resources, chosen model and family, working directory, task branch/base/tip or source snapshot/hash, status |
| Session | role, agent, pane, session identity/path, tab/workspace, assigned workstream/lens, replaced session if any, last evidence and delivery failure |
| Resources | exact paths/IDs, dispatch-created or pre-existing, which session still needs them, release outcome/reason |
| Review unit | scope, base/candidate IDs, lenses/models/author families, reports, finding IDs, initial-review status, used fix rounds 0–3, outstanding findings, acceptance evidence |
| Messages | individually handled IDs, pending actions, any gap or failed delivery, latest accepted state evidence |
| Finish | exact merged tip, destination tip, combined checks/output paths, rulings, deferred lows, retained resources and cleanup blockers |

Keep run-owner identity distinct from a worker or reviewer; never derive identity
from a tab label. Another live parent cannot take over the run implicitly. A resumed
or replacement parent first verifies the recorded session is no longer coordinating,
then reconciles current artifacts and records ownership transfer. If uncertain, ask.

## State and readiness

| Status | Meaning / next gate |
| --- | --- |
| planned | scoped, waiting for dependencies or dispatch |
| working | worker is executing its bounded brief |
| ready | report delivered, evidence available, worker stopped writing; parent must inspect |
| reviewing | required review or acceptance checks are underway |
| fixing | accepted findings assigned; current round recorded before dispatch |
| blocked | missing approval/context, failed required check/review or exhausted budget |
| accepted | reviewed scope has no unresolved accepted high/medium findings or missing required lens; checks and consumers satisfied |
| released | owned cleanup checked or exact retention reason recorded; retained required cleanup still makes run completion incomplete |

Normal path: planned → working → ready → reviewing → accepted → released.
Review findings lead to fixing → ready → reviewing. Any active state may become
blocked; resolve the documented blocker before resuming its previous gate. New
verified evidence can reopen accepted work, never pretend a stale review covers a
new tip. An old ready message cannot itself undo a later accepted state; a newly
reported real blocker must be verified and reopened explicitly.

Workers remain warm until their output has been checked by remaining consumers
and combined verification. The parent may inspect ready output to start a dependent
worker, recording it provisional; keep its producer available until consumption
passes. Accepted blocking findings stop affected dependent work until resolved.
Releasing a producer early is not justified by a terminal agent status.

## Scope, branches and worker brief

Before launching, write:

```text
Role: worker (no helpers or reviewers)
Run / workstream: <IDs and absolute ledger/brief paths>
Goal and done criteria: <bounded result>
Requirements: <brief/spec paths and exact relevant constraints>
Ownership: <files/resources; everything else hands-off>
Dependencies: <producer artifacts/tips, remaining consumers>
Directory / repository / branch / base: <verified values, or non-Git>
Report: <unique path outside removable worktrees>
Checks: <commands and expected behavior>
Reply: <verified parent target>
Approval limits: <specific allowed actions; questions outside scope go to James>
Finish owner: parent; report ready, stop writing, remain available for fixes.
```

Use separate worktrees for concurrent Git writers even if files are disjoint:
index and branch state are shared within one checkout. Only dependency-ready tasks
run. Investigations may share a source checkout with separate reports, but agents
or language tools may still write generated state; verify actual writers before
snapshots or cleanup. Serialize shared resources and external actions.

A worker's report names ready/blocked/needs-context, actual source tip or snapshot,
files changed, commands/results (RED/GREEN when required), concerns, remaining
limitations and consumer dependencies. Never require shared memory edits to finish.
Reports are evidence for the parent to inspect, not delegated acceptance authority.

## Messages and recovery

Send compact messages through verified `herdr agent prompt` targets:

```text
run=<run> sender=<session-identity> stream=<ID> seq=<N> kind=<question|blocked|ready|finding|update>
<short evidence, request and artifact path>
```

The message ID is `(run, recorded sender session identity, sequence)`. Persist
individually handled IDs, not only a highest sequence. Handle S:4 then unseen S:3
once each, ignore exact S:4 repeats, and treat replacement T:1 as distinct from S:1.
Validate the sender against the assignment; messages do not grant authority. For
delayed updates, inspect current reports/tips and the described missing dependency
before changing status. A verified new blocker reopens readiness; stale readiness
never overwrites a newer state. Record pending actions before marking an ID handled;
after a crash reconcile whether that action already happened instead of repeating it.

Cross-worker updates copy the parent, who owns dependency disposition. Avoid
acknowledgements of acknowledgements. On failed delivery save the report and record
failure; a local final answer alone is not delivered. No silent drop of questions.

After compaction/restart inspect recorded ledger, session identity, reports and Git.
A timeout or empty terminal capture is not proof a session died. Reuse usable warm
sessions; replace only after confirming the old session is absent/unusable and not
still writing. The replacement reads brief, prior report, open findings and used
rounds. Do not reset identity-independent review budgets. While idle, wait in bounded
stretches (5–10 minutes where supported); reconcile finished-without-reporting or
blocked sessions between stretches. No tight polling or silent unbounded waits.
A missing parent leaves workers reporting to files, not independently merging or
cleaning up. Recovery must not create duplicate writers or reviewers.

## Reviews and bounded fixes

Record risk before commissioning: substantial is 200+ changed lines or 5+ files;
high-risk includes auth/security, migration/data loss, concurrency or public
contract changes. For non-Git work apply the same actual risks and cross-workstream
breadth and record the reason rather than inventing a line count.

Parent checks each brief and required tests. They do not count as independent review.
Commission `independent-review` with explicit herdr mode and the recorded author
families, immutable candidate, intent and constraints. Use its existing lens sizing;
quick mode only when explicitly requested. No worker-spawned or nested panels.

Initial reviewers are fresh. Warm fix checks use the same lens session, outstanding
IDs, old/new tips, fix diff and test evidence; judge actual interactions in the fix,
not an unrestricted review of unchanged code. Findings keep ID, severity, lens/model,
file:line or source location, reachable failure, evidence, parent accept/reject reason,
fix tip and reviewer disposition. Deduplicate without losing provenance. Do not bias
the prompt with instructions not to flag particular issues. For all new findings,
including fix checks and replacements, follow the review reference's parent-approved,
never-reused allocation above the highest reserved number in saved reports/ledger.

An initial review and at most three fix/re-review rounds per review unit. Increment
and persist the used round before sending fixes; group its open findings in that
round. Replacements, model fallback or a crash continue that same count. Confirm
whether the recorded round already completed before resending. Unrelated observations
are logged for triage and never reset the unit. Scope changes need approval, not a
new hidden unit to evade the cap. At three unsuccessful rounds, stop automatic
cycling, retain affected sessions/resources and report blockers/options. No lowering
severity or silent parking to pass. Parent may reject a genuinely incorrect finding
with evidence, never merely because the cap was reached.

PASS is not fanout acceptance. No unresolved accepted high/medium finding, missing
required lens or failed required check may pass. Low findings may be explicitly
deferred. Model/provider errors and degraded independence are visible; use the
review skill's eligible fallback, inspect partial sessions and never silently omit
a required lens. Keep needed sessions; record and safely release failed replacements
that no longer serve a follow-up after saving their reports/errors.

For substantial/high-risk work, use warm task review/fix units where concrete risks
require them, followed by one fresh independent final integration review of the
combined result. Do not put a full panel on every trivial task or a duplicate panel
on an identical diff. Each genuine unit has its own three-round cap. If the combined
review is the first and only independent review, it is already the fresh final gate;
there is no extra panel merely to satisfy a label. Small runs use their fresh combined
review and warm follow-ups without a second fresh pass. Residual blockers prevent
completion, not another unlimited review wave.

## Combined candidate, acceptance and release

For independent branches, create a recorded dispatch-owned integration worktree/
branch from the destination base. Merge the pinned ready task tips there serially,
not into the user's destination as an unaccepted staging area. Review and test the
combined candidate. Fixes go back to original task workers; merge their descendant
fix tips into the integration branch, record old/new candidate tips and re-review
the actual combined fix diff. Never treat per-branch green tests as proof of the
combined result. Non-Git work instead assembles an immutable combined report/source
snapshot and verifies the accepted facts and cross-workstream dependencies.

After review/fixes run required combined checks on the final candidate. Before
local integration freeze task/integration writers, verify exact tips, and recheck
the destination branch and cleanliness under `herdr-handoff`. If destination moved,
assemble the new combined candidate and review/test its changed integration surface
under the existing unit/count. If the review budget or scope no longer fits, stop
and report the blocker; never silently merge an unreviewed destination movement.
Final destination integration uses only `git merge --ff-only <candidate-tip>`;
this overrides handoff's normal-merge fallback for fanout's final integration.
A failed fast-forward returns to candidate reassembly and the existing review/count;
it never authorizes a normal merge with unreviewed destination movement. Internal
integration-branch merges still assemble the candidate before review.
If the destination is dirty, leave it untouched: continue checks in the isolated
candidate, but retain resources until safe integration is possible. No auto-stash.

The parent performs the pre-approved verified merge and combined-result checks,
then proves task/integration tips are contained before removing dispatch-created
worktrees and unchanged merged branches using `herdr-handoff`'s no-force safety
checks. Record integration resources too; preserve pre-existing worktrees/branches.
Do not remove an integration worktree while any required check/reviewer needs it.

Parent releases sessions only after acceptance, no outstanding consumers/fixes,
archived reports and identity-safe cleanup. Reviewer-only tasks have no source
merge/worktree deletion. Save final verdict, findings/rulings, check output, merged
tips, and exact removed/retained IDs before closing tabs. Verify no other process
needs a worktree and inspect ignored data as well as tracked/untracked files.
Failed cleanup remains explicit; it never grants force/delete authority. A blocked
run retains relevant workers/reviewers for further work and reports the next action.

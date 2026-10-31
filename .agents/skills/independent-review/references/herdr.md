# Herdr reviewer sessions

Use only when explicitly selected in `independent-review`, or commissioned by an
approved `herdr-fanout` run. Load `herdr-handoff` for launch/recovery, verified reply
addresses and identity-safe release. Its launcher accepts a bare installed cliproxy
model ID; validate against `~/.pi/agent/models.json`, not a guessed model name.
This is instruction-enforced artifact-only writing, not a sandbox. Reviewers may
write their assigned report; all reviewed checkout files, Git state and external
systems remain read-only. No delegated helpers or worker-spawned review seats.

## Commission

The parent supplies the run directory outside removable worktrees, reply identity,
review-unit ID, intent and binding constraints, author families, exact base/candidate
tips and immutable diff/source paths, required lenses, report paths and release owner.
For a proposal or non-Git task use uniquely named source snapshots/reports with
content hashes instead of commit IDs. Record the snapshot identity in every verdict.
If this is a standalone review, create a unique directory under
`~/.local/state/herdr-handoff/` and use this session as the release owner.

Use Steps 1–2 and `lenses.md` from the owning skill to size the review and choose
models; quick mode is explicit, not inferred from herdr. The prompt template still
applies, narrowed to the quick read when selected. Do not copy the implementer's
conversation or persuasive rationale into the commission.

## Fresh initial review

1. Select each lens's model explicitly from the owning skill's policy. Filter out
   the parent's family and the reviewed author's family. For mixed authors list
   all author families and the reviewer relation to them. If no permitted family
   remains, report degraded independence; do not silently treat it as a passed
   required gate. Preserve quick mode's model order and size limits.
2. Write one uniquely named brief and report path per lens. A reviewer adopts one
   lens, reads the immutable inputs and follows concrete named risks into direct
   source dependencies. It may run focused read-only checks only where necessary;
   it must not rerun whole suites just to reproduce available test evidence.
3. Launch a fresh `herdr-handoff task` session per lens from the intended source
   directory, with the review role and artifact-only write limit in its brief.
   Record agent/pane/session/tab/workspace, model, report and reviewed tip in the
   commissioning ledger. The brief says the parent releases the session, not the
   reviewer; `done` is readiness to inspect its report.
4. Reviewer writes findings with stable IDs `<unit>/<lens>/<number>`, severity,
   file:line, reachable failure and evidence. It returns the report path, snapshot
   identity and a compact status. `no findings` is valid; missing/empty output is
   not. Parent validates findings, preserves lens/model provenance when deduplicating,
   and records accept/reject reasons under Steps 4–5.

Provider/quota/rate failures use the next eligible policy model for the same lens.
Inspect live identities and partial reports before relaunching; a timeout is not
proof of failure. Unknown IDs are resolved against installed exact IDs, retaining
family constraints. Record replacements, models and errors. If choices are exhausted,
report the lens as not reviewed. Never run a replacement concurrently with a still
active reviewer for the same assignment.

## Warm fix checks

The commissioning parent supplies the outstanding finding IDs, previous reviewed
tip and new tip, uniquely saved fix-only diff, changed-source snapshots and updated
covering-test commands/output. Verify both tips match the report; a moving checkout
is not a review input. Resume the original lens session using its verified address.

The report is: each ID `ADDRESSED` or `NOT ADDRESSED` with evidence; new breakage in
the fix diff with severity; unrelated observations separately. Inspect enough context
to judge real fix interactions, but do not reopen untouched code as an unrestricted
new review. Parent triages unrelated observations without resetting the cycle.

Only the parent routes fixes to implementers. The reviewer's instruction is to
judge the code, never to defend the parent's desired outcome. Do not send "do not
flag" instructions. If the session disappears, its replacement reads the original
brief, reports and open finding IDs; disclose the lost warm context. Preserve the
unit's used round count across reviewer/worker replacements and model fallbacks.
Fanout supplies the initial review plus at most three fix/re-review rounds. For a
standalone continuing cycle, agree and persist the same cap before starting fixes;
without execution approval, return the verdict and wait instead of fixing.

## Verdict and release

Return the owning skill's synthesized verdict and model/lens coverage. PASS retains
its existing meaning, not "all findings fixed". Missing required lenses, unresolved
accepted high/medium findings or failed required checks block fanout acceptance.

In a standalone review, save the synthesized verdict then release owned reviewer
sessions under `herdr-handoff`'s recorded-identity and pane-ownership checks. Keep
warm sessions only for an explicitly requested continuing cycle, or actual blocked
follow-up. In fanout, the commissioning parent releases reviewers after acceptance
and remaining integration checks, or records why blocked sessions must stay available.
Never close unrelated panes, delete a source worktree or offer a second fix loop.

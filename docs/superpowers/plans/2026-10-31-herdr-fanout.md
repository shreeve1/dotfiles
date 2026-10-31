# Herdr Fanout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking. Do not test the unfinished fanout workflow by entrusting implementation to it.

**Goal:** Add optional parent-managed warm herdr workstreams and reviewer sessions, without changing default independent review.

**Architecture:** Fanout coordinates; independent-review owns review policy; herdr-handoff owns session launch and safe integration/release. Small Markdown references carry durable contracts; the existing Bash launcher gains installed-model validation instead of a fixed four-model allowlist.

**Tech Stack:** Markdown skills, existing Bash/jq/herdr/pi CLIs, mocked Bash regression tests; no new dependency.

**Spec:** `docs/superpowers/specs/2026-10-31-herdr-fanout-design.md`

## Global Constraints

- This is optional for written plans and general workstreams; never silently replace Superpowers or the default subagent review mode.
- Parent owns the run ledger, shared artifacts, verification, local merge, worktree/branch cleanup and tab closure.
- Fresh initial reviewers; retain the same reviewer for fix-only follow-ups. Workers and reviewers do not delegate.
- Initial review plus at most three fix/re-review rounds per unit; replacements, fallback and compaction never reset that count.
- Preserve independent-review lens sizing, explicit quick mode, family fallbacks and PASS semantics. Fanout acceptance is stricter than PASS.
- No unresolved accepted high/medium findings, missing required lens or failing required check may pass fanout acceptance.
- No force cleanup, silent discard, automatic push/deploy, unrelated scope growth or retrospective cleanup of existing tabs.
- Preserve concurrent edits; stage only this task's changes. No new dependency, daemon, scheduler or runtime framework.

## Review Focus

- Reviewer replacement after failed delivery must preserve finding identities and the used fix-round count.
- A PASS containing accepted medium findings must remain unaccepted until fixed or evidence-based rejection.
- A warm worker must remain available for a late dependency but be released once no outstanding consumer needs it.
- A combined candidate must not include unreviewed destination movement or edits from a different writer.
- Missing model family/lens, unknown model and partial launch failure must be reported without duplicate sessions or silent degraded acceptance.

These cases are covered by the scenario checks in Task 3 and final review in Task 4.

## Task 1: Support installed reviewer models in the existing launcher

**Files:** Modify `.agents/skills/herdr-handoff/scripts/spawn.sh`; add `tests/herdr-fanout.test.sh`.

**Interfaces**
- Consumes existing `spawn.sh <task|handoff> <brief-path> <slug> <model>` CLI.
- Produces the same CLI/output/recovery behavior, accepting any exact model ID installed under `.providers.cliproxy.models[].id` in the authoritative `~/.pi/agent/models.json`.
- Unknown model, invalid mode, missing/unreadable model file, malformed JSON and invalid model-list structure fail before tab creation with distinct diagnostics naming the path and cause, never configuration contents. No fuzzy matching, alternative discovery source or model fallback in the launcher.

- [ ] Read `herdr-handoff`, `writing-skills` and the launcher in full. Create fixtures in a temporary HOME with mocked herdr/pi environment; never touch real sessions.
- [ ] Add failing tests named `installed-reviewer-model`, `unknown-model-no-tab`, `missing-model-file-no-tab`, `unreadable-model-file-no-tab`, `malformed-model-json-no-tab`, `invalid-model-list-no-tab`, `task-background`, `handoff-focus`, `blocked-exit-2`, and `stalled-prompt-reuses-pane` to `tests/herdr-fanout.test.sh`.
- [ ] Fixture models include `gpt-6-luna` in addition to an existing worker ID. Assert the installed reviewer ID reaches `herdr agent start -- --model cliproxy/gpt-6-luna`; a missing ID exits nonzero before `herdr tab create`. For configuration-error fixtures, assert distinct safe diagnostics and zero tab creation. Use a mocked read failure for the unreadable-file case so the test works even with elevated privileges. Invalid-list fixtures cover an absent/non-array `.providers.cliproxy.models` and entries without string IDs. Assert existing task/handoff focus flags, blocked status exit 2 and one-pane startup recovery remain intact.
- [ ] Run `bash tests/herdr-fanout.test.sh`; expect installed reviewer model to fail against the current hardcoded allowlist, while existing behavior passes.
- [ ] Replace the fixed four-ID `case` validation with explicit file-read, JSON/model-list validation and exact jq model-ID lookup. Require `.providers.cliproxy.models` to be an array whose entries have string IDs. Distinguish configuration failures from a genuinely absent requested ID; keep diagnostics free of file contents. Preserve all quoting, launch/recovery and explicit model selection.
- [ ] Run `bash tests/herdr-fanout.test.sh`; expect all cases passing. Run `style-check .agents/skills/herdr-handoff/scripts/spawn.sh tests/herdr-fanout.test.sh`.
- [ ] Commit the launcher and its tests.

## Task 2: Add optional warm herdr transport to independent review

**Files:** Modify `.agents/skills/independent-review/SKILL.md`; add `.agents/skills/independent-review/references/herdr.md`; extend `tests/herdr-fanout.test.sh`.

**Interfaces**
- Consumes existing lens/model/verdict policy and Task 1's installed-model launcher.
- Produces an explicit transport branch: default subagents unchanged; herdr only when requested or commissioned by fanout.
- Herdr mode accepts commissioning parent/run path, author model families, immutable review inputs, report paths, initial versus fix-check instruction, and release ownership.

- [ ] Read the independent-review skill and lenses. Add structural tests asserting an explicit herdr route before Step 3's default subagent launch and a real referenced herdr file. Watch them fail before editing.
- [ ] Add a short transport selector to the main skill. Default Step 3 remains unchanged; herdr mode follows the new reference instead, never both. Reference its initial-review family constraint, artifact-only writes, finding IDs and retained session identity.
- [ ] Write the reference: one fresh tab per selected lens; use existing lens and model policy; report any implementer-family conflict, unavailable model or degraded lens. Allow writes only to the assigned review-report artifact, not the checkout. Keep fallback and quick-mode limits explicit without duplicating the lens texts.
- [ ] Specify that standalone herdr review synthesizes a verdict then releases owned reviewer tabs unless the user requested a continuing cycle. It still waits for permission to fix. Fanout commissions/reuses the sessions and decides release; a worker's report or reviewer verdict cannot close them.
- [ ] Specify fix-check inputs and output: stable finding IDs, reviewed/fix tips, fix-only diff and updated test evidence; ADDRESSED/NOT ADDRESSED plus new fix breakage, with out-of-scope observations separated. The commissioning run owns the round budget.
- [ ] Extend structural tests for default routing preservation, standalone no-auto-fix, fresh-first/warm-follow-up, family degradation and report-write boundary. Run `bash tests/herdr-fanout.test.sh` and Markdown style-check; expect success.
- [ ] Commit the optional transport and tests.

## Task 3: Add disciplined parent-owned herdr fanout

**Files:** Add `.agents/skills/herdr-fanout/SKILL.md` and `.agents/skills/herdr-fanout/references/contracts.md`; modify only necessary release wording in `.agents/skills/herdr-handoff/SKILL.md`; extend `tests/herdr-fanout.test.sh`.

**Interfaces**
- Consumes an approved plan path or bounded goal, Task 2's herdr review route and existing handoff launch/integration/release contract.
- Produces a unique run directory outside task worktrees, authoritative ledger, scoped briefs/reports and a final evidence/cleanup summary.
- Parent owns run status and release; worker readiness is not acceptance. Reviewer artifacts are writable only in the run directory.

- [ ] Before authoring, run fresh-context baseline scenarios using existing skills. Store scenario inputs, model IDs and exact results in ignored implementation scratch, not as fabricated evidence. Scenarios: early done with dependent work; duplicate update; out-of-order updates (4 before 3); replacement session restarting at sequence 1; shared-index writers; PASS with medium finding; exhausted third fix round; missing reviewer; dirty destination; late missing dependency. Use explicit reviewer model aliases and no live mutation.
- [ ] Add failing structural checks for new skill registration/frontmatter, real references, named states, persistent three-round cap, ownership/release rules and stricter-than-PASS acceptance.
- [ ] Write the concise model-invoked skill with explicit-use trigger and existing `herdr-handoff`/`independent-review` references. Keep broad optionality clear; model invocation does not authorize automatic adoption.
- [ ] Write contracts for ledger fields, worker/reviewer report and sequenced message envelope. Include all eight spec states and non-Git/read-only handling. Parent alone writes shared plan/manifest/memory. Cross-worker updates copy the parent; persist individually handled message IDs keyed by run, recorded sender session identity and sequence; never discard an unseen lower sequence as a duplicate. Handle 4 then 3 exactly once each, and a replacement session's sequence 1 independently of its predecessor's. Reconcile delayed status against current artifacts before changing state; avoid acknowledgement loops.
- [ ] Define concurrency: dependency-ready work only; separate Git worktrees for concurrent writers; serialize shared external changes. On recovery reconcile ledger/live session identity/reports/Git first, reuse valid sessions and never infer failure from timeout alone. Use bounded waits and failed-delivery inspection, not tight polling.
- [ ] Define review placement: parent task checks, then appropriately sized independent combined review. Substantial means independent-review's Large category (200+ changed lines or 5+ files); high-risk means auth/security, migrations/data loss, concurrency or public contract changes. Record risk decision before dispatch. Those runs get one fresh final integration review; small runs reuse their original combined reviewers. Never duplicate full panels over identical diffs.
- [ ] Define each review unit's initial review plus three fix/re-review rounds, retained findings/provenance, no budget reset on replacement, in-scope fix authority, evidence-based rejection and stop-at-cap behavior. Accepted high/medium findings remain blocking; lows may be explicitly deferred. A larger scope change requires approval, not a new hidden budget.
- [ ] Define combined candidate assembly before destination integration, exact tip recording and destination recheck. Reuse handoff's safe merge/removal sequence. Keep workers through remaining dependencies and relevant reviewers through accepted fix checks; archive reports before release. Clarify handoff release waits for the commissioning parent's acceptance.
- [ ] Run the same fresh-context scenarios against the new guidance, compare with baseline and inspect answers manually. Expect correct reuse, each out-of-order message handled once without status regression, replacement-session IDs kept distinct, no premature cleanup, no hidden retry reset, and blocked acceptance for missing review/medium findings. Tighten only failed wording; do not claim structural tests prove agent compliance.
- [ ] Run `bash tests/herdr-fanout.test.sh` and style-check on the touched files; expect success. Commit the skill, contracts, narrow handoff update and tests.

## Task 4: Verify the integrated skill set and capture settled decisions

**Files:** Only necessary fixes from verification; update `memory/preferences/herdr-two-way-collaboration.md`, its `memory/index.md` pointer and relevant `memory/rules.md` pointers.

- [ ] Read all touched files and verify every referenced skill/path exists. Confirm `herdr-fanout` is found by installed `~/.agents/skills` and no default global instruction silently selects it.
- [ ] Check design coverage against Tasks 1–3 and run the new mocked tests. Run `style-check` on touched files and `bash tests/run-all.sh` with adequate timeout; inspect failures. Report any unrelated checker timeout rather than declaring the full suite green.
- [ ] Commission one fresh independent review of the full diff/spec using an explicit different-family reviewer. This is implementation verification, not a live launch of the unfinished workflow. Fix only accepted in-scope findings and verify fixes with bounded re-review.
- [ ] Update existing memory to state approved availability/responsibility, replacing provisional wording and pointing to the owning skills. Avoid copying their procedures. Run `python3 .agents/skills/personal-memory/gate.py --memory memory audit` and commit only owned changes.
- [ ] Report actual checks, behavioral evidence/limits, commits and how to invoke both new modes. Do not push or fleet-sync without a separate request.

## Plan self-review

Spec covered: responsibilities and lifecycle (Task 3); review transport and independence
(Task 2); model-launch mismatch (Task 1); verification and capture (Task 4). No task
requires a new dependency or a scheduler. Cross-task interfaces are existing CLI,
explicit review routing and a file-backed run contract. All five Review Focus cases
are included in scenario checks. The live migration tabs remain outside this work.

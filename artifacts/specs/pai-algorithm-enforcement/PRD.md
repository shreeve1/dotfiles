---
task: "Enforce PAI Algorithm discipline in the Codex port"
slug: 20260428-201017_pai-algorithm-enforcement
effort: standard
phase: complete
progress: 8/8
mode: interactive
started: 2026-04-28T20:10:17Z
updated: 2026-04-28T20:18:00Z
---

## Requested Outcome

The PAI Codex port should not merely document the PAI Algorithm. For
non-trivial planning, design, implementation, and investigation work, Codex
should receive active runtime reminders to create or update a repo-local PRD,
track the algorithm phase, review against criteria, and record durable learning
when useful.

## Current State

The port currently installs PAI skills, agents, instructions, and hooks. The
Algorithm is present in `.codex/AGENTS.md` and session-start context, but the
hook layer is passive: `session-capture.ts` logs prompts/stops and
`work-sync.ts` logs PRD edits. A test session showed that a substantive task can
proceed without a PRD, review, or learning artifact unless the model remembers
the instruction on its own.

## Ideal State Criteria

- [x] ISC-1: User prompts are classified as trivial or substantive with low
  false-positive rules.
- [x] ISC-2: Substantive prompts inject model-visible PAI Algorithm context at
  `UserPromptSubmit`, including PRD-before-build, review, and learn duties.
- [x] ISC-3: Prompt classification and active algorithm state are logged under
  `.codex/pai/MEMORY/state/`.
- [x] ISC-4: Post-edit hooks notice when substantive work edits files without
  touching a PRD/plan and inject a model-visible correction.
- [x] ISC-5: Stop hooks emit valid JSON and log whether the final response
  appears to include review/verification/learning signals.
- [x] ISC-6: Hook tests cover substantive prompt enforcement, trivial prompt
  quiet behavior, post-edit PRD reminders, and stop review logging.
- [x] ISC-7: Existing Atuin hooks, security hooks, skill discovery, and
  voice/notification exclusions remain intact.
- [x] ISC-8: Documentation records that enforcement is a context-injection and
  state-tracking layer, not a separate autonomous agent.

## Scope

In scope:

- `.codex/pai/hooks/session-capture.ts`
- `.codex/pai/hooks/work-sync.ts`
- `.codex/pai/lib/*` helpers as needed
- `.codex/pai/tests/hooks.test.ts`
- `.codex/pai/docs/PORTING.md`
- PAI memory learning note for this workflow failure

Out of scope:

- Re-porting all upstream PAI assets.
- Adding voice, notification, tab-title, or statusline behavior.
- Blocking every edit until a PRD exists. The first pass should inject strong
  model-visible correction and preserve normal Codex tool operation.

## Assumptions

- Codex supports `hookSpecificOutput.additionalContext` for
  `UserPromptSubmit` and `PostToolUse` in the same style already used by this
  port.
- Hook payloads may vary, so classifiers must tolerate missing fields.
- Some repositories may provide a plan path instead of a PRD path; those should
  satisfy the "planning artifact exists" requirement for the active task.

## Risks

- Over-eager classification could add PRD reminders to trivial tasks.
- Under-eager classification could miss substantive work.
- Hooks cannot force the model to edit files; they can only inject context,
  log state, or block. Blocking is deferred to avoid disrupting small fixes.

## Approach

1. Add a small algorithm-state helper with prompt classification and state file
   utilities.
2. Update `session-capture.ts` to inject PAI enforcement context for
   substantive prompts and log active algorithm state.
3. Update `work-sync.ts` to inject a corrective reminder when substantive work
   edits non-plan files before a PRD or plan is touched.
4. Update `Stop` capture to log review/verification/learning signals from the
   final assistant message when available.
5. Extend hook tests and documentation.

## Verification Plan

- Run `bun test ./.codex/pai/tests/hooks.test.ts`.
- Run `bun test ./.codex/pai/tests`.
- Run `bun run .codex/pai/scripts/validate-pai-port.ts`.
- Verify `.codex/hooks.json` remains valid JSON.
- Verify `.codex/config.toml` and generated agent TOML still parse.
- Run exclusion search for voice/notification behavior.

## Implementation Summary

- Added `.codex/pai/lib/algorithm-state.ts` with prompt classification,
  planning-artifact detection, active state persistence, and shared enforcement
  context builders.
- Updated `.codex/pai/hooks/session-capture.ts` so substantive
  `UserPromptSubmit` events inject PAI Algorithm enforcement context and record
  active algorithm state.
- Updated `.codex/pai/hooks/work-sync.ts` so substantive post-edit events
  remind Codex to create/update a PRD or plan when implementation begins first.
- Updated `.codex/pai/docs/PORTING.md` and `.codex/pai/scripts/port-pai.ts`
  so the behavior is documented and survives regenerated port docs.
- Updated `.codex/pai/MEMORY/learning/2026-04-28-pai-loop-enforcement.md`
  with the reusable workflow correction.

## Verification Results

- `bun test ./.codex/pai/tests/hooks.test.ts`: 12 passed.
- `bun test ./.codex/pai/tests`: 29 passed.
- `bun run .codex/pai/scripts/validate-pai-port.ts`: passed.
- `node -e 'JSON.parse(require("fs").readFileSync(".codex/hooks.json","utf8")); console.log("hooks.json ok")'`: passed.
- `python3 -c 'import tomllib, pathlib; tomllib.load(open(".codex/config.toml","rb")); [tomllib.load(open(p,"rb")) for p in pathlib.Path(".codex/agents").glob("pai-*.toml")]; print("toml ok")'`: passed.
- `codex debug prompt-input "PAI Algorithm enforcement check"`: prompt-input diagnostic completed and still includes the PAI Algorithm guidance from AGENTS.
- `git diff --check` on touched files: passed.

## Review

The fix directly addresses the observed failure: the Algorithm is now surfaced
at task time for substantive prompts and again after implementation edits if no
planning artifact has been touched. The hook layer still does not hard-block
edits, by design; this avoids disrupting trivial work while making PRD/review/
learning omissions visible to the model during the same session.

Remaining gap: runtime enforcement depends on Codex hook execution. If hooks are
disabled or unsupported in a session, `.codex/AGENTS.md` and `$pai-core` still
provide guidance, but the new prompt/post-edit injections will not run.

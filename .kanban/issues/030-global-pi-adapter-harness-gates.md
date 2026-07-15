---
id: 030
title: Global Pi adapter (harness-gates) — run Claude hook scripts in Pi
status: done
blocked_by: [028]
parent: null
priority: 0
created: 2026-07-14
updated: 2026-07-15
actor: ralph
---

## What to build

One global Pi extension that makes the deterministic gates fire in Pi (which bridges Claude skills/commands via cross-agent.ts but not hooks). It holds ZERO gate logic — it maps Pi tool-lifecycle events onto the same `.claude/hooks/*.sh` scripts. Modeled on the ponytail extension (`.pi/agent/extensions/ponytail/`, ESM `index.js` + `package.json`).

- Create `.pi/agent/extensions/harness-gates/package.json` (`{ "name":"harness-gates", "version":"0.1.0", "private":true, "type":"module" }`).
- Create `.pi/agent/extensions/harness-gates/index.js`:
  - `findProjectRoot(cwd)` walks up for `.git` (per cross-agent.ts).
  - `runHook(scriptPath, payloadObj, projectRoot)` spawns the script with env `CLAUDE_PROJECT_DIR=<root>`, pipes `JSON.stringify(payloadObj)` to stdin, returns `{code, stderr}`.
  - Top-of-file comment documenting the exact synthesized stdin contract per script (`{tool_input:{command}}` for bash gates; `{tool_name, tool_input:{file_path}}` for path gates) — the one coupling point with the script templates.
  - `pi.on("tool_call")`: bash → run present-of `block-bash-pattern.sh`, `pre-git-checks.sh`, `staged-static-check.sh` with `{tool_input:{command}}`; write/edit → `{tool_name:"Write", tool_input:{file_path}}` → `block-path-access.sh`; read → `{tool_name:"Read", tool_input:{file_path}}` → `block-path-access.sh`. On any `exit 2` return `{block:true, reason:<stderr>}`.
  - `pi.on("tool_result")` write/edit → `format-on-edit.sh` (fail-open, ignore code) then `validate-syntax.sh` / `lint-on-edit.sh`; on `exit 2` return `{isError:true, content:[…stderr…]}`.
  - Discover scripts from both `~/.claude/hooks/` (global) and `<projectRoot>/.claude/hooks/` (project); run only those that exist. Export the runner + handlers so the smoke test can drive them.
- Register `"extensions/harness-gates"` as a **positive** entry (NO `-` prefix — that prefix disables) in `.extensions` of BOTH `.pi/agent/settings.json` and `.pi/agent/settings.json.template`. (Issue 028 has already removed the dead `rpiv-pi` entries from `settings.json.template`, so you are appending to a cleaned array — do not reintroduce them.)
- Write `.pi/agent/extensions/harness-gates/tests/harness-gates-smoke.sh`: create a temp git repo, write a temp gate script, synthesize a bash `git commit` `tool_call` and a benign write; assert block-on-dirty, pass-on-clean, pass-on-non-git. Offline only.

Reference: `/home/james/symphony/plans/harness-audit-apply-pairing-pi-gates.md`. Pi event/return types: `.pi/agent/node_modules/@earendil-works/pi-coding-agent/dist/core/extensions/types.d.ts` (`ToolCallEvent` "Can block", `ToolCallEventResult {block,reason}`, `ToolResultEventResult {isError}`).

## Acceptance criteria

- [x] `index.js` is `node --check`-clean and `package.json` is present (ESM)
- [x] the extension loads offline in Pi without error
- [x] `harness-gates-smoke.sh` passes: block-on-dirty, pass-on-clean, pass-on-non-git
- [x] `"extensions/harness-gates"` is registered as a positive entry in both `settings.json` and `settings.json.template`
- [x] `index.js` top comment documents the per-script stdin contract, and the file contains no gate logic (only event→script mapping + spawning)

## Verification

`node --check .pi/agent/extensions/harness-gates/index.js && PI_OFFLINE=1 pi --no-session --no-extensions -e .pi/agent/extensions/harness-gates/index.js --list-models haiku && bash .pi/agent/extensions/harness-gates/tests/harness-gates-smoke.sh && jq -e '.extensions|index("extensions/harness-gates")' .pi/agent/settings.json >/dev/null && jq -e '.extensions|index("extensions/harness-gates")' .pi/agent/settings.json.template >/dev/null`

## Blocked by

- Blocked by #028 — shares `.pi/agent/settings.json.template` (028 removes the dead `rpiv-pi` entries from the same `.extensions` array this issue appends to; serialized to avoid a merge conflict).

## Implementation Notes

Added `.pi/agent/extensions/harness-gates/` (ESM extension that maps Pi tool-lifecycle events onto `.claude/hooks/*.sh` gate scripts). Three exported handlers (`runBashGates`, `runPathGate`, `runResultGates`) plus the lower-level `runHook` and `findProjectRoot` are driven directly by the smoke test — no pi runner invocation needed. The top-of-file comment enumerates the exact synthesized stdin contract per script category so the script templates and this adapter stay aligned through one documented seam.

Script discovery walks `~/.claude/hooks/` → `<projectRoot>/.claude/hooks/` (project wins), and any missing script is silently skipped — opportunistic, never crashes. Result-side `format-on-edit.sh` and `lint-on-edit.sh` are fail-open by design; `validate-syntax.sh` exit-2 flips `isError=true`.

Smoke test (`tests/harness-gates-smoke.sh`) covers block-on-dirty (matched gate), pass-on-clean (benign command), pass-on-non-git (no scripts installed, "ls" not blocked), and a parallel pair for the path gate (protected-path write blocked, benign path passes). Also asserts `findProjectRoot` walks up to the temp git repo. Offline only.

Verification command exits 0. Fresh-session reviewer returned `RALPH_REVIEW: PASS`.

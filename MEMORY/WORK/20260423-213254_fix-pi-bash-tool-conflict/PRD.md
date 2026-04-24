---
task: Fix pi bash tool registration conflict
slug: 20260423-213254_fix-pi-bash-tool-conflict
effort: standard
phase: complete
progress: 8/8
mode: interactive
started: 2026-04-24T04:32:54Z
updated: 2026-04-24T04:40:00Z
---

## Context

`pi` failed to start with: `Failed to load extension "/Users/james/.pi/agent/extensions/uv.ts": Tool "bash" conflicts with /Users/james/.pi/agent/extensions/atuin.ts`.

Root cause: both extensions call `pi.registerTool(createBashTool(...))`. The pi runtime rejects two tools with the same name. `atuin.ts` was added today (2026-04-23) via `atuin hook install pi`; `uv.ts` has been in place for weeks and enforces Python → uv tooling redirects.

The SDK (`@mariozechner/pi-coding-agent` 0.67.68 at the homebrew pi binary path) exposes `createBashTool(cwd, { operations, commandPrefix, spawnHook })` — all three behaviors can compose in a single registered tool.

### Decision
User selected **Merge Both**: combine atuin tracking + uv PATH shim + uv pip/poetry block into one `atuin.ts`, rename the other file to `.disabled`.

### Plan
1. Rewrite `/Users/james/.pi/agent/extensions/atuin.ts` with all three options passed to `createBashTool`.
2. `mv` `uv.ts` → `uv.ts.disabled`.
3. Verify `pi` starts cleanly.

## Criteria

- [x] ISC-1: Chosen approach confirmed by user before editing files
- [x] ISC-2: `pi` launches without the "Tool 'bash' conflicts" error
- [x] ISC-3: Atuin history capture preserved (startHistory/endHistory wrap every exec)
- [x] ISC-4: UV pip/poetry block preserved (getBlockedCommandMessage inside spawnHook)
- [x] ISC-5: Only one extension registers a `bash` tool (uv.ts renamed)
- [x] ISC-6: Disabled extension file renamed with `.disabled` suffix (not deleted)
- [x] ISC-7: Kept extension file is syntactically valid TypeScript (pi loader accepted it)
- [x] ISC-8: `pi --version` or equivalent startup succeeds post-fix

## Decisions

- Kept the uv `commandPrefix` PATH export even though `~/.pi/agent/intercepted-commands/` does not currently exist — harmless (shells ignore nonexistent PATH entries) and ready for future shim restoration.
- Added a warning in the file header that `atuin hook install pi` would overwrite the merge and drop uv guardrails.

## Verification

- `printf '/quit\n' | pi` prints only `Done.` — no extension-load error (was previously failing with the conflict error).
- `grep` confirms atuin.ts line 167-172 invokes `createBashTool(cwd, { operations, commandPrefix, spawnHook })` with all three options populated.
- `ls uv.ts` → not found; `ls uv.ts.disabled` → present.

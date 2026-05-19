---
description: Manually invoke PiPerspective second-mind review for the active Algorithm session (THINK | PLAN | VERIFY).
agent: build
---

# /pi

Manual entry point for PiPerspective. Resolves the active session's WORK dir via the mode-router, then shells out via `Tools/InvokePi.ts` and renders the verdict inline.

Skill: `.config/opencode/skills/PiPerspective/SKILL.md`

$ARGUMENTS

## Usage

```
/pi <phase> [--diff <path>] [--plan <path>]
```

- `<phase>` — `think`, `plan`, or `verify` (case-insensitive). Required.
- `--diff <path>` — VERIFY only. Path to a diff file. If omitted, `buildVerifyDiff()` generates one from the resolved git toplevel with the Wave 1 size cap (200 KiB default).
- `--plan <path>` — PLAN only. Path to a plan markdown file. Optional.

## Behaviour

1. **Resolve active session slug.** Read `~/.pai/memory/STATE/mode-router.json`. If no slug for the current `sessionID`, error with `/pi requires an active Algorithm session`. Exit non-zero.
2. **Locate WORK dir + ISA.** Compute `~/.pai/memory/WORK/<slug>/ISA.md`. If absent, error and exit.
3. **Phase-specific argument handling:**
   - `THINK` — invoke `bun run .config/opencode/skills/PiPerspective/Tools/InvokePi.ts --phase THINK --isa <isaPath>`.
   - `PLAN` — invoke with `--phase PLAN --isa <isaPath> --plan <planPath>` if `--plan` provided; otherwise just `--isa`.
   - `VERIFY` — generate a diff via `buildVerifyDiff()` (git-toplevel resolution + 200 KiB cap), write to a temp file, invoke with `--phase VERIFY --isa <isaPath> --diff <tempDiffPath>`. If `--diff <path>` is supplied, see security note below.
4. **Path-validate any user-supplied `--diff`:** the resolved absolute path MUST be inside either the active WORK dir (`~/.pai/memory/WORK/<slug>/`) or the resolved git toplevel of the current cwd. Reject paths outside both; exit non-zero with a clear error. This prevents shell-out injection via crafted path traversal.
5. **Render the verdict.**
   - `verdict.verdict === 'REFRAME'` (THINK) → render via `Tools/RenderReframe.ts --isa <isaPath> --verdict <auditPath>`.
   - `verdict.verdict !== 'PASS'` (PLAN) → render via `Tools/RenderPlanDisagreement.ts --plan <planPath> --verdict <auditPath>`.
   - Otherwise → print verdict JSON inline plus a one-line summary.
6. **Exit code** mirrors `Tools/InvokePi.ts`: 0 on PASS/CONCERNS, 1 on FAIL/REFRAME.

## Security model for `--diff`

User-supplied `--diff <path>` is the only attacker-controlled input. Validation:

- Resolve the input to an absolute path.
- Reject if the resolved path is **not** a prefix-match of either:
  - the active WORK dir (`~/.pai/memory/WORK/<slug>/`), OR
  - `git rev-parse --show-toplevel` of the current cwd.
- Reject symlinks that escape the allowed roots (resolve `realpath` and re-check the prefix).
- The diff content itself is read-only; PiPerspective never executes it.

## Outputs

- Verdict JSON written to `~/.pai/memory/WORK/<slug>/pi-perspective/<phase>.json` (numeric suffix on collision, per `InvokePi.ts::writeAudit`).
- Telemetry appended to `~/.pai/memory/WORK/<slug>/pi-perspective-stats.jsonl` (per Wave 3 / ISC-09).
- Rendered markdown printed inline to the chat.

## Errors

| Condition | Exit | Message |
|---|---|---|
| No slug in mode-router state | 2 | `/pi requires an active Algorithm session` |
| Missing ISA at expected path | 2 | `/pi: ISA not found at <path>` |
| `--diff` path outside WORK / repo | 2 | `/pi: --diff path is outside the active WORK dir and git repo; refusing` |
| pi binary version too old | 3 | passthrough from `assertPiVersion` |
| Verdict FAIL or REFRAME | 1 | rendered markdown |
| Verdict PASS or CONCERNS | 0 | rendered markdown / inline JSON |

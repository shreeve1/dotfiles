# Session Capture: Offload omp→pi migration

- Date: 2026-10-13
- Purpose: Review the offload-* skills across omarchy/aidev/itan8n, decide whether omp can be replaced by pi, then execute the approved full migration.
- Scope: machine inventory, offload skill provenance, the omp→pi rename, server pi provisioning, live smoke test, follow-up debt. Excludes the other concurrent session's repo-sync work (referenced by commit SHAs only).

## Durable Facts

- omp ("oh-my-pi", v18.x) is a pi fork — it uses `PI_*` env vars and `~/.omp` mirrors `~/.pi` — so the offload system's omp coupling was narrow (~7 touchpoints), not architectural. Evidence: `omp --help` (PI_SMOL_MODEL etc.), commit `3571e9c4`.
- herdr 0.9.1 (identical on all three machines) natively supports `--kind pi`. Evidence: `herdr agent start --help` possible values.
- The offload skills were untracked in git on all three machines and had drifted (aides/itan8n shared one copy; omarchy's four SKILL.md wrappers were newer). Now tracked since commit `22a77638`; all machines reconciled at `a421a6f2`. Evidence: `git log`, per-machine `git rev-parse HEAD`.
- pi 1.2.0 install state: omarchy `~/.pi/agent/bin`, aidev `~/.npm-global/bin` (installed 2026-10-13; on interactive PATH via `.zshrc`), itan8n upgraded 0.82.1→1.2.0 at `~/.local/bin`. All extension deps installed via `bash install.sh`; live `pi -p` boot probes passed on both servers. Evidence: `docs/pi-extensions.md` (2026-10-13 entries), session commands.
- The omp→pi rename (commit `3571e9c4`): `--kind pi` (worker + controller starts), `OMP_DIR/OMP_BIN/OMP_PID/CONTROL_OMP_PID` → `PI_DIR/PI_BIN/AGENT_PID/CONTROL_AGENT_PID`, `omp --version`/`command -v omp` → pi, scope key `omp_pid` → `agent_pid`, `omp-session` dir → `agent-session` (return_state.py + verify.py consistent), `skill://` URIs → explicit `~/.agents/skills/...` paths (pi has no skill:// scheme), "fresh omp catalog" requirement dropped (pi discovers skills per session). Evidence: commit `3571e9c4` diff.
- Both servers had accumulated 15–17 untracked dirs under `.pi/agent/extensions/` that pi auto-discovers and loads. Two were actively harmful: `gap-review` writes `<project>/.gap-reviews/` (would dirty an offload worktree and break the return/freeze clean-tree gate) and `web-fetch` collides with `rpiv-web-tools` on `web_search`/`web_fetch`. All quarantined to `~/pi-extension-leftovers-20261013/` — deliberately NOT into `extensions-archive/`, where they would collide with tracked archived copies on pull. Evidence: `docs/pi-extensions.md` untracked-leftovers entry.
- Live smoke (2026-10-13, omarchy→itan8n via herdr): `herdr agent start smoke-pi --kind pi` reached interactive readiness, herdr resolved pi's session file, `agent prompt --wait` returned `agent_status: done`, pane showed pi running `echo SMOKE_PI_OK` via its bash tool. Evidence: session command output; smoke workspace `wB` closed after test.
- Pre-existing (reproduces at HEAD, not caused by the rename): 48 pyright strict Optional-access findings in `verify.py` and a full-suite hang in `ReturnLifecycleFixtures` (two different tests hung across runs; each passes individually on both HEAD and edited trees). The rename was validated by targeted tests: `SkillStructureFixtures.test_four_skill_frontmatter_and_local_references`, `ReturnLifecycleFixtures.test_agent_pid_birth_changed_during_member_enumeration_is_not_accepted`, `ReturnLifecycleFixtures.test_applied_without_actual_ack_is_refused_without_outcome`. Evidence: commit `3571e9c4` message, `/tmp/v-head.log`.
- Machine-local model config: aidev `defaultModel: claude-opus-4-8` 400s (pre-existing; `--model gpt-5.6-sol` works — aidev is not a pi offload target until fixed); itan8n `enabledModels` names `deepseek/deepseek-v4-flash` which no provider matches (cosmetic boot warning). Evidence: `pi -p` probes, `docs/pi-extensions.md`.
- Stale smoke-test receipts from the design sessions survive on aidev at `~/offload/return-smoke-57e2578/.git/offload-receipts/` carrying the old `omp_pid` schema and an `omp-session/` attempt dir; they would not validate against the renamed schema. Retained per contract until user-requested cleanup. Evidence: session `grep -rl omp_pid`.

## Decisions

- Replace omp with pi throughout the offload skills (James approved "Full migration"). Evidence: commit `3571e9c4`.
- Quarantine server extension leftovers outside the discovery tree rather than deleting or archiving into `extensions-archive/`. Evidence: `docs/pi-extensions.md`.
- Route the 48 pyright findings and the full-suite hang to the offload-owning workflow as follow-up debt instead of restructuring a passing 120KB test harness mid-migration; the pyright origin is inferred from line/symbol disjointness with the 4-line rename and HEAD provenance (not reproduced — standalone pyright runs basic mode, 0 errors). Evidence: advisor session guidance, commit `3571e9c4` message.

## Evidence

- `.agents/skills/_shared/offload/commands.md` — post-migration dispatch recipe (`--kind pi`, `PI_DIR`, `AGENT_PID`).
- `docs/pi-extensions.md` — 2026-10-13 server sync, quarantine, open model items.
- Commits `22a77638` (skills tracked), `3571e9c4` (omp→pi), `a421a6f2` (doc record).

## Exclusions

- No credentials or machine profile IDs captured.
- The concurrent pi session's commit/rebase work is referenced by SHA only; its content is that session's to capture.
- Full transcript not archived (not requested).

## Open Questions And Follow-Ups

- The "installed-version record" that `commands.md` binds `PI_DIR` from is still unfound; locate it or mark the instruction aspirational.
- The worker prompt still points pi at `pstack-poteto-mode`, whose compatibility notes (`_shared/pstack-omp-compatibility.md`) describe omp session paths and omp-only `/loop`, `/goal` commands — audit that skill for omp-only instructions.
- Wanted: `install.sh` warning on untracked `extensions/*` dirs so leftover accumulation surfaces automatically.
- Full `offload-task` lifecycle (snapshot → Mirror push → freeze → apply → return) not yet exercised with pi — only the dispatch surface was smoke-tested.
- Root-cause the `ReturnLifecycleFixtures` full-suite hang and clear the 48 pyright findings (offload-owning session).
- aidev `defaultModel` fix pending; itan8n `enabledModels` stale deepseek entry pending.

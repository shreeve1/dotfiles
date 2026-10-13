---
title: Offload omp→pi Migration And Server Pi State
type: analysis
status: promoted
created: 2026-10-13
updated: 2026-10-13
promoted: 2026-10-13
sources:
  - wiki/raw/sessions/2026-10-13-offload-omp-to-pi-migration.md
  - .agents/skills/_shared/offload/commands.md
  - .agents/skills/_shared/offload/contract.md
  - docs/pi-extensions.md
confidence: high
tags: [offload, pi, omp, herdr, fleet]
description: The offload skills' worker/controller agent moved from omp (a pi fork) to pi; per-machine pi 1.2.0 state, the narrow rename surface, the untracked-extension quarantine, and what remains unverified.
---

# Offload omp→pi Migration And Server Pi State

The four `offload-*` skills and their shared contract dispatch a fresh coding agent onto a remote machine via herdr panes. Until 2026-10-13 that agent was omp ("oh-my-pi", v18.x); it is now pi. omp turned out to be a pi fork — `PI_*` env vars, `~/.omp` mirroring `~/.pi` — so the swap was a narrow rename, not an architecture change.

## Why the swap was cheap

- All load-bearing machinery (git Mirror transport, secret scan, systemd-scope freeze, cgroup membership, binary `git apply`) is harness-agnostic.
- herdr 0.9.1, identical on all three machines, natively supports `--kind pi`.
- pi reads `.agents/skills/` natively (same lane), so the worker skill flow survived unchanged — only `skill://` URIs had to become explicit `~/.agents/skills/...` paths (pi has no such scheme) and the "fresh omp catalog" requirement was dropped (pi discovers skills per session).

The rename (commit `3571e9c4`): `--kind pi` at both agent starts, `OMP_DIR/OMP_BIN/OMP_PID/CONTROL_OMP_PID` → `PI_DIR/PI_BIN/AGENT_PID/CONTROL_AGENT_PID`, scope key `omp_pid` → `agent_pid`, `omp-session` dir → `agent-session`, kept consistent across `return_state.py` and `verify.py`.

## Per-machine pi state (2026-10-13)

| Machine | pi | Notes |
| --- | --- | --- |
| omarchy | 1.2.0 `~/.pi/agent/bin` | source of truth for the enabled extension set |
| aidev | 1.2.0 `~/.npm-global/bin` | not a pi offload target until `defaultModel: claude-opus-4-8` 400 is fixed (`--model gpt-5.6-sol` works) |
| itan8n | 1.2.0 `~/.local/bin` (upgraded from 0.82.1) | working pi offload target — live herdr `--kind pi` smoke passed end-to-end |

## The untracked-extension trap

Pre-sync servers had accumulated 15–17 untracked dirs under `.pi/agent/extensions/` that pi auto-discovers and loads on every start. `gap-review` writes `<project>/.gap-reviews/` — in an offload worktree that dirties the checkout and breaks the return/freeze clean-tree gate — and `web-fetch` collides with `rpiv-web-tools` on `web_search`/`web_fetch`. Quarantine location matters: outside the discovery tree but NOT in `extensions-archive/` (tracked archived copies there would collide on pull). Both servers were cleaned to exactly omarchy's enabled set; quarantines live at `~/pi-extension-leftovers-20261013/`.

## What is and is not verified

Verified: herdr detects pi readiness in a pane, prompts are accepted and executed with tools (`agent_status: done` on a live itan8n dispatch), the rename passes the suite's targeted tests, all machines are synced at the migration commits. Not verified: a full `offload-task` lifecycle (snapshot → Mirror push → freeze → apply → return) with pi — only the dispatch surface was exercised. Separately, `verify.py` carries 48 pre-existing pyright strict findings and its full-suite run hangs in `ReturnLifecycleFixtures`; both reproduce at HEAD (the hang was not reproduced as a finding set by standalone pyright, which runs basic mode — the pre-existence of the pyright findings is inferred from line/symbol disjointness with the 4-line rename and from the findings' presence in the file as committed).

See [Pi Extensions](/concepts/pi-extensions.md) for the per-machine extension record. Follow-ups: locate the "installed-version record" `PI_DIR` binds from; audit `pstack-poteto-mode`'s omp-era compatibility notes; add an `install.sh` warning for untracked `extensions/*` dirs.

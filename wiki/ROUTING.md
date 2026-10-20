# Wiki Routing

## Pi Default Model Across The Fleet

- Claims: C-0171 (fleet default model is cliproxy/glm-5.3; `.pi/agent/settings.json` is untracked, so the change is applied per machine and only the template travels by git)
- Raw: `wiki/raw/sessions/2026-10-20-pi-default-model-glm-5.3.md`
- Keywords: pi, default model, defaultModel, cliproxy, glm-5.3, settings.json, settings.json.template, gitignored, omarchy, aidev, itan8n
- Claims-only capture; the setting itself is authoritative in `.pi/agent/settings.json` and `.pi/agent/settings.json.template`.

## Fabric Prewalk And Supervisor Probes

- Claims: C-0170 (bounded headless-supervisor non-parity; not a reliability rate)
- Raw: `wiki/raw/sessions/2026-10-18-fabric-prewalk-supervisor-probes.md`
- Keywords: fabric, prewalk, trajectory, supervisor, verify-final, agent_settled, agent_before_settle, RPC, print mode, headless
- No promoted page or rollout decision; claim-only capture of a verified gotcha.

## LLM Wiki Skills

- Pages: `wiki/analyses/analysis-session-wiki-skills-autonomous.md` (promoted)
- Keywords: wiki, llm-wiki-setup, wiki-update, promote, candidate, autonomy, gate, claims

Use this file after reading `wiki/index.md` when narrowing a wiki-backed question to likely branches.

## OpenCode Subagents

- Pages: `wiki/sources/opencode-subagents.md` (promoted)
- Keywords: opencode, subagents, delegation, routing, agents, forge, cato, validator, infra-scout

## RPIV Pipeline Automation

- Pages: `wiki/analyses/rpiv-pipeline.md` (promoted)
- Keywords: rralph, rpiv-monitor, gap-sweep, rpiv-merge, pipeline driver, tmux engine, fresh branch, FRD handoff, .rpiv/artifacts, .rpiv/run, base ref

## ponytail & Wiki Maintenance Gates

- Claims: C-0118 (hot); C-0116, C-0117 moved to `CLAIMS-cold.md` 2026-10-14 (cited the retired Claude Code lane; ponytail itself is now an `.agents/AGENTS.md` bias plus the `ponytail-debt`/`ponytail-gain` skills). (no promoted page yet)
- Raw: `wiki/raw/sessions/2026-06-23-ponytail-and-wiki-gates.md`
- Keywords: ponytail, YAGNI enforcer, vendored, plugin marketplace, pi install, switch-provider, settings provider file, gate.py, CLAIMS.md, eval slice, consolidation

## dsh-board Build Pipeline

- Pages: `wiki/analyses/dsh-board-pipeline.md` (promoted)
- Claims: C-0123..C-0129, all in `CLAIMS-cold.md` since 2026-10-14 (dsh-board archived 2026-09-23; sources now under `archive/dsh-board/`)
- Raw: `wiki/raw/sessions/2026-09-04-dsh-board-loop-fixes.md`
- Keywords: dsh-board, build board, HANDLERS.md, preamble.md, render-jobs.sh, cron tick, stagger, MiniMax 429, agent_teams, captain, captainSessionId, scheduler, composite task, dependent task chain, Build Decompose loop, spec-committed gate, worktree, auto/<card-id>, git merge --ff-only, git-merge-ff, cron_disable override, smart_restart canary

## Omarchy Bare-Metal and Surface Recovery

- Pages: `wiki/analyses/analysis-session-omarchy-bare-metal-and-surface-recovery.md` (promoted)
- Claims: C-0135, C-0136, C-0137, C-0138
- Raw: `wiki/raw/sessions/2026-09-19-omarchy-bare-metal-and-surface-recovery.md`
- Keywords: Omarchy, Hyprland, hypr-deck, workspace, eDP-1, DP-4, Surface Laptop 7, MSHW0551, SAM, BAT1, ADP1, iptsd, SoundWire, UCM, Bluetooth, btintel_pcie, kernel update, bare metal
## Projectlean Wiki-First SOUL

- Pages: `wiki/analyses/analysis-session-projectlean-wiki-first-soul.md` (promoted)
- Raw: `wiki/raw/sessions/2026-09-19-projectlean-wiki-first-soul.md`, `wiki/raw/sessions/2026-09-19-projectlean-soul-final-apply.md`, `wiki/raw/sessions/2026-09-19-projectlean-query-skill-repair.md`
- Keywords: projectlean, SOUL.md, wiki-first, llm-wiki-setup, wiki-update, protected file, prompt-size, template parity, native issue tracking

## Research

- Pages:
- Keywords: external references, articles, papers, transcripts

## Primary Agent Surface: pi in herdr (dsh retired)

- Pages: none; authoritative docs are `AGENTS.md` § Primary agent surface and `docs/herdr.md`
- Claims: C-0164 (dsh retired, herdr+pi primary), C-0165 (pi ignores `.agents/AGENTS.md`), C-0166 (herdr web ui needs a real HTTP proxy), C-0167 (supersedes C-0139)
- Raw: `wiki/raw/sessions/2026-10-16-herdr-primary-dsh-retired.md`
- Keywords: herdr, herdr server, remote-client-bridge, herdr machine list, endpoints.json, herdr web ui, herdr-web-ui, 7443, Caddy, socat, X-Forwarded-Proto, Use controls from this app, dsh retired, dsh-web.service, deepseek harness, primary agent, ~/.pi/agent/AGENTS.md, context files

## Offload

- Pages: `wiki/analyses/analysis-session-offload-omp-to-pi-migration.md` (promoted)
- Keywords: offload, omp, pi, herdr, --kind pi, worker dispatch, freeze, gap-review quarantine, pi-extension leftovers

## T3 Code Providers, SSH Environments And Load Balancing

- Pages: `wiki/analyses/analysis-session-t3-code-pi-provider.md` (promoted)
- Claims: C-0150, C-0151, C-0152, C-0153, C-0160
- Raw: `wiki/raw/sessions/2026-10-14-t3-code-pi-provider.md`, `wiki/raw/sessions/2026-10-14-t3-ssh-load-balancing.md`
- Keywords: t3 code, t3code, T3 Tools, provider, custom provider, pi, PiDriver, builtInDrivers, packages/provider-pi, --mode rpc, settings.json, userdata, v0.0.46, nightly, AcpRegistry, SSH, Add environment, loopback, ServerAlreadyRunningError, service PATH, load balancing, repository identity, github-personal

## tralph, gralph And The .kanban Board

- Pages: `wiki/analyses/analysis-session-tralph-labels-spec-trail.md` (promoted)
- Claims: C-0154, C-0155, C-0156, C-0157 (superseded by C-0172), C-0158, C-0159, C-0172
- Raw: `wiki/raw/sessions/2026-10-14-tralph-labels-spec-trail.md`, `wiki/raw/sessions/2026-10-20-grill-drift-checks.md`
- Decisions: `docs/adr/0024-driver-side-drift-check.md` (driver-side drift check)
- Keywords: tralph, gralph, ralph-loop, board.sh, kanban, triage labels, ready-for-agent, spec, spec-done, spec-check, finish-spec, --replan, failed lane, git add -f, tests gitignored, session breadcrumb, run report, drift check, ralph-drift-check.sh, DRIFT_CHECK, ledger:, grill ledger, to-spec coverage

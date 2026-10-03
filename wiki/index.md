# Wiki Index

## Sources

| Page | Summary | Sources | Updated |
|------|---------|---------|---------|
| `wiki/sources/opencode-subagents.md` | Source summary for OpenCode subagent routing covering task-to-agent mapping, infrastructure chain, parallel patterns, and do-not-delegate rules. | `wiki/raw/opencode-subagents.md` | 2026-10-03 |

## Entities

| Page | Summary | Sources | Updated |
|------|---------|---------|---------|

## Concepts

| Page | Summary | Sources | Updated |
|------|---------|---------|---------|
| `CONTEXT.md`, `docs/adr/0001-verification-two-layers.md` | Two-layer agent-output verification: pi-duo is the cheap constant in-band **grounding gate** (tool-less `completeSimple`, catches false/unsupported claims); a separate on-demand **completeness review** (fresh tooled reviewer, omission-focused prompt) catches material omissions at task boundaries. Grounding failure (false claim) ≠ completeness failure (omission). The `gap-review` extension automates the completeness layer at `turn_end`. | `wiki/raw/sessions/2026-07-21-gap-review-completeness-layer.md`, `.pi/agent/extensions/pi-duo/src/duo-core.ts`, `.pi/agent/extensions/gap-review/index.js` | 2026-07-21 |

## Analyses

| Page | Summary | Sources | Updated |
|------|---------|---------|---------|
| `wiki/analyses/rpiv-pipeline.md` | The `rralph` pipeline driver and its companion skills (rpiv-monitor, gap-sweep, rpiv-merge): pipeline order, default engine, fresh-branch model, file-based cross-engine handoff, and `.rpiv/run/<TS>/.base` base-ref persistence. | `wiki/raw/sessions/2026-06-04-rpiv-pipeline-skills.md`, `bin/rralph` | 2026-06-04 |
| `wiki/analyses/dsh-board-pipeline.md` | dsh-board pipeline mechanics: handlers are agent-prose not code; HANDLERS-live-via-symlink vs preamble-frozen-in-prompts deploy split; the captain-death Build↔Decompose loop and its composite-task fix; spec-committed Decompose gate; fully autonomous ff-only Merge; cron staggering vs 429, cron_disable override persistence, smart_restart latency. | `wiki/raw/sessions/2026-09-04-dsh-board-loop-fixes.md`, `dsh-board/HANDLERS.md`, `dsh-board/preamble.md`, `dsh-board/render-jobs.sh` | 2026-09-04 |
| `wiki/analyses/analysis-session-wiki-skills-autonomous.md` | llm-wiki-setup and wiki-update now run wiki updates and candidate promotion autonomously: same-run verification and promotion via Workflows/Promote.md, no approval questions, sensitive material auto-omitted. | `wiki/raw/sessions/2026-10-03-wiki-skills-autonomous.md`, `.agents/skills/llm-wiki-setup/Workflows/Promote.md`, `.agents/skills/wiki-update/Workflows/SessionUpdate.md` | 2026-10-03 |
| `wiki/analyses/analysis-session-omarchy-bare-metal-and-surface-recovery.md` | Portable Omarchy configuration boundary, Hypr Deck and fixed workspace policy, and the four-part Surface Laptop 7 Intel hardware recovery runbook. | `wiki/raw/sessions/2026-09-19-omarchy-bare-metal-and-surface-recovery.md`, `omarchy/README.md`, `omarchy/HARDWARE-surface-laptop-7.md` | 2026-10-03 |
| `wiki/analyses/analysis-session-projectlean-wiki-first-soul.md` | Portable projectlean SOUL contract, protected installation receipts, and project-native follow-up rule. | `wiki/raw/sessions/{2026-09-19-projectlean-wiki-first-soul.md,2026-09-19-projectlean-soul-final-apply.md}`, `.hermes/{templates/projectlean-soul.md.template,bin/install-projectlean.py,bin/verify-projectlean.py}` | 2026-10-03 |

## Candidate Review Queue

Candidate rows are discoverability aids only; do not treat them as promoted knowledge.

| Candidate | Summary | Sources | Created | Status |
|-----------|---------|---------|---------|--------|

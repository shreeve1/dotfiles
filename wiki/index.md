# Wiki Index

## Sources

| Page | Summary | Sources | Updated |
|------|---------|---------|---------|

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

## Candidate Review Queue

Candidate rows are discoverability aids only; do not treat them as promoted knowledge.

| Candidate | Summary | Sources | Created | Status |
|-----------|---------|---------|---------|--------|
| `wiki/candidates/source-opencode-subagents.md` | Source summary for OpenCode subagent routing covering task-to-agent mapping, infrastructure chain, parallel patterns, and do-not-delegate rules. | `wiki/raw/opencode-subagents.md` | 2026-05-16 | candidate |

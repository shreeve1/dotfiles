# Wiki Log

Append entries with this format:

## [YYYY-MM-DD] type | Title

- Actor: agent or human
- Inputs: paths or prompt summary
- Outputs: changed pages
- Notes: key decisions or unresolved questions

## 2026-05-16 setup | Initialize LLM Wiki

- Actor: PAI
- Inputs: `AGENTS.md`, `README.md`, `.config/opencode/skills/llm-wiki-setup/Workflows/Setup.md`, `.config/opencode/skills/llm-wiki-setup/Templates.md`
- Outputs: `wiki/README.md`, `wiki/index.md`, `wiki/log.md`, `wiki/ROUTING.md`, `wiki/CLAIMS.md`, `AGENTS.md`
- Notes: Domain is PAI dotfiles; initial source types are docs and codebase notes; generated Markdown wiki files should be committed; candidate promotion requires James approval; citation style is inline path citations.

## 2026-05-16 review-fix | Align setup with candidate-gate templates

- Actor: PAI
- Inputs: `dev-review` findings, `.config/opencode/skills/llm-wiki-setup/Templates.md`, `.config/opencode/skills/llm-wiki-setup/Architecture.md`, `.config/opencode/skills/llm-wiki-setup/Workflows/RefactorAgents.md`
- Outputs: `AGENTS.md`, `wiki/README.md`, `wiki/index.md`, `wiki/ROUTING.md`, `wiki/CLAIMS.md`, `wiki/log.md`, `wiki/raw/assets/`
- Notes: Added candidate review queue, discard workflow, raw asset path, key-takeaways gates, candidate-index wording, claim ID convention, index-first routing language, expanded lint checks, and explicit source-specific raw-source git policy.

## 2026-05-16 setup-rerun | Verify existing LLM Wiki setup

- Actor: PAI
- Inputs: `AGENTS.md`, `README.md`, `wiki/`, `.config/opencode/skills/llm-wiki-setup/Workflows/Setup.md`, `.config/opencode/skills/llm-wiki-setup/Workflows/RefactorAgents.md`, `.config/opencode/skills/llm-wiki-setup/Templates.md`
- Outputs: `wiki/log.md`
- Notes: Re-ran setup for the existing wiki, preserved existing wiki content, confirmed required directories and core files are present, confirmed `AGENTS.md` already contains the required LLM Wiki operating rules, and found no approved source files under `wiki/raw/` to ingest.

## 2026-05-16 ingest | Dotfiles README

- Actor: PAI
- Inputs: `README.md`, `wiki/raw/dotfiles-readme.md`
- Outputs: `wiki/raw/dotfiles-readme.md`, `wiki/candidates/source-dotfiles-readme.md`, `wiki/index.md`, `wiki/ROUTING.md`, `wiki/CLAIMS.md`, `wiki/log.md`
- Notes: Ingested the first approved source from the shortlist as an immutable raw snapshot, created a candidate source summary, added candidate routing entries marked non-authoritative, and recorded claims C-0002 through C-0007.

## 2026-05-16 ingest | Core operating rules batch

- Actor: PAI
- Inputs: `AGENTS.md`, `.config/opencode/AGENTS.md`, `.pai/PAI/README.md`, `wiki/raw/dotfiles-agents.md`, `wiki/raw/opencode-agents.md`, `wiki/raw/pai-readme.md`
- Outputs: `wiki/raw/dotfiles-agents.md`, `wiki/raw/opencode-agents.md`, `wiki/raw/pai-readme.md`, `wiki/candidates/source-dotfiles-agents.md`, `wiki/candidates/source-opencode-agents.md`, `wiki/candidates/source-pai-readme.md`, `wiki/index.md`, `wiki/ROUTING.md`, `wiki/CLAIMS.md`, `wiki/log.md`
- Notes: Ingested the next approved source batch as immutable raw snapshots, created three candidate source summaries, added candidate routing entries marked non-authoritative, and recorded claims C-0008 through C-0019.

## 2026-05-16 ingest | Steering and Algorithm doctrine

- Actor: PAI
- Inputs: `.pai/PAI/AISTEERINGRULES.md`, `.pai/PAI/Algorithm/v6.4.0.md`, `wiki/raw/pai-ai-steering-rules.md`, `wiki/raw/pai-algorithm-v6.4.0.md`
- Outputs: `wiki/raw/pai-ai-steering-rules.md`, `wiki/raw/pai-algorithm-v6.4.0.md`, `wiki/candidates/source-pai-ai-steering-rules.md`, `wiki/candidates/source-pai-algorithm-v6.4.0.md`, `wiki/index.md`, `wiki/ROUTING.md`, `wiki/CLAIMS.md`, `wiki/log.md`
- Notes: Ingested steering and Algorithm doctrine as immutable raw snapshots, created two candidate source summaries, added candidate routing entries marked non-authoritative, and recorded claims C-0020 through C-0031.

## 2026-05-16 ingest | Architecture memory and subagent references

- Actor: PAI
- Inputs: `.pai/PAI/PAISYSTEMARCHITECTURE.md`, `.pai/PAI/MEMORYSYSTEM.md`, `docs/reference/opencode-subagents.md`, `wiki/raw/pai-system-architecture.md`, `wiki/raw/pai-memory-system.md`, `wiki/raw/opencode-subagents.md`
- Outputs: `wiki/raw/pai-system-architecture.md`, `wiki/raw/pai-memory-system.md`, `wiki/raw/opencode-subagents.md`, `wiki/candidates/source-pai-system-architecture.md`, `wiki/candidates/source-pai-memory-system.md`, `wiki/candidates/source-opencode-subagents.md`, `wiki/index.md`, `wiki/ROUTING.md`, `wiki/CLAIMS.md`, `wiki/log.md`
- Notes: Ingested architecture, memory, and subagent routing references as immutable raw snapshots, created three candidate source summaries, added candidate routing entries marked non-authoritative, and recorded claims C-0032 through C-0046.

## 2026-05-16 ingest | Skill hook and agent systems

- Actor: PAI
- Inputs: `.pai/PAI/SKILLSYSTEM.md`, `.pai/PAI/THEHOOKSYSTEM.md`, `.pai/PAI/PAIAGENTSYSTEM.md`, `wiki/raw/pai-skill-system.md`, `wiki/raw/pai-hook-system.md`, `wiki/raw/pai-agent-system.md`
- Outputs: `wiki/raw/pai-skill-system.md`, `wiki/raw/pai-hook-system.md`, `wiki/raw/pai-agent-system.md`, `wiki/candidates/source-pai-skill-system.md`, `wiki/candidates/source-pai-hook-system.md`, `wiki/candidates/source-pai-agent-system.md`, `wiki/index.md`, `wiki/ROUTING.md`, `wiki/CLAIMS.md`, `wiki/log.md`
- Notes: Ingested skill, hook, and agent system references as immutable raw snapshots, created three candidate source summaries, added candidate routing entries marked non-authoritative, and recorded claims C-0047 through C-0057.

## 2026-05-16 ingest | Context delegation and CLI architecture

- Actor: PAI
- Inputs: `.pai/PAI/CONTEXT_ROUTING.md`, `.pai/PAI/THEDELEGATIONSYSTEM.md`, `.pai/PAI/CLIFIRSTARCHITECTURE.md`, `wiki/raw/pai-context-routing.md`, `wiki/raw/pai-delegation-system.md`, `wiki/raw/pai-cli-first-architecture.md`
- Outputs: `wiki/raw/pai-context-routing.md`, `wiki/raw/pai-delegation-system.md`, `wiki/raw/pai-cli-first-architecture.md`, `wiki/candidates/source-pai-context-routing.md`, `wiki/candidates/source-pai-delegation-system.md`, `wiki/candidates/source-pai-cli-first-architecture.md`, `wiki/index.md`, `wiki/ROUTING.md`, `wiki/CLAIMS.md`, `wiki/log.md`
- Notes: Ingested context routing, delegation, and CLI-first architecture references as immutable raw snapshots, created three candidate source summaries, added candidate routing entries marked non-authoritative, and recorded claims C-0058 through C-0068.

## 2026-05-16 ingest | Tools notifications and PRD format

- Actor: PAI
- Inputs: `.pai/PAI/TOOLS.md`, `.pai/PAI/THENOTIFICATIONSYSTEM.md`, `.pai/PAI/PRDFORMAT.md`, `wiki/raw/pai-tools.md`, `wiki/raw/pai-notification-system.md`, `wiki/raw/pai-prd-format.md`
- Outputs: `wiki/raw/pai-tools.md`, `wiki/raw/pai-notification-system.md`, `wiki/raw/pai-prd-format.md`, `wiki/candidates/source-pai-tools.md`, `wiki/candidates/source-pai-notification-system.md`, `wiki/candidates/source-pai-prd-format.md`, `wiki/index.md`, `wiki/ROUTING.md`, `wiki/CLAIMS.md`, `wiki/log.md`
- Notes: Ingested tools, notification, and PRD format references as immutable raw snapshots, created three candidate source summaries, added candidate routing entries marked non-authoritative, recorded claims C-0069 through C-0080, and flagged PRD source-of-truth claims as needing reconciliation with current ISA doctrine.

## 2026-05-16 ingest | Actions pipelines and flows

- Actor: PAI
- Inputs: `.pai/PAI/ACTIONS.md`, `.pai/PAI/PIPELINES.md`, `.pai/PAI/FLOWS.md`, `wiki/raw/pai-actions.md`, `wiki/raw/pai-pipelines.md`, `wiki/raw/pai-flows.md`
- Outputs: `wiki/raw/pai-actions.md`, `wiki/raw/pai-pipelines.md`, `wiki/raw/pai-flows.md`, `wiki/candidates/source-pai-actions.md`, `wiki/candidates/source-pai-pipelines.md`, `wiki/candidates/source-pai-flows.md`, `wiki/index.md`, `wiki/ROUTING.md`, `wiki/CLAIMS.md`, `wiki/log.md`
- Notes: Ingested Actions, Pipelines, and Flows framework references as immutable raw snapshots, created three candidate source summaries, added a candidate routing section for Actions Pipelines And Flows, and recorded claims C-0081 through C-0093 with active-development caveats.

## 2026-05-16 ingest | Documentation CLI and extendability

- Actor: PAI
- Inputs: `.pai/PAI/DOCUMENTATIONINDEX.md`, `.pai/PAI/CLI.md`, `.pai/PAI/SYSTEM_USER_EXTENDABILITY.md`, `wiki/raw/pai-documentation-index.md`, `wiki/raw/pai-cli.md`, `wiki/raw/pai-system-user-extendability.md`
- Outputs: `wiki/raw/pai-documentation-index.md`, `wiki/raw/pai-cli.md`, `wiki/raw/pai-system-user-extendability.md`, `wiki/candidates/source-pai-documentation-index.md`, `wiki/candidates/source-pai-cli.md`, `wiki/candidates/source-pai-system-user-extendability.md`, `wiki/index.md`, `wiki/ROUTING.md`, `wiki/CLAIMS.md`, `wiki/log.md`
- Notes: Ingested documentation index, CLI, and SYSTEM/USER extendability references as immutable raw snapshots, created three candidate source summaries, added an Extensibility And Customization routing section, recorded claims C-0094 through C-0105, and substituted this batch after `HowToAskQuestions.md` and `Principles.md` were not found under `.pai/PAI/`.

## 2026-06-04 session-update | RPIV pipeline driver and companion skills

- Actor: Claude Code
- Inputs: current session on the `rpiv-run` pipeline; `bin/rpiv-run`, `.claude/skills/rpiv-monitor/SKILL.md`, `.claude/skills/gap-sweep/SKILL.md`, `.claude/skills/rpiv-merge/SKILL.md`; commits `bfaafaa`, `794a79c`, `edcd3c5`
- Outputs: `wiki/raw/sessions/2026-06-04-rpiv-pipeline-skills.md`, `wiki/candidates/analysis-session-rpiv-pipeline.md`, `wiki/index.md`, `wiki/ROUTING.md`, `wiki/CLAIMS.md`, `wiki/log.md`
- Notes: Captured the RPIV pipeline architecture (pi-default engine, fresh `rpiv/<TS>` branch not a worktree, file-based cross-engine handoff, `.rpiv/run/<TS>/.base` base-ref persistence) and the three companion skills as a curated raw session note plus one candidate analysis page; added a new non-authoritative "RPIV Pipeline Automation" routing section; recorded claims C-0106 through C-0115 (C-0115 marked medium confidence as not yet exercised end-to-end). Excluded the downstream cleon-ui-pi feature merge and pm2 restart as non-durable.

## 2026-06-04 promote | RPIV Pipeline Driver And Companion Skills

- Actor: Claude Code
- Inputs: `wiki/candidates/analysis-session-rpiv-pipeline.md` (candidate from this session's session-update)
- Outputs: `wiki/analyses/rpiv-pipeline.md` (promoted), `wiki/index.md`, `wiki/ROUTING.md`, `wiki/CLAIMS.md`, `wiki/log.md`
- Notes: Promoted the RPIV pipeline analysis candidate into `wiki/analyses/` (status: promoted). Moved the index row from the candidate review queue to the Analyses section, marked the RPIV Pipeline Automation route as promoted/authoritative, and repointed claims C-0106 through C-0115 to the promoted page path. Candidate file removed after the target was verified. The 23 older 2026-05-16 PAI/dotfiles source-summary candidates were intentionally left as candidates per James's scope choice.

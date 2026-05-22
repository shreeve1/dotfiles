---
name: llm-wiki-setup
description: LLM Wiki project setup and maintenance. USE WHEN set up LLM wiki, initialize project knowledge base, compile project knowledge, ingest wiki source, query wiki memory, lint wiki, promote candidate page, or refactor AGENTS.md with wiki workflows.
---

# LLM Wiki Setup

Sets up and operates a Karpathy-style LLM Wiki in the current project: immutable raw sources, LLM-maintained Markdown wiki, persistent index/log files, project `AGENTS.md` workflow integration, plus default implementation extensions for routing, claim provenance, and candidate review gates.

## Workflow Routing

| Trigger | Workflow |
|---------|----------|
| setup LLM Wiki, create project wiki, initialize wiki | `Workflows/Setup.md` |
| refactor AGENTS.md or CLAUDE.md for wiki, add wiki instructions | `Workflows/RefactorAgents.md` |
| ingest source, process raw document | `Workflows/Ingest.md` |
| ask/query wiki, save answer to wiki | `Workflows/Query.md` |
| lint wiki, health-check knowledge base | `Workflows/Lint.md` |
| promote candidate page | `Workflows/Promote.md` |

## Defaults

- Wiki root: `wiki/`
- Raw sources: `wiki/raw/`
- Candidate review gate: enabled by default as a skill extension
- Claim provenance: required for factual claims as a skill extension
- Routing file: `wiki/ROUTING.md` as a skill extension
- Search tooling: document optional local search; do not install without explicit approval
- `AGENTS.md` and `CLAUDE.md`: preserve existing content, refactor lightly, add LLM Wiki operating rules to whichever exist; if neither exists, default to creating `AGENTS.md`
- Post-setup ingestion handoff: perform the first approved ingest when sources are named, otherwise suggest a prioritized ingest shortlist

## Required Interview

Before setup, ask for missing project-specific choices:

- Domain and purpose of the wiki
- Source types expected: docs, papers, meeting notes, codebase notes, articles, images, transcripts
- Whether generated wiki files should be committed to git
- Whether candidate promotion requires James approval or project-owner approval
- Preferred citation style if the project already has one

Use the defaults above when James says to proceed without more customization.

## Execution Rules

- Read the target project's existing `AGENTS.md` and `CLAUDE.md` before modifying them.
- Never delete existing `AGENTS.md` or `CLAUDE.md` rules; preserve and reorganize only when it improves clarity.
- If both `AGENTS.md` and `CLAUDE.md` exist, update both with the LLM Wiki section; keep wording consistent across the two files.
- Treat `wiki/raw/` as immutable source-of-truth input.
- Generated wiki pages must cite raw sources or existing wiki pages.
- New pages and risky updates go through `wiki/candidates/` first.
- Candidate pages must remain discoverable until promoted or discarded.
- Existing pages can be updated directly only when the source impact is clear and cited.
- After setup, do not stop at an empty wiki: either run `Workflows/Ingest.md` for named/approved sources or report a prioritized ingest shortlist with exact source paths or source-selection questions.
- Prefer small, deterministic Markdown files over new infrastructure.
- Do not install qmd, MCP servers, Obsidian plugins, or other tooling without explicit approval.
- Do not initialize a project wiki inside this skill's own install repository unless James explicitly confirms that target.

## Context Files

- Architecture and file contracts: `Architecture.md`
- Page and AGENTS.md templates: `Templates.md`

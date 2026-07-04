---
name: llm-wiki-setup
description: LLM Wiki project setup and maintenance. USE WHEN set up LLM wiki, initialize project knowledge base, compile project knowledge, ingest wiki source, query wiki memory, lint wiki, promote candidate page, or refactor CLAUDE.md with wiki workflows.
---

# LLM Wiki Setup

Sets up and operates a Karpathy-style LLM Wiki in the current project: immutable raw sources, LLM-maintained Markdown wiki, persistent index/log files, project `CLAUDE.md` workflow integration, plus default implementation extensions for routing, claim provenance, and candidate review gates. The promoted wiki is a conformant [Open Knowledge Format (OKF) v0.1](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md) bundle (markdown concepts with `type` frontmatter, per-directory `index.md`, bundle-relative markdown links, `# Citations`), so it is directly consumable by OKF tools while retaining the skill's rigor extensions.

## Workflow Routing

| Trigger | Workflow |
|---------|----------|
| setup LLM Wiki, create project wiki, initialize wiki | `Workflows/Setup.md` |
| migrate existing wiki to OKF, make wiki OKF-conformant | `Workflows/Setup.md` (OKF migration step) |
| refactor CLAUDE.md or AGENTS.md for wiki, add wiki instructions | `Workflows/RefactorAgents.md` |
| ingest source, process raw document | `Workflows/Ingest.md` |
| ask/query wiki, save answer to wiki | `Workflows/Query.md` |
| lint wiki, health-check knowledge base | `Workflows/Lint.md` |
| promote candidate page | `Workflows/Promote.md` |

## Defaults

Initial setup is built for future AI sessions, not for James. Apply defaults silently — do not interview unless James proactively supplies overrides or the setup hits a real ambiguity (existing unrelated `wiki/`, dotfiles install repo as target).

- Wiki root: `wiki/`
- Raw sources: `wiki/raw/`
- Candidate review gate: enabled
- Claim provenance: required for factual claims via `wiki/CLAIMS.md`
- Routing file: `wiki/ROUTING.md`
- Search tooling: documented only; do not install
- Git policy: commit generated wiki files; ignore common raw binary patterns (`wiki/raw/**/*.{pdf,mp4,mov,zip,tar,gz,bin}`, `wiki/assets/**`) without asking
- Candidate promotion approval: James
- Format: OKF v0.1 conformant — `type` frontmatter required on every page, per-directory `index.md`, bundle-relative markdown links (`[Name](/concepts/name.md)`, never `[[wikilinks]]`), external sources under a `# Citations` section
- Citation style: inline path references (`wiki/raw/...`) for source-derived facts; external sources under `# Citations` (OKF §8); cross-page links are bundle-relative markdown links
- Domain: infer from project `README.md`, `CLAUDE.md`, `AGENTS.md`, or top-level docs; if nothing is inferrable, use a generic project-knowledge framing
- `CLAUDE.md` and `AGENTS.md`: preserve existing content, refactor lightly, add LLM Wiki operating rules to whichever exist; if neither exists, create `CLAUDE.md`
- Post-setup ingestion: suggest a prioritized ingest shortlist; do not auto-ingest

## Execution Rules

- Read the target project's existing `CLAUDE.md` and `AGENTS.md` before modifying them.
- Never delete existing `AGENTS.md` or `CLAUDE.md` rules; preserve and reorganize only when it improves clarity.
- If both `CLAUDE.md` and `AGENTS.md` exist, update both with the LLM Wiki section; keep wording consistent across the two files. Do not create a new `AGENTS.md` when `CLAUDE.md` exists.
- Treat `wiki/raw/` as immutable source-of-truth input.
- Generated wiki pages must cite raw sources or existing wiki pages, and must be OKF-conformant: `type` frontmatter, bundle-relative markdown links, `# Citations` section for external sources.
- New pages and risky updates go through `wiki/candidates/` first.
- Candidate pages must remain discoverable until promoted or discarded.
- Existing pages can be updated directly only when the source impact is clear and cited.
- After setup, do not stop at an empty wiki: report a prioritized ingest shortlist with exact source paths. Ingest runs only on a follow-up invocation.
- Prefer small, deterministic Markdown files over new infrastructure.
- Do not install qmd, MCP servers, Obsidian plugins, or other tooling without explicit approval.
- Do not initialize a project wiki inside this skill's own install repository unless James explicitly confirms that target.

## Context Files

- Architecture and file contracts: `Architecture.md`
- Page and agent-instruction templates: `Templates.md`

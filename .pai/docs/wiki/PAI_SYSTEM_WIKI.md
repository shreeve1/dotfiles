---
name: PAISystemWiki
description: Design contract for the derived PAI System Wiki v1.
status: accepted-design
created: 2026-05-13
scope: pai-system-wiki-v1
---

# PAI System Wiki v1

## Purpose

The PAI System Wiki is a derived, LLM-maintained Markdown synthesis layer for PAI system knowledge. It helps agents and James understand PAI architecture, subsystems, concepts, decisions, and source relationships without replacing canonical documentation.

The wiki follows the LLM-wiki pattern: canonical sources remain primary; the generated wiki compiles and maintains durable synthesis, cross-links, indexes, logs, and lint reports.

## Scope

V1 covers PAI system knowledge only.

Included:

- PAI architecture and subsystem documentation.
- The Algorithm and ISA/ISC model.
- Memory, skills, hooks/plugins, agents, delegation, tools, actions, pipelines, and flows.
- OpenCode/Pi/Codex/Claude adapter and shared-harness design docs.
- Architectural decisions discoverable from included source docs.

Excluded from v1:

- Personal life memory.
- General research notes.
- Project-specific wiki generation outside PAI.
- Full global personal knowledge wiki.
- Source-code ingestion as a primary source category.
- Skill corpus ingestion, except as cited references later.

## Authority Model

The PAI System Wiki is derived-only.

Canonical sources remain:

- `pai/PAI/*.md`
- `pai/PAI/Algorithm/*.md`
- `pai/docs/*.md`
- relevant source code and skill files only when explicitly cited as references
- runtime state under `~/.pai/memory/**` only when explicitly included in a future workflow

Generated wiki pages must not supersede, rewrite, or silently mutate canonical source docs.

## Storage Model

System machinery and schemas are tracked in dotfiles:

- `/home/james/dotfiles/.pai/src/wiki.ts`
- `/home/james/dotfiles/.pai/src/cli/pai-wiki.ts`
- `/home/james/dotfiles/.pai/tests/wiki.test.ts`
- `/home/james/dotfiles/.pai/docs/wiki/PAI_SYSTEM_WIKI.md`
- `/home/james/dotfiles/.pai/docs/wiki/page-template.md`
- `/home/james/dotfiles/.pai/docs/wiki/ingest-workflow.md`
- `/home/james/dotfiles/.pai/docs/wiki/lint-rules.md`

Generated wiki state is local-only by default:

- `~/.pai/memory/WIKI/pai-system/index.md`
- `~/.pai/memory/WIKI/pai-system/log.md`
- `~/.pai/memory/WIKI/pai-system/overview.md`
- `~/.pai/memory/WIKI/pai-system/subsystems/`
- `~/.pai/memory/WIKI/pai-system/concepts/`
- `~/.pai/memory/WIKI/pai-system/decisions/`
- `~/.pai/memory/WIKI/pai-system/source-notes/`
- `~/.pai/memory/WIKI/pai-system/lint/`

Generated pages are not committed to dotfiles in v1. A reviewed export path may be reserved, but generated export is deferred.

## Generated Wiki Layout

```text
~/.pai/memory/WIKI/pai-system/
  index.md
  log.md
  overview.md
  subsystems/
  concepts/
  decisions/
  source-notes/
  lint/
```

Directory purposes:

- `index.md`: catalog of generated wiki pages with summaries and metadata.
- `log.md`: append-only ingest, query, and lint history.
- `overview.md`: current top-level synthesis of PAI.
- `subsystems/`: subsystem pages such as Algorithm, Memory, Skills, Hooks, Agents, Tools, Actions, Pipelines, and Flows.
- `concepts/`: cross-cutting concepts such as ISA, ISC, context routing, review-gated memory, and derived state.
- `decisions/`: architectural decisions discovered from source docs.
- `source-notes/`: per-source summaries and provenance.
- `lint/`: structural and semantic maintenance reports.

## Source Set

V1 ingestion includes:

- `.pai/PAI/*.md`
- `.pai/PAI/Algorithm/v6.3.0.md`
- `.pai/docs/*.md`

V1 ingestion excludes by default:

- `.pai/src/*.ts` as primary sources
- `.config/opencode/skills/**/SKILL.md` as primary sources
- runtime memory artifacts
- user personal context beyond system steering files already loaded as PAI system context

Source code and skills can be cited later as implementation references, but they are not part of the initial source corpus.

## Bootstrap Order

Bootstrap should use dependency order from `pai/PAI/doc-dependencies.json` and routing hints from `pai/PAI/CONTEXT_ROUTING.md`.

Initial order:

1. `pai/PAI/README.md`
2. `pai/PAI/PAISYSTEMARCHITECTURE.md`
3. `pai/PAI/Algorithm/v6.3.0.md`
4. `pai/PAI/MEMORYSYSTEM.md`
5. `pai/PAI/SKILLSYSTEM.md`
6. `pai/PAI/THEHOOKSYSTEM.md`
7. `pai/PAI/PAIAGENTSYSTEM.md`
8. `pai/PAI/THEDELEGATIONSYSTEM.md`
9. `pai/PAI/TOOLS.md`
10. `pai/PAI/CLIFIRSTARCHITECTURE.md`
11. `pai/docs/shared-harness-design.md`
12. `pai/docs/*adapter-tracer.md`
13. remaining core docs from `CONTEXT_ROUTING.md` and `doc-dependencies.json`

## Source Identity

Generated wiki metadata uses stable `source_id` values rather than absolute paths.

Source ID rules:

- Dotfiles PAI docs: `pai/PAI/<path>`
- Dotfiles PAI design docs: `pai/docs/<path>`
- Algorithm docs: `pai/PAI/Algorithm/<file>`
- Runtime generated wiki pages: `runtime/WIKI/pai-system/<path>`

The `pai-wiki` CLI resolves `source_id` values to local paths at runtime. Generated pages should not store `/home/james/...` paths in durable metadata.

## Page Naming And Linking

Generated file names use lowercase kebab-case:

- `memory-system.md`
- `ideal-state-artifact.md`

Page titles use human-readable names:

- `# Memory System`
- `# Ideal State Artifact`

Pages may use Obsidian-style wikilinks:

- `[[Memory System]]`
- `[[Ideal State Artifact]]`

Pages should include aliases for acronyms and common synonyms. Example: `ISA` aliases `Ideal State Artifact`; `ISC` aliases `Ideal State Criterion`.

## Page Format

Generated pages use lightweight YAML frontmatter plus fixed body sections.

```markdown
---
type: subsystem | concept | decision | source-note | lint-report | overview
status: current | needs-review | stale | conflict
aliases: []
derived_from:
  - source_id: pai/PAI/MEMORYSYSTEM.md
updated: YYYY-MM-DD
confidence: high | medium | low
---

# Page Title

## Summary
Short durable synthesis.

## Key Claims
- Claim with line-range evidence.

## Relationships
- Links to related wiki pages using [[Page Name]].

## Source Evidence
- `source_id:lines` references.

## Open Questions
- Gaps, ambiguity, or follow-up questions.

## Change Notes
- What changed during the latest ingest.
```

## Provenance Rule

Pages use page-level source IDs in frontmatter and line-range evidence for each important Key Claim.

Example:

```markdown
## Key Claims
- PAI memory stores work artifacts under `~/.pai/memory/WORK/`. Evidence: `pai/PAI/MEMORYSYSTEM.md:41-58`.
- OpenCode and Pi are active shared-memory writers. Evidence: `pai/docs/shared-harness-design.md:3-11`.
```

## Ingest Workflow

V1 uses medium-depth, per-source ingest with lightweight lint.

For each source:

1. Read the selected source.
2. Create or update `source-notes/<source-id>.md`.
3. Extract key claims with source ID and line-range evidence.
4. Update relevant `subsystems/`, `concepts/`, and `decisions/` pages.
5. Update `index.md`.
6. Append to `log.md`.
7. Run deterministic structural lint.
8. Produce an agent-authored semantic lint report or checklist.
9. Write lint output under `lint/`.

The active agent performs semantic synthesis. The CLI enforces paths, structure, validation, dry-run behavior, and deterministic checks.

## Daily Use

The wiki is on-demand. Nothing is auto-injected into prompts; agents and James pull pages explicitly.

Typical retrieval flow:

1. Search to discover candidate pages:

   ```bash
   pai-wiki search "memory system"
   pai-wiki search "atomic action" --json
   ```

2. Read a specific page by relative path, title, or alias:

   ```bash
   pai-wiki read overview.md
   pai-wiki read concepts/action.md
   pai-wiki read "Skill Customization"
   pai-wiki read "Config Audit" --json
   ```

Retrieval contract:

- `read` resolves only within `~/.pai/memory/WIKI/pai-system/`. Paths that escape the wiki root return an `outside-wiki` error.
- `read` accepts a relative file path (`concepts/action.md`), a page title (`Action`), or an alias from frontmatter (`Atomic Action`, `Skill Customization`).
- When `read` cannot resolve the query, it returns a structured `not-found` error with up to five close matches.
- `search` is deterministic and local-only. It scores hits by token overlap against title, aliases, summary, headings, and key claims with weighted fields and returns matched snippets.
- Both commands support `--json` for machine-readable output; without `--json`, `read` prints raw page Markdown and `search` prints a compact hit list.
- Retrieval never edits canonical sources, never writes to the wiki, and never calls an LLM.

Retrieval is the intended integration surface for future ContextSearch wiring; v1 leaves automatic prompt injection out of scope.

## CLI Contract

V1 uses a standalone `pai-wiki` CLI.

Tracked files:

- `.pai/src/wiki.ts`
- `.pai/src/cli/pai-wiki.ts`
- `.pai/tests/wiki.test.ts`
- `.pai/package.json` bin entry for `pai-wiki`
- `.pai/src/index.ts` exports for wiki functions and types

V1 commands:

```bash
pai-wiki sources
pai-wiki plan --source <source_id_or_path>
pai-wiki ingest --source <source_id_or_path> --dry-run
pai-wiki ingest --source <source_id_or_path>
pai-wiki validate
pai-wiki lint
pai-wiki bootstrap --dry-run
pai-wiki read <page-or-alias> [--json]
pai-wiki search <query...> [--json]
```

Command responsibilities:

- `sources`: list known v1 source IDs from `doc-dependencies.json`, `CONTEXT_ROUTING.md`, and `.pai/docs`.
- `plan`: show target generated pages for one source.
- `ingest`: preview or write generated wiki updates for one source.
- `validate`: deterministic structural validation.
- `lint`: deterministic structural lint plus semantic-lint checklist/report scaffold.
- `bootstrap --dry-run`: show dependency-order ingest plan without batch writing.
- `read`: deterministic on-demand retrieval of one wiki page by relative path, title, or alias. Returns Markdown by default, JSON with `--json`, and a structured error with close matches on miss.
- `search`: deterministic local keyword search over titles, aliases, summaries, headings, and key claims. Returns scored hits with snippets; supports `--json`.

Deferred commands:

- `export`
- non-dry-run batch `bootstrap`
- auto-watch
- review queue
- LLM- or embedding-backed search

## Write Model

Ingestion is manual-command driven with dry-run preview.

Non-dry-run `pai-wiki ingest` may write directly to local generated wiki files only after explicit invocation.

Rules:

- Dry-run preview is recommended before writes.
- Non-dry-run writes only under `~/.pai/memory/WIKI/pai-system/`.
- Non-dry-run never edits canonical source docs.
- Non-dry-run appends to `log.md`.
- CLI returns JSON describing created or updated files.
- Validation should run after writes.

## Lint Model

V1 splits lint into deterministic structural checks and agent-authored semantic lint reports.

Deterministic structural checks:

- Missing required frontmatter fields.
- Missing required body sections.
- `derived_from` source IDs cannot be resolved.
- Key Claims without `Evidence:`.
- Broken relative Markdown links where detectable.
- Missing `index.md` entries for generated pages.
- Missing `log.md` entries for ingested sources.
- Orphan pages with no inbound wikilinks.
- Duplicate aliases across pages.

Agent semantic lint checklist:

- Possible contradictions between pages.
- Claims that look stale compared with newer sources.
- Concepts mentioned repeatedly but lacking pages.
- Decisions implied by docs but missing from `decisions/`.
- Open questions that deserve source follow-up.
- Pages that need counterarguments, caveats, or uncertainty notes.

Lint reports live under:

```text
~/.pai/memory/WIKI/pai-system/lint/
  YYYY-MM-DD-structural.md
  YYYY-MM-DD-semantic.md
```

## Portability And Export Policy

V1 keeps generated wiki pages local-only by default.

Tracked dotfiles contain:

- implementation
- CLI entrypoints
- tests
- schemas
- templates
- design docs

Generated local wiki pages are not tracked.

Reviewed export may be added later. Reserve the future path:

```text
/home/james/dotfiles/.pai/docs/wiki/exports/
```

V1 does not implement generated wiki export.

Future export eligibility should require:

- structural lint passing
- semantic lint reviewed
- no unresolved `status: conflict`
- no `confidence: low` pages unless explicitly included
- deterministic sort order
- redaction check
- no absolute local-only paths in exported metadata

## Deferred Features

Deferred beyond v1:

- Global personal wiki.
- Project-local wikis.
- Generated wiki export/sync.
- Query command.
- Source-code primary ingestion.
- Skill corpus primary ingestion.
- Automatic source-change watcher.
- Session-end automatic wiki mutation.
- Review queue for local generated wiki writes.
- Deterministic contradiction detection beyond structural checks.
- Graph database or vector-search integration.

## Implementation Invariants

- Canonical docs remain read-only during wiki ingestion.
- Generated wiki pages stay under `~/.pai/memory/WIKI/pai-system/`.
- System files needed across devices live in dotfiles.
- Device-specific runtime state stays local.
- Generated pages use stable source IDs, not absolute local paths.
- CLI operations return machine-readable JSON by default.
- Dry-run commands must not write generated wiki files.
- Tests must cover source listing, source ID resolution, plan output, dry-run non-writing behavior, validation failures, and local-only path boundaries.

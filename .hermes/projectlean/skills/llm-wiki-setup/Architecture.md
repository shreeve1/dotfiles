# LLM Wiki Architecture

## Purpose

An LLM Wiki compiles raw project knowledge into a persistent, interlinked Markdown knowledge base. It shifts repeated query-time retrieval into accumulated ingest-time synthesis.

## OKF Conformance

The promoted wiki is a conformant [Open Knowledge Format (OKF) v0.1](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md) bundle: a directory of markdown files with YAML frontmatter, per-directory `index.md` files for progressive disclosure, `log.md` update history, standard bundle-relative markdown links as untyped graph edges, and a `# Citations` section at the bottom of each page. This makes any promoted `wiki/` directly consumable by OKF tools (Google's static graph visualizer, other agents) with no translation layer.

OKF standardizes only the interoperability surface. This skill layers rigor extensions OKF deliberately omits — `ROUTING.md`, `CLAIMS.md` + the `gate.py` claim gate, the `candidates/` review gate, and `eval/`. These live in the bundle as OKF-legal extras: OKF requires only a non-empty `type` field per document and mandates that consumers tolerate unknown types, unknown frontmatter keys, and extra files. Governance sidecars carry a descriptive `type` (e.g. `claims-registry`, `routing-index`, `wiki-readme`) so OKF consumers can filter them out of the concept graph.

## Directory Contract

`index.md` (per directory) and `log.md` are OKF reserved filenames and the core Karpathy-style navigation files. `ROUTING.md`, `CLAIMS.md`, and `candidates/` are this skill's default implementation extensions for larger or higher-rigor projects.

```text
wiki/
├── index.md          # OKF root index (bullet listing; carries okf_version)
├── log.md            # OKF update history (ISO date headings)
├── ROUTING.md
├── CLAIMS.md
├── README.md
├── raw/
├── candidates/
│   └── index.md
├── sources/
│   └── index.md
├── entities/
│   └── index.md
├── concepts/
│   └── index.md
├── analyses/
│   └── index.md
└── assets/
```

Every directory holding concept pages carries its own `index.md` (OKF §6 progressive disclosure). The root `index.md` enumerates the subdirectories; each subdirectory `index.md` enumerates its own pages.

## Layer Responsibilities

Raw sources:

- Live under `wiki/raw/`.
- Are immutable after ingest unless James explicitly says otherwise.
- Preserve original filenames when possible.
- Are the source of truth for citations.
- May contain large or binary files; setup must ask whether raw sources are committed, ignored, or stored externally before adding raw-source `.gitignore` rules.

Wiki pages (OKF concepts):

- Are LLM-maintained Markdown artifacts. Each page is one OKF concept; its concept ID is the file path minus `.md` (e.g. `concepts/dispatch-loop`).
- Link to other pages with standard bundle-relative markdown links: `[Concept Name](/concepts/name.md)`. Links begin with `/` (relative to the wiki/bundle root) so they stay stable when a page moves within its subdirectory. A link asserts an untyped relationship; the kind of relationship is conveyed by the surrounding prose, not the link (OKF §5). Do not use `[[wikilinks]]` — they are not OKF-conformant and will not render as edges in an OKF consumer.
- Include YAML frontmatter from `Templates.md`. `type` is the only required field.
- Cite raw sources or external material under a `# Citations` section at the bottom (OKF §8). Cross-links to other wiki pages appear inline in the body, not under Citations.

Schema and operating rules:

- Live in project `CLAUDE.md` under an `LLM Wiki` section; mirror into `AGENTS.md` only if that file already exists.
- Define ingest, query, lint, and promotion workflows for future agents.
- Must be kept short enough to remain useful in every session.

## Core Files

`wiki/index.md` is the OKF root index. Per OKF §6 it carries no concept frontmatter — the only permitted key is `okf_version` (§11), which the root index MAY declare — and lists directory contents as bulleted `* [Title](/path.md) - one-line description` entries grouped under section headings, supporting progressive disclosure. The root index enumerates subdirectories and any root-level pages; it also carries the `candidate review queue` section so unpromoted pages remain discoverable without being treated as authoritative. This `okf_version` declaration is the one place OKF permits frontmatter in an `index.md`. Every concept-bearing subdirectory (`sources/`, `entities/`, `concepts/`, `analyses/`, `candidates/`) has its own `index.md` listing that directory's pages.

`wiki/log.md` is append-only and follows the OKF §7 format: `## YYYY-MM-DD` date headings (newest first), each entry a bullet led by a bold action word (`**Update**`, `**Creation**`, `**Deprecation**`, etc.). Every ingest, query, lint, and promotion appends an entry.

`wiki/ROUTING.md` is a skill extension that maps topic branches to likely pages. It helps agents narrow search after consulting the index.

`wiki/CLAIMS.md` is a skill extension that tracks important atomic claims with citations, kind, confidence, status, impact, and supersession metadata. Its 12-column schema is the contract enforced by the companion `wiki-update` skill's `gate.py`; see `Templates.md` for the columns and rules.

`wiki/candidates/` is a skill extension that holds new or risky pages before promotion. Candidates are discoverable in the index but excluded from authoritative answers unless explicitly referenced.

## Write Policy

Use the candidate review gate by default:

- New entity, concept, source summary, and analysis pages start in `wiki/candidates/`.
- Low-risk maintenance edits to `index.md`, `log.md`, `ROUTING.md`, and `CLAIMS.md` can happen during setup and ingest.
- During ingest, `index.md` must list candidate pages in a candidate review queue, not in promoted-page sections.
- Candidate routes and claim entries must clearly point to `wiki/candidates/...` until promotion.
- Promotion moves a candidate page to its final directory, removes it from the root `index.md` candidate queue and adds it to the destination directory `index.md`, updates `ROUTING.md`, and logs the promotion.
- Discarding a candidate removes its candidate index row, candidate routes, and candidate claim references, then logs the discard.
- If a page contradicts existing wiki knowledge, keep both claims, cite both sources, and mark the contradiction in `CLAIMS.md`.

## Provenance Rules

- Every non-obvious factual claim needs a citation. On a page, external sources supporting body claims are listed under a `# Citations` section at the bottom (OKF §8); the `CLAIMS.md` registry additionally tracks atomic claims with full provenance.
- Claim IDs use the next available zero-padded integer in `C-0001` format by scanning existing `CLAIMS.md` rows and incrementing the maximum ID.
- Prefer citations to `wiki/raw/...` paths for source-derived facts.
- Use existing wiki pages only for synthesized or previously promoted knowledge.
- Record confidence as `high`, `medium`, or `low`.
- Never erase superseded claims; mark them `superseded` with a pointer to the newer claim.

## Optional Tooling

At small scale, `index.md` and `ROUTING.md` are enough. At larger scale, suggest but do not install:

- `qmd` for local Markdown BM25/vector search.
- A simple ripgrep-based search script.
- Obsidian for browsing graph links. Note: Obsidian does not natively parse OKF `index.md`/`log.md` semantics, and the bundle-relative markdown links render as normal links rather than Obsidian's `[[wikilink]]` graph edges. The OKF static HTML visualizer (`reference_agent visualize` in the [knowledge-catalog repo](https://github.com/GoogleCloudPlatform/knowledge-catalog)) renders the concept graph directly from a conformant bundle with no install on the viewing side.
- An MCP server only after the wiki contract stabilizes.

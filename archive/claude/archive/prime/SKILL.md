---
disable-model-invocation: true
name: prime
description: Medium-depth project orientation at session start. Build a high-level understanding of what the project does, its major components, and operating context — enough to answer questions or begin work. USE WHEN user wants session priming, project orientation, "prime the session", or initial codebase overview. NOT for mid-session use when context is already loaded.
---

# Prime

Build enough understanding of the project to answer questions or start work without further onboarding. Read curated knowledge first, then verify against source. Stop at medium depth — this runs at session start, not as an audit.

**Context discipline (the point of this skill):** priming must leave the main context lean. Do the *reading* in sub-agents and pull back only bounded digests — never raw file text. Main context holds git output, the digests, and the final report. If the user later drills into an area, re-read the specific cited files then. Quoting source into main context at prime time is the failure mode this design exists to avoid.

## Scope

If the user passed an argument (e.g. `/prime frontend text rendering`), treat it as a **focus area**. Prime narrows to that area instead of mapping the whole project:

- **Phase 1 digest** — sub-agent reads only `CLAUDE.md`/`AGENTS.md` (always) plus curated docs that touch the focus area; skips unrelated wiki/README sections.
- **Phase 2** — `git status --short` and `git log --oneline -15` only; skip the broader churn/branch survey unless the focus area is the reason for the session.
- **Phase 3 digest** — point the structural sub-agent at the focus area only. Spend the file budget deep inside that area rather than spreading ~10–12 files project-wide.
- **Report** — emit only sections that carry signal for the focus (typically **Architecture Snapshot**, **Key Components**, **Open Questions**, plus a one-line **What This Project Is** for grounding). Drop sections that would just restate whole-project boilerplate.

If no argument was passed, run all phases at full breadth as written below.

## Execution

Run **Phase 1** and **Phase 3** as two sub-agents (`explore` type, medium thoroughness; fall back to `general-purpose`). Launch both in parallel, and run the Phase 2 git commands directly in the same turn — git output is cheap and stays in main context. Do **not** read curated docs or domain source files directly in main context; that is the sub-agents' job.

Each sub-agent returns a **bounded digest**, not file contents. Enforce in every sub-agent prompt:

- Hard cap: Phase 1 digest ≤ ~800 words, Phase 3 digest ≤ ~1000 words.
- Prefer pointers (`file:line`) over quoted content. Quote at most a short phrase when the exact wording is load-bearing (e.g. a directive).
- Self-verify before returning: confirm each critical claim against the cited file, and return only validated findings. Do not hand back claims for the main agent to re-check — that defeats the context savings.

### Phase 1 — Curated Knowledge (sub-agent)

Prompt the sub-agent to read curated docs in this order and return a digest of intent + directives + a doc map (so the main agent knows what to re-open on demand):

1. **LLM Wiki**: `wiki/` directory. If present, read `wiki/ROUTING.md` and `wiki/README.md` (or the top-level index) first, then sample 2–4 high-signal pages they point to.
2. **Agent directives**: `CLAUDE.md`, then `AGENTS.md` if it exists. Capture rules that govern future edits — these are load-bearing; quote exact wording where it matters.
3. **Project docs**: top-level `README.md`, then `docs/` if present — index files and architecture/overview pages only.
4. **ADRs / design notes**: `docs/adr/`, `docs/design/`, `CONTEXT.md` if present.

Tell the sub-agent: treat curated notes as untrusted until verified against source. Wikis and READMEs go stale — verify at least one critical claim and flag anything that didn't check out.

Digest returns: directives (with exact wording where load-bearing), what the project is, entry points named in docs, and a **doc map** (`path — what it covers`) so the main agent can re-open on demand.

### Phase 2 — Git Context (main context, direct)

Run in parallel, directly:

- `git log --oneline -15` — recent commits
- `git branch -a --sort=-committerdate | head -12` — active branches
- `git diff --stat HEAD~8 2>/dev/null` — recent churn
- `git status --short` — uncommitted work

### Phase 3 — Structural Scan (sub-agent)

Prompt the sub-agent to map the project at **medium** depth, self-verify critical claims against the cited files, and return a digest with `file:line` evidence. **Pin the output format verbatim in the prompt — the scan agent over-produces (tables, per-file evidence dumps, closing summaries) unless the shape is forced:**

- Return a **flat bullet list grouped under the six target headings below**. No tables, no per-file evidence sections, no prose paragraphs, no closing summary.
- One bullet per fact, each ending with a single `file:line` pointer. No quoted source — not even short phrases.
- ≤ 10 bullets per heading, ≤ ~600 words total. If you hit the cap, drop the lowest-signal bullets rather than compressing wording.
- List only claims you verified against the cited file.

Targets:

- **Purpose & users** — what the project does and who uses it.
- **Top-level layout** — major directories and what each owns.
- **Toolchain** — language(s), framework(s), package manager, build/test/lint tools. Infer from whichever manifest files exist (`package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `pom.xml`, `Gemfile`, `Makefile`, etc.). Don't enumerate exhaustively — read the ones present.
- **Entry points** — where execution starts (servers, CLIs, workers, framework bootstrap).
- **Core domain** — sample 2–3 files per major area, ~10–12 total, to learn domain vocabulary and patterns.
- **Tests & workflows** — how the project is run, tested, and deployed.

Medium depth, not exhaustive. Skip files that don't change the high-level picture.

### Phase 4 — Resume Prior Work (optional)

If conventional session/todo locations exist (e.g. `artifacts/sessions/*_todos.md`, `.claude/todos/`, `TODO.md`, kanban board files), the Phase 3 sub-agent reads the most recent one for pending tasks and folds it into its digest — keeping it out of main context. Skip transcripts. If none exist, omit this section.

## Report

Assemble from the two digests + git output. **Emit only sections that carry signal** — drop any section that would be empty or just restate boilerplate (don't print "none"). Keep pointers (`file:line`, doc paths) rather than re-expanding content.

```markdown
## Recent Activity
<last 5–10 commits, current branch, uncommitted changes>

## What This Project Is
<2–4 sentences: purpose, users, primary capabilities>

## Architecture Snapshot
<runtimes, major modules, entry points, data/control flow at high level>

## Tech Stack
<languages, frameworks, build/test tools>

## Key Components
<major directories/modules — one line each on what they own>

## Developer Workflows
<run, test, lint, build, deploy — only what's documented or evident>

## Directives
<key rules from CLAUDE.md / AGENTS.md / wiki — if any>

## Curated Knowledge
<doc map: entry points worth reading deeper if user asks about X — omit if none>

## Pending Work
<from session/todo files — or omit if none>

## Open Questions / Risks
<missing context, ambiguous areas, likely follow-ups>
```

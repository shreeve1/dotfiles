---
name: harness-audit
description: "Read-only pair to harness-apply: audit a repo against AI-assisted engineering best practices (harness, context split, skills, specs/ADRs, evals) and emit a fix spec to artifacts/specs/ that /dev-plan auto-discovers, plus a harness gap handoff (per-surface coverage: claude-global / claude-project / pi / missing) for harness-apply to consume. Respectful lens: reads existing CLAUDE.md/CONTEXT.md/docs/adr/ as ground truth, never relitigates a recorded ADR, audits for gaps not overrides. Advisory-only — no hooks, no gates, writes one spec file. Use when user wants to check a project's AI-readiness, audit agent harness/context hygiene, or find what's missing before bringing a repo up to standard."
argument-hint: "[<empty> = current project | <absolute-path>]"
allowed-tools: Agent, Bash, Read, Write, Glob, Grep
# ponytail: Edit omitted (write-only skill — spec is always a new file, never an in-place edit). Allow-list kept explicit because cross-repo audits write outside cwd; the bound is worth the visibility.
# formerly: audit-ai-readiness
---

# Harness Audit (formerly Audit AI-Readiness)

Audit a repo against the principles in Google's *The New SDLC With Vibe Coding* (Osmani et al.), then emit a **fix spec** that `/dev-plan` consumes directly. Advisory-only. Never edits the repo. Never installs hooks or gates. The only side effect is one new spec file under `artifacts/specs/`.

> **The one rule that shapes everything else:** read what the project *declares* about itself first. `CLAUDE.md`, `AGENTS.md`, `CONTEXT.md`, `docs/adr/` are ground truth. **Never relitigate a recorded ADR.** Audit for *gaps*, not overrides. A repo that deliberately chose to be the way it is gets a clean bill on that point.

## Glossary

Use these terms exactly in every finding. Consistent language is the point.

- **Harness** — everything around the model: rules files, tools/MCP, sandboxes, orchestration, hooks, observability. *Agent = model + harness.* Most agent failures are harness (config) failures.
- **Static context** — loaded every turn: system instructions, `CLAUDE.md`/`AGENTS.md`, global memory, core guardrails. Reliable, expensive (paid every call).
- **Dynamic context** — loaded on demand: skills, tool results, RAG docs. Cheap; pay only for what a task touches.
- **Progressive disclosure** — a skill exposes terse metadata at startup, full body on task match, heavy reference only when needed. How one agent carries many skills cheaply.
- **Eval** — graded check on non-deterministic agent behavior. **Output eval** = was the result correct. **Trajectory eval** = was the path (tool calls, reasoning) sound. Distinct from a **test** (deterministic input→output).
- **Gap** — a missing or weak artifact relative to the project's own declared intent + these principles. Not "differs from my preference."

## What gets audited

Four dimensions always. A fifth conditionally. Numbering is this skill's own; article's original numbering shown in parens for cross-reference.

| # | (article) | Dimension | Always? | Core question |
|---|-----------|-----------|---------|---------------|
| 1 | (1) | **Rules file** | yes | Present, scoped to *this* repo, not bloated with generic/reference material? |
| 2 | (2) | **Static/dynamic context split** | yes | Is heavy reference material jammed into always-loaded rules instead of behind a skill/doc link? |
| 3 | (3) | **Skills w/ progressive disclosure** | yes | Task-specific knowledge lives in skills (terse desc → body → reference), not dumped in rules? |
| 4 | (5) | **Specs & ADRs** | yes | Load-bearing decisions recorded? Domain terms in a glossary? |
| 5 | (4) | **Evals** | **conditional** | Only if the repo *ships* an agent/LLM feature. Then: output + trajectory evals exist? |

(Article dimension 6 — model routing/cost — is org/config-level, not a per-repo property. Dropped.)

**Conditional-5 trigger** (renamed from "Conditional-4" to match new numbering). Run the evals check only if the repo ships an agent/LLM feature. Detect any of: `.pi/` or product-level `.claude/` harness; LLM API calls in source (`openai`, `anthropic`, `gemini`, `langchain`, `google.genai` imports); agent/workflow dirs; existing eval files. If none, skip dimension 5 and say so in the report.

## Respectful-lens rules (apply to every dimension)

1. **Ground truth first.** Before flagging anything, read what the project declares. If `CLAUDE.md` explains *why* a rules file is large (e.g. this dotfiles repo documents its canonical surfaces), that bloat is intentional — do not flag it.
2. **ADRs are final.** If `docs/adr/<n>-*.md` records a decision, the audit accepts it. At most, note tension if the *evidence* now contradicts the ADR — never propose reversing it.
3. **CONTEXT.md is the glossary.** Use its terms in findings. If a finding needs a term not in `CONTEXT.md`, propose adding it in the spec — don't invent jargon.
4. **Gaps, not preferences.** Every finding must cite a concrete missing/weak artifact with `file:line` evidence. "Could be nicer" is not a gap.

## Execution

Run **Phase 1** and **Phase 2** as two sub-agents in parallel (`Explore` type, medium thoroughness; fall back to `general-purpose`). Each returns a **bounded digest**, never raw file text. Main thread synthesizes and writes the spec.

### Phase 1 — Ground-truth digest (sub-agent, ≤ 600 words)

Read, in priority order: root `CLAUDE.md` / `AGENTS.md`; `CONTEXT.md` / `CONTEXT-MAP.md`; everything in `docs/adr/`; any `docs/runbooks/` or `README.md` sections that state intent. Return a digest of **what the project declares about itself**:

- Stated purpose and stack.
- Declared conventions (canonical surfaces, naming, structure).
- Recorded decisions (ADR numbers + one-line each).
- Domain terms the glossary defines.
- Anything the docs explicitly say is *intentional* (e.g. "this file is large because…").

This digest is the respectful lens. Every later finding is checked against it.

### Phase 2 — Artifact inventory (sub-agent, ≤ 800 words)

Pure detection, no judgment. Enumerate with sizes/counts and `file:line` pointers:

- **Rules files** — `CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, `.cursor/rules/`, `.github/copilot-instructions.md`, per-directory equivalents. Line counts + a one-line characterization of each (scoped vs generic).
- **Static context size** — total lines of always-loaded rules. Flag any single file over ~300 lines for review (judgment happens in Phase 3, just surface it).
- **Skills** — `.claude/skills/*/SKILL.md`, `.pi/agent/extensions/*/skills/`, `.cursor/skills/`. For each: description length (terse vs dumped) and body length.
- **Specs/ADRs/glossary** — `docs/adr/`, `CONTEXT.md`, `artifacts/specs/`, `specs/`. Counts.
- **Evals (if conditional-4 triggered)** — eval files, eval scripts, golden datasets. Note presence/absence.
- **Conditional-5 trigger result** — did the repo qualify for the evals dimension? List the signals that decided it.

### Phase 3 — Synthesize & write spec (main thread)

Compare Phase 1 (declared intent) vs Phase 2 (actual artifacts) vs the dimension table. Produce findings. Then write the spec.

**Finding format** (severity matches dev-plan's reviewer vocabulary so the handoff reads naturally):

- **Critical** — a dimension is absent or actively harmful (no rules file; agent feature shipped with zero evals; load-bearing decision with no ADR and no glossary term).
- **Warning** — dimension present but weak (rules file bloated with reference material; skills exist but defeat progressive disclosure; glossary missing domain terms).
- **Note** — minor / advisory (could tighten a description; ADR could be split).

Each finding cites: dimension, severity, one-line gap, `file:line` evidence, and the *respectful-lens check* ("does the project's own declared intent already cover this? if yes, downgrade or drop").

### Phase 4 — Write the spec file

**Resolve target dir.** If invoked with an absolute path argument, write into *that* repo's `artifacts/specs/` (the spec must travel with the project `/dev-plan` will run against, not orphan in cwd). If invoked with no argument, write to cwd's `artifacts/specs/`. Create the dir if missing. **Non-clobbering:** filename carries the date (`-<YYYY-MM-DD>`), so re-audits stack rather than overwrite.

Write to `<target>/artifacts/specs/ai-readiness-<reponame>-<YYYY-MM-DD>.md`. Structure:

```markdown
# AI-Readiness Audit: <repo> (<date>)

## Readiness summary
One-line score per dimension audited (Present / Weak / Missing / N/A). State which dimensions were skipped and why (e.g. "Evals: skipped — no agent feature detected").

## Ground truth (from project docs)
3-6 bullets of what the project declares about itself. This section exists so /dev-plan doesn't relitigate settled decisions.

## Findings
Severity-ranked table: | Severity | Dimension | Gap | Evidence (file:line) | Respectful check |

## Fix spec
One `### Phase N: <title>` block per gap cluster. Each block **must carry a requirement tag** `#req-AR<m>` (AR = ai-readiness, m = sequential from 1) so `/dev-plan` threads it into task IDs `[N.M] ... #req-AR<m>` for traceability. Each block:
- **Req tag** — `#req-AR<m>` (stable across the spec; cited by dev-plan tasks).
- **Gap** — what's missing/weak, with evidence.
- **Fix request** — concrete deliverable (a slimmer CLAUDE.md, a new skill, an ADR stub, an eval scaffold).
- **Constraints** — do-not-touch list: recorded ADRs, declared canonical surfaces, intentional bloat. Phrased so dev-plan won't reverse them.
- **Success criteria** — how to verify the fix closed the gap (deterministic where possible: "rules file < N lines", "skill descriptions < 100 chars", "eval suite runs and has ≥ M golden cases").

## Next step
Run `/dev-plan` — it auto-discovers this spec in artifacts/specs/ (its Phase 2 looks there). Do NOT have this skill plan or build the fixes; that is dev-plan → /dev-build's job.
```

### Phase 5 — Report (main thread, chat)

Tell the user, in plain text:
- Output path (absolute).
- One-line readiness score per dimension.
- Count of Critical / Warning / Note.
- The single highest-leverage fix (if any), in one line.
- The next-step line: run `/dev-plan`.

Do not paste the spec into chat. The file is the deliverable.

## What this skill does NOT do

- No hooks. No gates. No `settings.json` edits. No enforcement machinery. (That's `harness-apply`'s job, and the user finds strict enforcement counterproductive — this skill stays advisory.)
- No remediation. It writes a spec; `/dev-plan` + `/dev-build` do the work.
- No ADR creation. If a finding implies a decision worth recording, the spec proposes it as a fix request; recording happens during the build, not here.
- No re-audit loop. One pass, one spec. To re-check after fixes, re-invoke.

## ponytail: known ceilings

- Severity thresholds (300-line rules file, 100-char skill description) are heuristic, not law. Named here so they can be tuned. Upgrade path: derive from actual token cost once a project measures it.
- Conditional-5 detection is import/path string matching. Misses inlined LLM calls or unconventional SDKs. Upgrade path: AST grep for model-call patterns if false negatives appear.
- No automated re-verification after fixes. The spec's success criteria are the contract; confirming them is a later `/dev-test` or manual step.

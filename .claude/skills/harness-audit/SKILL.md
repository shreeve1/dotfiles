---
name: harness-audit
description: "Read-only pair to harness-apply: audit a repo against AI-assisted engineering best practices (harness, context split, skills, specs/ADRs, evals) and emit a fix spec to artifacts/specs/ (implemented directly against its success criteria), plus a harness gap handoff (per-surface coverage: claude-global / claude-project / pi / missing) for harness-apply to consume. Respectful lens: reads existing CLAUDE.md/CONTEXT.md/docs/adr/ as ground truth, never relitigates a recorded ADR, audits for gaps not overrides. Advisory-only — no hooks, no gates, writes one spec file. Use when user wants to check a project's AI-readiness, audit agent harness/context hygiene, or find what's missing before bringing a repo up to standard."
argument-hint: "[<empty> = current project | <absolute-path>]"
allowed-tools: Agent, Bash, Read, Write, Glob, Grep
# ponytail: Edit omitted (write-only skill — spec is always a new file, never an in-place edit). Allow-list kept explicit because cross-repo audits write outside cwd; the bound is worth the visibility.
# formerly: audit-ai-readiness
---

# Harness Audit (formerly Audit AI-Readiness)

Audit a repo against the principles in Google's *The New SDLC With Vibe Coding* (Osmani et al.), then emit a **fix spec** whose `### Phase N` blocks are implemented directly against their stated success criteria. Advisory-only. Never edits the repo. Never installs hooks or gates. The only side effect is one new spec file under `artifacts/specs/`.

> **The one rule that shapes everything else:** read what the project *declares* about itself first. `CLAUDE.md`, `AGENTS.md`, `CONTEXT.md`, `docs/adr/` are ground truth. **Never relitigate a recorded ADR.** Audit for *gaps*, not overrides. A repo that deliberately chose to be the way it is gets a clean bill on that point.

## Glossary

Use these terms exactly in every finding. Consistent language is the point.

- **Harness** — everything around the model: rules files, tools/MCP, sandboxes, orchestration, hooks, observability. *Agent = model + harness.* Most agent failures are harness (config) failures.
- **Static context** — loaded every turn: system instructions, `CLAUDE.md`/`AGENTS.md`, global memory, core guardrails. Reliable, expensive (paid every call).
- **Dynamic context** — loaded on demand: skills, tool results, RAG docs. Cheap; pay only for what a task touches.
- **Progressive disclosure** — a skill exposes terse metadata at startup, full body on task match, heavy reference only when needed. How one agent carries many skills cheaply.
- **Eval** — graded check on non-deterministic agent behavior. **Output eval** = was the result correct. **Trajectory eval** = was the path (tool calls, reasoning) sound. Distinct from a **test** (deterministic input→output).
- **Gap** — a missing or weak artifact relative to the project's own declared intent + these principles. Not "differs from my preference."
- **Gate** — a deterministic hook (Pre/PostToolUse, Stop) that fires in an agent runtime to enforce a build- or edit-time invariant. Cheap, fail-fast, complementary to LLM-side review.
- **Build node** — the points where an agent writes code or commits it (Write/Edit, git commit/push). Gates anchored at the build node are how harness-audit separates "rules and skills look right" from "writes and commits are actually safe."
- **Surface** — a runtime where a gate can fire. This skill audits three: **claude-global** (dotfiles `~/.claude/`), **claude-project** (target repo's `.claude/`), and **pi** (target user's `~/.pi/agent/extensions/harness-gates/` adapter).

## What gets audited

Five dimensions always. A sixth conditionally. Numbering is this skill's own; article's original numbering shown in parens for cross-reference.

| # | (article) | Dimension | Always? | Core question |
|---|-----------|-----------|---------|---------------|
| 1 | (1) | **Rules file** | yes | Present, scoped to *this* repo, not bloated with generic/reference material? |
| 2 | (2) | **Static/dynamic context split** | yes | Is heavy reference material jammed into always-loaded rules instead of behind a skill/doc link? |
| 3 | (3) | **Skills w/ progressive disclosure** | yes | Task-specific knowledge lives in skills (terse desc → body → reference), not dumped in rules? |
| 4 | (5) | **Specs & ADRs** | yes | Load-bearing decisions recorded? Domain terms in a glossary? |
| 5 | (4) | **Evals** | **conditional** | Only if the repo *ships* an agent/LLM feature. Then: output + trajectory evals exist? |
| 6 | — | **Harness gates** | yes | Are deterministic gates present and wired across the three surfaces (Claude global, Claude project, Pi adapter)? Build-node gap named explicitly? |

(Article dimension 6 — model routing/cost — is org/config-level, not a per-repo property. Dropped.)

**Conditional-5 trigger** (renamed from "Conditional-4" to match new numbering). Run the evals check only if the repo ships an agent/LLM feature. Detect any of: `.pi/` or product-level `.claude/` harness; LLM API calls in source (`openai`, `anthropic`, `gemini`, `langchain`, `google.genai` imports); agent/workflow dirs; existing eval files. If none, skip dimension 5 and say so in the report.

**Dimension 6 (Harness gates).** Detect, never enforce. The audit enumerates each gate category listed in `.claude/skills/_shared/harness-gap-handoff.md` (format-on-edit, lint-on-edit, validate-syntax, block-bash-pattern, block-path-access, staged-static-check, pre-git-checks, stop-self-review) and reports per-category coverage against the closed set `{claude-global, claude-project, pi, missing}`. A category whose coverage is `missing` is a Critical finding; a category covered only on one surface while agents routinely run on another is a Warning. The audit hands the per-category coverage block off to `harness-apply` so the apply interview can skip questions already answered. See **Phase 2** below for the three-surface inventory.

## Respectful-lens rules (apply to every dimension)

1. **Ground truth first.** Before flagging anything, read what the project declares. If `CLAUDE.md` explains *why* a rules file is large (e.g. this dotfiles repo documents its canonical surfaces), that bloat is intentional — do not flag it.
2. **ADRs are final.** If `docs/adr/<n>-*.md` records a decision, the audit accepts it. At most, note tension if the *evidence* now contradicts the ADR — never propose reversing it.
2a. **Deliberate removals are ground truth.** If `git log` shows a harness/hooks/gate was *intentionally removed* by the operator (a commit message like "remove .claude harness (operator decision)" or "hooks broke autonomous runs"), treat that like an ADR: do **not** score the now-absent category Critical and do **not** propose restoring it. Emit at most a **tension Note** that (a) cites the removal commit + its stated reason, (b) does not propose reversal, and (c) if a *different* delivery architecture now exists that avoids the original objection (e.g. the global Pi `harness-gates` adapter delivers gates non-blocking / Pi-side, sidestepping a "hooks broke autonomy" removal), names it and flags "confirm with operator before restoring." Absence that a removal rationale never objected to (e.g. `block-path-access` secret protection when the objection was only about blocking pre-commit hooks) may still be a finding, but frame it against the recorded reason. Never let "it was removed" silently bury a safety gap, and never relitigate the removal itself.
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
- **Deliberate removals** — scan `git log --oneline` (and `git log -- .claude/ .pi/` when present) for commits that intentionally removed a harness / hooks / gates. Record the commit hash + stated reason. A documented removal is ground truth (respectful-lens rule 2a): it changes an absent gate from a Critical gap into a tension Note.

This digest is the respectful lens. Every later finding is checked against it.

### Phase 2 — Artifact inventory (sub-agent, ≤ 800 words)

Pure detection, no judgment. Enumerate with sizes/counts and `file:line` pointers:

- **Rules files** — `CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, `.cursor/rules/`, `.github/copilot-instructions.md`, per-directory equivalents. Line counts + a one-line characterization of each (scoped vs generic).
- **Static context size** — total lines of always-loaded rules. Flag any single file over ~300 lines for review (judgment happens in Phase 3, just surface it).
- **Skills** — `.claude/skills/*/SKILL.md`, `.pi/agent/extensions/*/skills/`, `.cursor/skills/`. For each: description length (terse vs dumped) and body length.
- **Specs/ADRs/glossary** — `docs/adr/`, `CONTEXT.md`, `artifacts/specs/`, `specs/`. Counts.
- **Evals (if conditional-5 triggered)** — eval files, eval scripts, golden datasets. Note presence/absence.
- **Conditional-5 trigger result** — did the repo qualify for the evals dimension? List the signals that decided it.
- **Harness gates (Dimension 6)** — read three surfaces and report per-category coverage per `.claude/skills/_shared/harness-gap-handoff.md`:
  - **Claude global** — `~/.claude/hooks/` (dotfiles install layer): which `*.sh` scripts are present (non-empty, executable). Cross-check `<dotfiles>/.claude/settings.json.template` to see which of them are wired.
  - **Claude project** — `<target>/.claude/hooks/`: same script enumeration. Cross-check `<target>/.claude/settings.json` and `<target>/.claude/settings.local.json` for the `hooks` block wiring.
  - **Pi adapter** — `~/.pi/agent/extensions/harness-gates/` directory present AND `extensions/harness-gates` is a positive entry (no `-` prefix) in `~/.pi/agent/settings.json(.template)`. The adapter is a no-op when the dotfiles hooks are missing, so surface that coupling in the report.
  - For each gate category in the shared contract, the digest returns: `coverage: <closed-set value>`, `surface: [<list>]`. A category not implemented on any surface is `coverage: missing`. Single-surface coverage on a category that other agents routinely use is called out as a Warning.

### Phase 3 — Synthesize & write spec (main thread)

Compare Phase 1 (declared intent) vs Phase 2 (actual artifacts) vs the dimension table. Produce findings. Then write the spec.

**Finding format** (Critical / Warning / Note severity so the handoff reads naturally):

- **Critical** — a dimension is absent or actively harmful (no rules file; agent feature shipped with zero evals; load-bearing decision with no ADR and no glossary term; a gate category the agent routinely needs is `missing` across all three surfaces **and** was not deliberately removed — a documented removal downgrades it to a tension Note per respectful-lens rule 2a).
- **Warning** — dimension present but weak (rules file bloated with reference material; skills exist but defeat progressive disclosure; glossary missing domain terms; a gate category is covered on one surface but the agent routinely runs on another).
- **Note** — minor / advisory (could tighten a description; ADR could be split).

Each finding cites: dimension, severity, one-line gap, `file:line` evidence, and the *respectful-lens check* ("does the project's own declared intent already cover this? if yes, downgrade or drop").

**Dimension 6 — build-node gap guidance.** A finding's "build-node gap" phrasing must name the missing anchor and the surface that should carry it. Use these named patterns verbatim so the spec reads as a single vocabulary:

- "build agent writes with no afterWrite format/lint gate" → `format-on-edit` or `lint-on-edit` is `missing` on every surface, or the project has no `PostToolUse` wiring in any of its `settings.json` files.
- "no changed-files static gate before commit" → `staged-static-check` is `missing` everywhere; the project lets `git commit` go through with no lint/typecheck on the diff.
- "gates present in Claude, missing in Pi" → at least one gate category has `coverage: claude-global` or `claude-project` but `pi: false` (the `harness-gates` adapter is absent or disabled, so Pi runs the agent with no deterministic enforcement).
- "gate fires in Pi but scripts are missing on disk" → `pi: true` (adapter installed) but the scripts in `~/.claude/hooks/` are absent or empty, so the adapter is a no-op; the audit should downgrade the apparent `pi` coverage to a Warning.

A finding that does not name the surface, the category, and the missing anchor is not a Dimension-6 finding and is not actionable.

**Picking `recommended_scope`.** Universal, stack-agnostic gates (`block-bash-pattern`, `block-path-access`, `format-on-edit`, `stop-self-review`) lean `global` — they are safe in every repo and skip-arm when a tool is absent. Gates bound to the repo's own commands or stack posture (`pre-git-checks`, and any `staged-static-check` / `lint-on-edit` / `validate-syntax` needing a non-default posture) lean `project`. See `.claude/skills/_shared/harness-gap-handoff.md` → **Scope layering** for the full heuristic and how global/project compose across multiple repos.

### Phase 4 — Write the spec file

**Resolve target dir.** If invoked with an absolute path argument, write into *that* repo's `artifacts/specs/` (the spec must travel with the project it describes, not orphan in cwd). If invoked with no argument, write to cwd's `artifacts/specs/`. Create the dir if missing.

**Non-clobbering filename.** A date-only name collides when two audits run the same day (a re-audit, or two agents auditing in parallel — the second silently overwrites the first). Base name is `<target>/artifacts/specs/ai-readiness-<reponame>-<YYYY-MM-DD>.md`; **before writing, if that path already exists, append a `-<HHMMSS>` suffix** (`ai-readiness-<reponame>-<YYYY-MM-DD>-<HHMMSS>.md`) so runs stack rather than overwrite and still sort by day. Write to that resolved path. Structure:

```markdown
# AI-Readiness Audit: <repo> (<date>)

## Readiness summary
One-line score per dimension audited (Present / Weak / Missing / N/A). State which dimensions were skipped and why (e.g. "Evals: skipped — no agent feature detected").

## Ground truth (from project docs)
3-6 bullets of what the project declares about itself. This section exists so whoever implements the fix doesn't relitigate settled decisions.

## Findings
Severity-ranked table: | Severity | Dimension | Gap | Evidence (file:line) | Respectful check |

## Harness gap handoff
# Generated by: harness-audit
# Consumed by:   harness-apply (skips any interview question whose gate category is already covered)
# Schema:        v1, per .claude/skills/_shared/harness-gap-handoff.md

surfaces_present:
  claude_global: <true|false>
  claude_project: <true|false>
  pi: <true|false>

gates:
  - category: format-on-edit
    coverage: <claude-global|claude-project|pi|missing>
    surface: [<list>]

  - category: lint-on-edit
    coverage: <...>
    surface: [<list>]

  - category: validate-syntax
    coverage: <...>
    surface: [<list>]

  - category: block-bash-pattern
    coverage: <...>
    surface: [<list>]

  - category: block-path-access
    coverage: <...>
    surface: [<list>]

  - category: staged-static-check
    coverage: <...>
    surface: [<list>]

  - category: pre-git-checks
    coverage: <...>
    surface: [<list>]

  - category: stop-self-review
    coverage: <...>
    surface: [<list>]

recommended_scope: <project|global>

## Fix spec
One `### Phase N: <title>` block per gap cluster. Each block **must carry a requirement tag** `#req-AR<m>` (AR = ai-readiness, m = sequential from 1) for traceability. Each block:
- **Req tag** — `#req-AR<m>` (stable across the spec).
- **Gap** — what's missing/weak, with evidence.
- **Fix request** — concrete deliverable (a slimmer CLAUDE.md, a new skill, an ADR stub, an eval scaffold, a gate script, a Pi adapter registration).
- **Constraints** — do-not-touch list: recorded ADRs, declared canonical surfaces, intentional bloat. Phrased so the implementer won't reverse them.
- **Success criteria** — how to verify the fix closed the gap (deterministic where possible: "rules file < N lines", "skill descriptions < 100 chars", "eval suite runs and has ≥ M golden cases", "gate script is non-empty and wired in <surface> settings.json", "harness-gates entry is positive in `~/.pi/agent/settings.json`").

## Next step
These are two **independent** paths into different parts of this spec — not a sequence. Neither requires the other; run whichever you need.

- **To install the harness gates → run `/harness-apply <scope>`** with the value from `## Harness gap handoff` → `recommended_scope` above. It consumes the handoff block directly and writes the gate scripts.
- **To close the non-gate fixes** (evals scaffold, doc trims, ADR stubs — the `### Phase N` blocks) **→ implement each Phase directly against its stated success criteria.** These blocks already carry the deliverable, constraints, and success criteria; implement them in a focused session (reach for a heavier planning pass only if a fix turns out to be cross-cutting or ambiguous). Do NOT have *this* skill implement them — it stays advisory.
```

### Phase 5 — Report (main thread, chat)

Tell the user, in plain text:
- Output path (absolute).
- One-line readiness score per dimension.
- Count of Critical / Warning / Note.
- The single highest-leverage fix (if any), in one line.
- The two independent next-step doors: `/harness-apply <scope>` to install the gates, and/or implement the non-gate `### Phase N` fixes directly against their success criteria.

Do not paste the spec into chat. The file is the deliverable.

## What this skill does NOT do

- No hooks. No gates. No `settings.json` edits. No enforcement machinery. (That's `harness-apply`'s job, and the user finds strict enforcement counterproductive — this skill stays advisory.)
- No remediation. It writes a spec; the non-gate `### Phase N` fixes are implemented separately (directly against their success criteria).
- No ADR creation. If a finding implies a decision worth recording, the spec proposes it as a fix request; recording happens during the build, not here.
- No `harness-apply` invocation. This skill **emits** the `## Harness gap handoff` block (per `.claude/skills/_shared/harness-gap-handoff.md`) so `harness-apply` can **consume** it and skip its interview; the user runs `harness-apply` separately. Detect-and-hand-off only, still no apply.
- No re-audit loop. One pass, one spec. To re-check after fixes, re-invoke.

## ponytail: known ceilings

- Severity thresholds (300-line rules file, 100-char skill description) are heuristic, not law. Named here so they can be tuned. Upgrade path: derive from actual token cost once a project measures it.
- Conditional-5 detection is import/path string matching. Misses inlined LLM calls or unconventional SDKs. Upgrade path: AST grep for model-call patterns if false negatives appear.
- No automated re-verification after fixes. The spec's success criteria are the contract; confirming them is a later `/dev-test` or manual step.

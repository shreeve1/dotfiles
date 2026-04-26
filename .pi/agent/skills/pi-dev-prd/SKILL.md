---
name: pi-dev-prd
description: Create a lean, buildable Product Requirements Document from a raw idea, note, or brainstorming session through phased interviewing, light research, and structured requirement capture. Use when the user wants to turn an idea into a PRD, spec, product brief, or developer-ready requirements document before planning or coding — even if asked casually like "help me think this through", "write a PRD", or "turn these notes into something buildable".
---

# Create a Product Requirements Document

> **Canonical paths (MANDATORY):** Read `~/.pi/agent/skills/PATHS.md` before any file output. All artifact paths in this skill resolve through that reference. Deviation is a bug — surface it instead of working around it.

Use this skill when the user has an idea, rough notes, or an early concept and wants a structured PRD that a human or AI coding agent can build from with minimal guessing. Do not use it when the user already wants an implementation plan, active coding, or pure open-ended brainstorming with no intent to produce a concrete artifact.

---

## Variables

- `IDEA_INPUT` — the user's idea, notes, or file path
- `SLUG` — kebab-case feature name derived from `IDEA_INPUT` (e.g. `recipe-app`, `paperclip-replacement`); no date suffix. See `PATHS.md` for slug rules.
- `OUTPUT_DIR` — `artifacts/specs/${SLUG}/`
- `PRD_FILE` — `artifacts/specs/${SLUG}/PRD.md`
- `DRAFT_FILE` — `artifacts/specs/${SLUG}/.prd-draft.json`
- `CURRENT_DATE` — today's date in `YYYY-MM-DD` form, obtained with `bash`

---

## Workflow Overview

Work through these phases in order:

1. Derive the slug and prepare the session
2. Capture the idea and gather source context
3. Define the vision, problem, and target user
4. Research the landscape and validate the opportunity
5. Define features, stories, and scope boundaries
6. Choose a technical direction and constraints
7. Generate the PRD, validate it, save it, and report the result

Keep the document lean. The goal is not a corporate requirements packet; it is a buildable spec with enough clarity for downstream planning and implementation.

---

## Phase 0 — Derive Slug and Prepare the Session

If the user did not provide an idea, use `ask_user` to collect one.

**Derive the slug** from `IDEA_INPUT`:
- Strip articles ("the", "a", "an") and auxiliary words.
- Lowercase, replace spaces with hyphens, drop non-alphanumeric chars.
- Examples: "Recipe management app" → `recipe-app`. "Replace paperclip" → `paperclip-replacement`.
- If resuming a draft, read `slug` from the existing `DRAFT_FILE` instead of re-deriving.

Confirm the slug with `ask_user` if it's non-obvious.

Use `bash` to ensure the output directory exists:

```sh
mkdir -p "artifacts/specs/${SLUG}"
```

Then check whether `DRAFT_FILE` already exists and is recent enough to resume. Use `bash` for the existence and age check. If a recent draft exists, ask the user with `ask_user` whether to resume or start fresh.

When resuming:
- use `read` to inspect the draft file
- restore any captured context you can trust
- continue from the next incomplete phase rather than restarting the whole interview

If starting fresh, treat the current user request as the source of truth.

---

## Phase 1 — Gather Source Context

Determine whether `IDEA_INPUT` is free text or a file path.

**File path:** use `read` to load it as primary source material.

**Free text:** look for likely source documents in the canonical input locations:

1. Use `bash` to list markdown files recursively under `artifacts/notes/` and `artifacts/brainstorming/`, sorted by modification time (newest first).
2. If one or more likely source documents exist, present the most relevant 1–3 options with `ask_user`.
3. Let the user choose: use one, use multiple, ignore them, or specify a different file.

After confirmation, use `read` to inspect the selected source documents and incorporate their content into the PRD context.

---

## Phase 2 — Vision, Problem, Target User

Capture the foundational framing before getting into features.

Use `ask_user` (one focused question at a time) to elicit:

- **Vision** — one sentence describing the desired end state.
- **Problem statement** — what's broken / missing / inefficient today.
- **Target user** — who specifically uses this and in what context.

If the source material already answers these, present a draft answer and ask the user to confirm or revise rather than asking from scratch.

After each phase, persist progress to `DRAFT_FILE` so the session can be resumed.

---

## Phase 3 — Research the Landscape

Use `bash` (curl, web fetch via the agent's tools) to do a light competitive scan only when the request implies a market context. For internal tools or replacements of existing systems, skip this phase or limit it to identifying the existing system being replaced.

Capture:
- **Competitors / prior art** — 2–5 examples with one-line summaries.
- **Differentiation** — what makes this distinct or how it diverges from existing approaches.

Keep this section short. The goal is grounding, not a market report.

---

## Phase 4 — Features, Stories, Scope

Decompose the product into concrete features. Use `ask_user` to drive this iteratively.

For each feature capture:
- **`#req-<kebab-id>`** — stable requirement tag for downstream traceability (e.g., `#req-user-login`).
- **User story** — "As a <user>, I want <capability>, so that <outcome>."
- **Priority** — `Must Have` | `Should Have` | `Out of Scope`.
- **Acceptance criteria** — 1–4 specific, verifiable conditions.

Group features into:
- **Must Have** — required for v1.
- **Should Have** — desired but cuttable.
- **Out of Scope** — explicitly deferred (this list prevents scope creep downstream).

If the feature count exceeds ~8 or the scope spans multiple weeks of work, note that `pi-dev-epic` will be needed to decompose this PRD into epic-level mini-PRDs before planning.

---

## Phase 5 — Technical Direction

Capture the technical context that downstream planning needs:

- **Tech Stack** — language, framework, runtime, key libraries (if known).
- **Data Model** — high-level entities and relationships.
- **Key Interfaces** — APIs, CLI surface, UI surface.
- **Third-Party Integrations** — services this depends on (auth, payments, storage, etc.).
- **Project Structure** — directory layout if non-obvious.
- **Constraints** — deadlines, budget, regulatory, performance.

If the user can't answer some of these yet, capture them as Open Questions rather than guessing.

---

## Phase 6 — Generate, Validate, Save

Generate the PRD using the format below, validate completeness, save it to `PRD_FILE`, and report.

### PRD Format

```md
---
slug: <slug>
date: <CURRENT_DATE>
status: Draft
scope: <Single-feature | Multi-feature | Multi-week | Ongoing>
---

# PRD: <Product Name>

## Vision
<one sentence>

## Problem Statement
<2-4 sentences>

## Target User
<persona + context subsection>

## Competitive Landscape
<optional; 2-5 short bullets>

## User Stories & Features

### Must Have
- **#req-<id>** — <user story>
  - <acceptance criterion>
  - <acceptance criterion>

### Should Have
- **#req-<id>** — <user story>
  - <acceptance criterion>

### Out of Scope
- <explicit non-goal>
- <explicit non-goal>

## Technical Requirements

### Tech Stack
<bullets>

### Data Model
<bullets or short prose>

### Key Interfaces
<bullets>

### Third-Party Integrations
<bullets>

### Project Structure
<directory tree if useful>

## Success Metrics
- <measurable outcome>
- <measurable outcome>

## Acceptance Criteria
<top-level criteria across all features>

## Open Questions
- <unresolved decision>
- <unresolved decision>

## Requirement Tags

| Tag | Feature | Priority |
|-----|---------|----------|
| #req-<id> | <name> | Must Have |
| #req-<id> | <name> | Should Have |

## Next Step

If `Scope` is `Multi-week` or `Ongoing`, or there are 9+ `#req-*` tags, hand off to `pi-dev-epic` to decompose this PRD before planning. Otherwise hand off directly to `pi-dev-plan` with this PRD path.
```

### Validation before save

Use `read` after writing to verify:
1. `PRD_FILE` exists at `artifacts/specs/${SLUG}/PRD.md`
2. Frontmatter contains `slug:` matching `${SLUG}`
3. At least one Must-Have feature with a `#req-*` tag
4. No date suffix on the slug or filename (e.g., `recipe-app-2026-04-26.md` is wrong)

### Save

Use `write` to save the PRD to `PRD_FILE`. Then delete the `DRAFT_FILE` (the draft is consumed) using `bash`.

---

## Report

```text
✅ PRD Created

Slug:       <slug>
File:       artifacts/specs/<slug>/PRD.md
Scope:      <scope line>
Features:   <count> Must-Have, <count> Should-Have, <count> Out of Scope
Tags:       <#req-id-1>, <#req-id-2>, ...

Next step:
  <`pi-dev-epic artifacts/specs/<slug>/PRD.md`> if multi-week / 9+ features
  <`pi-dev-plan artifacts/specs/<slug>/PRD.md`> if single-epic
```

---

## Notes

- **Lean over comprehensive.** Aim for a PRD a developer can build from, not a corporate requirements packet.
- **`#req-*` tags are sacred.** They flow through `pi-dev-epic` → `pi-dev-plan` → `pi-dev-build` → `pi-dev-test` for traceability. Never invent or rename them downstream.
- **One feature per `#req-*` tag.** If a feature is multi-faceted, split into multiple tags.
- **Slug stability.** Once chosen, the slug is permanent — it names the directory in `artifacts/specs/`, `artifacts/plans/`, and downstream artifacts. Don't rename.

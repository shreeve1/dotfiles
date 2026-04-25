---
name: dev-prd
description: Go from a raw idea to a structured PRD document through guided interview phases
argument-hint: [your idea in a few words]
model: opus
hooks:
  Stop:
    - hooks:
        - type: command
          command: >-
            uv run ~/.claude/hooks/validators/validate_new_file.py
            --directory artifacts/specs
            --extension .md
        - type: command
          command: >-
            uv run ~/.claude/hooks/validators/validate_file_contains.py
            --directory artifacts/specs
            --extension .md
            --contains '# PRD:'
            --contains '## Problem Statement'
            --contains '## User Stories'
            --contains '## Technical Requirements'
            --contains '## Acceptance Criteria'
            --contains '## Requirement Tags'
---

# Purpose

Transform a raw idea into a structured, AI-agent-actionable Product Requirements Document through a guided multi-phase interview process. Designed for vibe coders who need lean, buildable specs — not bloated corporate documents.

> Inspired by Harper Reed's LLM codegen workflow: conversational brainstorming produces a developer-ready spec that captures requirements, architecture, and testing plans.

## Variables

IDEA: $ARGUMENTS — The raw idea or concept to develop into a PRD
OUTPUT_DIR: `artifacts/specs/`
DRAFT_FILE: `artifacts/specs/.prd-draft.json`
CURRENT_DATE: !`date +%Y-%m-%d`

## Setup

Before starting Phase 1:

1. **Ensure output directory exists:**
   ```
   mkdir -p artifacts/specs
   ```

2. **Check for resume-able session:**
   - If `DRAFT_FILE` exists and is < 24 hours old, ask user if they want to resume
   - If resuming, load the draft state and continue from `phase_completed + 1`

## Source Document Discovery

If IDEA appears to be a file path (contains `/` or ends in `.md`), read that file as starting context.

If IDEA is free text, check for existing context that could inform the PRD:

1. Search for relevant files in common locations:
   - `artifacts/notes/` — User notes and scratchpads
   - `artifacts/brainstorming/` — Brainstorming session outputs
   - `artifacts/specs/` — Existing PRDs or specs

2. If files are found, use AskUserQuestion:
   ```
   AskUserQuestion:
   - question: "Found existing notes/docs. Use any as starting context?"
     multiSelect: true
     options: ["<filename1>", "<filename2>", "None - start fresh"]
   ```

3. Read selected files and incorporate their content into the PRD context.

## Session Persistence

After completing each phase, save interim state to `DRAFT_FILE`:

```json
{
  "idea": "<original idea>",
  "phase_completed": 2,
  "vision": "<captured vision statement>",
  "problem_statement": "<draft problem>",
  "target_user": "<user persona>",
  "features": ["<list of features>"],
  "timestamp": "<ISO date>"
}
```

This enables:
- Resuming interrupted PRD sessions
- Recovering from crashes or timeouts
- Continuing work in a new conversation

## Progress Tracking

Display progress at the start of each phase:

```
PRD Progress: Phase X/5 — <Phase Name>

  Completed:
  ✓ Vision statement
  ✓ Problem statement
  ...

  Current: <current phase goal>
  Next: <next phase name>
```

## Checklist
You MUST create a task for each of these items and complete them in order:
1. **Capture idea and vision** — acknowledge IDEA, invoke interview skill, and write clear vision statement
2. **Deep-dive problem and users** — spawn parallel research agents for competitive landscape, target users, and technical feasibility
3. **Define features and user stories** — brainstorm features with user, write user stories with GIVEN/WHEN/THEN acceptance criteria
4. **Design technical architecture** — spawn research agents for stack and architecture, define technical requirements
5. **Generate and save PRD** — produce complete PRD document following format, validate completeness, save to OUTPUT_DIR

## Instructions

IMPORTANT: If no IDEA is provided, ask the user to describe their idea before proceeding.

This command walks through 5 phases, interviewing the user at each stage to progressively refine a vague idea into a concrete, buildable PRD. Use the **AskUserQuestion** tool for structured decisions and the **Skill** tool to invoke the `interview` skill for deep-dive questioning.

The PRD must be lean and actionable — optimized for AI coding agents (Claude Code, Cursor, etc.) to implement from. Every section should answer: "Can a developer (human or AI) build from this without guessing?"

## Workflow

### Phase 1: Idea Capture & Vision (The Spark)

**Goal:** Understand the raw idea and the person behind it.

1. **Acknowledge the idea** — Restate IDEA back to the user in your own words to confirm understanding.

2. **Invoke the interview skill** for deep-dive questioning:
   ```
   Use the Skill tool to invoke "interview" with args: "PRD exploration for: <IDEA>"
   ```

   Pass context to the interview:
   - The IDEA as the primary topic
   - Any discovered source document content
   - Context that this is for PRD generation (structured requirements, not open-ended exploration)

   The interview should cover:
   - What problem does this solve? Who has this problem?
   - What's the user's motivation? (scratching own itch, market opportunity, learning project?)
   - Does anything like this exist? What's different about this approach?
   - What does "done" look like in the simplest version?

3. **Use AskUserQuestion** for key decisions:
   ```
   AskUserQuestion:
   - question: "What type of project is this?"
     options: ["Web app", "Mobile app", "CLI tool", "API/Backend service"]
   - question: "What's your target scope for v1?"
     options: ["Weekend project (MVP)", "1-2 week sprint", "Multi-week build", "Ongoing product"]
   ```

4. **Capture the vision statement** — Write a single clear sentence: "This is a [type] that helps [who] do [what] by [how]."

5. **Save draft state** to `DRAFT_FILE` with `phase_completed: 1`

### Phase 2: Problem & User Deep-Dive (The Why)

**Goal:** Validate the problem is real and define who you're building for.

1. **Spawn 3 research agents in parallel** using the Task tool to gather context:

   Launch all 3 in a SINGLE message with these specific subagent types:

   - **Agent 1 (Competitive Landscape):** Use `web-searcher` subagent to search for existing solutions, competitors, and alternatives. What's already out there? What gaps exist?
   - **Agent 2 (Target User Research):** Use `web-searcher` subagent to research the target user persona. What are their pain points, workflows, and existing tools?
   - **Agent 3 (Technical Feasibility):** Use `Explore` subagent to research technical approaches, relevant APIs, frameworks, and libraries that could be used. Search both the web and any existing codebase context.

2. **Synthesize research** — Present findings to user as a brief summary.

3. **Use AskUserQuestion** to refine based on research:
   ```
   AskUserQuestion:
   - question: "Based on this research, what's your primary differentiator?"
     options: ["Simpler UX", "Better performance", "Unique feature set", "Niche audience"]
   - question: "Which user persona resonates most?"
     options: [persona1, persona2, persona3, "None - let me describe"]
   ```

4. **Define the problem statement** — A clear, specific description of the problem this solves. If the user can't articulate the problem, the PRD isn't ready.

5. **Save draft state** to `DRAFT_FILE` with `phase_completed: 2`

### Phase 3: Feature Definition & User Stories (The What)

**Goal:** Define what gets built in concrete, testable terms.

1. **Brainstorm features** with the user using AskUserQuestion:
   ```
   AskUserQuestion:
   - question: "I've identified these potential features. Which are must-haves for v1?"
     multiSelect: true
     options: [feature1, feature2, feature3, feature4]
   ```

2. **Write user stories** in the format:
   > As a [user type], I want to [action] so that [benefit].

   For each must-have feature, create 1-3 user stories.

3. **Define acceptance criteria** for each user story using the GIVEN/WHEN/THEN format:
   > GIVEN [context], WHEN [action], THEN [expected result].

4. **Use AskUserQuestion** to prioritize:
   ```
   AskUserQuestion:
   - question: "How should we prioritize? MoSCoW method:"
     options: ["Must have (ship-blocking)", "Should have (important)", "Could have (nice)", "Won't have (future)"]
   ```

5. **Explicitly define what's OUT of scope** — This prevents scope creep and is critical for vibe coders who can get pulled into rabbit holes.

6. **Save draft state** to `DRAFT_FILE` with `phase_completed: 3`

### Phase 4: Technical Architecture & Constraints (The How)

**Goal:** Define the technical approach without over-engineering.

1. **Spawn 2 research agents in parallel** for technical decisions:

   Launch both in a SINGLE message with these specific subagent types:

   - **Agent 4 (Stack Research):** Use `web-searcher` subagent to research optimal tech stack choices based on the features defined. Consider the user's stated scope and experience.
   - **Agent 5 (Architecture Patterns):** Use `Explore` subagent to research architecture patterns for this type of application. Focus on patterns that work well with AI coding agents.

2. **Present technical options** using AskUserQuestion:
   ```
   AskUserQuestion:
   - question: "Recommended tech stack approach?"
     options: [option1_with_rationale, option2_with_rationale, option3_with_rationale]
   ```

3. **Define technical requirements:**
   - Data model / key entities
   - API endpoints or key interfaces
   - Third-party integrations needed
   - Infrastructure / deployment approach
   - Key technical constraints or non-negotiables

4. **Define the file/folder structure** if applicable — AI coding agents work best when they know the target project structure upfront.

5. **Save draft state** to `DRAFT_FILE` with `phase_completed: 4`

### Phase 5: Validation & Output (The Ship)

**Goal:** Produce the final PRD document and validate it's buildable.

1. **Generate the PRD** using the PRD Format below.

2. **Run the PRD Completeness Checklist** (validate internally):
   - [ ] Problem statement is specific and testable
   - [ ] Target user is clearly defined
   - [ ] Each feature has user stories with acceptance criteria
   - [ ] Technical approach is defined but not over-specified
   - [ ] Scope boundaries (in/out) are explicit
   - [ ] A developer could start building from this without asking questions
   - [ ] Success metrics are measurable
   - [ ] v1 scope is achievable within the stated timeframe

3. **Present the PRD summary** to the user and ask for final approval:
   ```
   AskUserQuestion:
   - question: "PRD is ready. How would you like to proceed?"
     options: ["Save as-is", "I want to revise a section", "Run /dev-epic to decompose into mini-PRDs (recommended if Scope is Multi-week/Ongoing or feature count > 8)", "Run /dev-plan to create implementation plan", "Run /dev-build to start building"]
   - question: "Solo or team workflow?"
     options: ["Solo (/dev-plan + /dev-build)", "Team (/dev-plan + /dev-build with teams)"]
   ```

   **Routing rule:** if the PRD's `Scope:` is `Multi-week` or `Ongoing`, OR the combined Must-Have + Should-Have feature count exceeds 8, recommend `/dev-epic` as the top option. Otherwise recommend `/dev-plan` directly.

4. **Save the PRD** to `OUTPUT_DIR/prd-<kebab-case-name>-CURRENT_DATE.md`

5. **Clean up draft file** — Delete `DRAFT_FILE` after successful save

## Output Format

```md
# PRD: <Product Name>

**Date:** <date>
**Author:** <user> + Claude
**Status:** Draft
**Scope:** <Weekend MVP | Sprint | Multi-week | Ongoing>

## Vision

<One-sentence vision statement: "This is a [type] that helps [who] do [what] by [how].">

## Problem Statement

<2-3 sentences describing the specific problem. Who has it? How painful is it? What do they do today?>

## Target User

<Primary persona description: who they are, what they care about, their context>

### User Context
- **Technical level:** <non-technical | beginner | intermediate | advanced>
- **Usage frequency:** <daily | weekly | occasional>
- **Key frustration:** <the core pain point>

## Competitive Landscape

| Solution | Strengths | Gaps |
|----------|-----------|------|
| <existing1> | <what it does well> | <what's missing> |
| <existing2> | <what it does well> | <what's missing> |

**Our differentiator:** <what makes this different>

## User Stories & Features

Tag each major requirement with a unique `#req-[kebab-case-id]` anchor (e.g., `#req-user-login`, `#req-data-export`). These tags enable traceability through `/dev-plan`, `/dev-validate`, and `/dev-test`.

### Must Have (v1)

#### Feature: <Feature Name> #req-<kebab-case-id>
**User Story:** As a <user>, I want to <action> so that <benefit>.

**Acceptance Criteria:**
- GIVEN <context>, WHEN <action>, THEN <result>
- GIVEN <context>, WHEN <action>, THEN <result>

<repeat for each must-have feature, each tagged with a unique #req-[id]>

### Should Have (v1 stretch)
<features that are important but not ship-blocking, tagged with #req-[id]>

### Out of Scope (v1)
<explicitly listed features that are NOT in v1>

## Technical Requirements

### Tech Stack
- **Frontend:** <choice + brief rationale>
- **Backend:** <choice + brief rationale>
- **Database:** <choice + brief rationale>
- **Hosting:** <choice + brief rationale>

### Data Model
<key entities and their relationships — keep it simple>

### Key Interfaces
<API endpoints, CLI commands, or UI screens — whatever is relevant>

### Third-Party Integrations
<any external services, APIs, or libraries required>

### Project Structure
```
<suggested file/folder structure>
```

## Success Metrics

<How do we know this worked? 2-4 measurable outcomes>

- <metric 1>
- <metric 2>

## Acceptance Criteria

<Top-level criteria for the entire product — when is v1 "done"?>

1. <criterion 1>
2. <criterion 2>
3. <criterion 3>

## Open Questions

<Anything still unresolved that needs answers before or during build>

## Requirement Tags

| Tag | Feature | Priority |
|-----|---------|----------|
| #req-<id> | <Feature Name> | Must Have |
| #req-<id> | <Feature Name> | Should Have |

<Summary of all #req-[id] tags used in this document for downstream traceability>

## Next Step

- If `Scope:` is `Multi-week`/`Ongoing` OR feature count > 8: run `/dev-epic <this PRD>` first to decompose into per-epic mini-PRDs, then `/dev-plan` per mini-PRD.
- Otherwise: run `/dev-plan <this PRD>` directly to create an implementation plan.

The plan (or each mini-PRD's plan) will automatically pick up `#req-[id]` tags from this document for traceability.
```

## Interaction Guidelines

- **Be conversational, not corporate** — This is a brainstorming partner, not a requirements committee
- **Use AskUserQuestion** for all decision points — Don't just output questions as text
- **Push back on vagueness** — "What do you mean by 'good UX'?" is a valid question
- **Keep it lean** — If a section doesn't add value for THIS project, skip it
- **Favor concrete over abstract** — "Users can sign in with email" beats "Authentication system"
- **Challenge scope creep** — If the user keeps adding features, remind them of their stated scope
- **Think like a builder** — Every line should help someone (human or AI) actually build this

## Validation

The PRD is complete when:
1. The file exists at `OUTPUT_DIR/prd-<name>-<date>.md`
2. All required sections are present and filled in (not placeholder text)
3. Each must-have feature has at least one user story with acceptance criteria
4. The problem statement is specific enough to be falsifiable
5. A developer could start building without asking "but what should happen when...?"

## Report

After saving the PRD:

```
PRD Complete

  File:       artifacts/specs/prd-<name>-<date>.md
  Product:    <product name>
  Scope:      <scope level>

  Session Stats:
  - Interview rounds: <count>
  - Decisions made: <count>
  - Research agents spawned: <count>

  Research Summary:
  - Competitive: <1-2 sentence summary>
  - User Research: <1-2 sentence summary>
  - Technical: <1-2 sentence summary>

  Features:
  - Must Have: <count>
  - Should Have: <count>
  - Out of Scope: <count>

  Completeness:
  - Problem defined:     ✓
  - Users identified:    ✓
  - Stories written:     <count>
  - Tech stack chosen:   ✓
  - Acceptance criteria: ✓

  Requirement Tags: <count> #req-[id] tags

  Next Step: /dev-epic (if multi-epic) OR /dev-plan (if single-epic) to create implementation plan
  Full Pipeline: /dev-prd > [/dev-epic] > /dev-plan > [/dev-shard] > /dev-validate > /dev-build > /dev-test > /dev-review
```

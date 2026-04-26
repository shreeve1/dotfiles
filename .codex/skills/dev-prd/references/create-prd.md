# CreatePrd Workflow


## Contents

- [Variables](#variables)
- [Setup](#setup)
- [Source Document Discovery](#source-document-discovery)
- [Session Persistence](#session-persistence)
- [Progress Tracking](#progress-tracking)
- [Checklist](#checklist)
- [Instructions](#instructions)
- [Phase 1: Idea Capture & Vision (The Spark)](#phase-1-idea-capture-vision-the-spark)
- [Phase 2: Problem & User Deep-Dive (The Why)](#phase-2-problem-user-deep-dive-the-why)
- [Phase 3: Feature Definition & User Stories (The What)](#phase-3-feature-definition-user-stories-the-what)
- [Phase 4: Technical Architecture & Constraints (The How)](#phase-4-technical-architecture-constraints-the-how)
- [Phase 5: Validation & Output (The Ship)](#phase-5-validation-output-the-ship)
- [Validation](#validation)
- [Interaction Guidelines](#interaction-guidelines)
- [Report](#report)

Transform a raw idea into a structured, AI-agent-actionable Product Requirements Document through a guided multi-phase interview process. Designed for vibe coders who need lean, buildable specs — not bloated corporate documents.

## Variables

- `IDEA` — The raw idea or concept to develop into a PRD (from user arguments)
- `OUTPUT_DIR` — `artifacts/specs/{slug}/`
- `DRAFT_FILE` — `artifacts/specs/{slug}/.prd-draft.json`
- `CURRENT_DATE` — Run `date +%Y-%m-%d` to get today's date

## Setup

Before starting Phase 1:

1. **Ensure output directory exists:**
   ```bash
   mkdir -p "artifacts/specs/${SLUG}"
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

2. If files are found, use ask the user:
   ```
   ask the user:
   - question: "Found existing notes/docs. Use any as starting context?"
     multiSelect: true
     options: ["<filename1>", "<filename2>", "None - start fresh"]
   ```

3. read selected files and incorporate their content into the PRD context.

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
  [check] Vision statement
  [check] Problem statement
  ...

  Current: <current phase goal>
  Next: <next phase name>
```

## Checklist

You MUST create a task for each of these items and complete them in order:

1. **Capture idea and vision** — acknowledge IDEA, invoke interview skill, and write clear vision statement
2. **Deep-dive problem and users** — research competitive landscape, target users, and technical feasibility
3. **Define features and user stories** — brainstorm features with user, write user stories with GIVEN/WHEN/THEN acceptance criteria
4. **Design technical architecture** — research stack and architecture, define technical requirements
5. **Generate and save PRD** — produce complete PRD document following format, validate completeness, save to OUTPUT_DIR

## Instructions

IMPORTANT: If no IDEA is provided, ask the user to describe their idea before proceeding.

This workflow walks through 5 phases, interviewing the user at each stage to progressively refine a vague idea into a concrete, buildable PRD. Use the **ask the user** tool for structured decisions and the **Skill** tool to invoke the `interview` skill for deep-dive questioning.

The PRD must be lean and actionable — optimized for AI coding agents (Codex, Cursor, etc.) to implement from. Every section should answer: "Can a developer (human or AI) build from this without guessing?"

---

## Phase 1: Idea Capture & Vision (The Spark)

**Goal:** Understand the raw idea and the person behind it.

1. **Acknowledge the idea** — Restate IDEA back to the user in your own words to confirm understanding.

2. **Invoke the interview skill** for deep-dive questioning:
   ```
   Use the skill invocation to invoke "interview" with args: "PRD exploration for: <IDEA>"
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

3. **Use ask the user** for key decisions:
   ```
   ask the user:
   - question: "What type of project is this?"
     options: ["Web app", "Mobile app", "CLI tool", "API/Backend service"]
   - question: "What's your target scope for v1?"
     options: ["Weekend project (MVP)", "1-2 week sprint", "Multi-week build", "Ongoing product"]
   ```

4. **Capture the vision statement** — Write a single clear sentence: "This is a [type] that helps [who] do [what] by [how]."

5. **Save draft state** to `DRAFT_FILE` with `phase_completed: 1`

---

## Phase 2: Problem & User Deep-Dive (The Why)

**Goal:** Validate the problem is real and define who you're building for.

1. **Gather research context** for the competitive landscape, target users, and technical feasibility.

   Use web search only when current external information is needed. Use subagents only when the user explicitly asks for delegated or parallel research and the session permits it.

2. **Synthesize research** — Present findings to user as a brief summary.

3. **Use ask the user** to refine based on research:
   ```
   ask the user:
   - question: "Based on this research, what's your primary differentiator?"
     options: ["Simpler UX", "Better performance", "Unique feature set", "Niche audience"]
   - question: "Which user persona resonates most?"
     options: [persona1, persona2, persona3, "None - let me describe"]
   ```

4. **Define the problem statement** — A clear, specific description of the problem this solves. If the user can't articulate the problem, the PRD isn't ready.

5. **Save draft state** to `DRAFT_FILE` with `phase_completed: 2`

---

## Phase 3: Feature Definition & User Stories (The What)

**Goal:** Define what gets built in concrete, testable terms.

1. **Brainstorm features** with the user using ask the user:
   ```
   ask the user:
   - question: "I've identified these potential features. Which are must-haves for v1?"
     multiSelect: true
     options: [feature1, feature2, feature3, feature4]
   ```

2. **Write user stories** in the format:
   > As a [user type], I want to [action] so that [benefit].

   For each must-have feature, create 1-3 user stories.

3. **Define acceptance criteria** for each user story using the GIVEN/WHEN/THEN format:
   > GIVEN [context], WHEN [action], THEN [expected result].

4. **Use ask the user** to prioritize:
   ```
   ask the user:
   - question: "How should we prioritize? MoSCoW method:"
     options: ["Must have (ship-blocking)", "Should have (important)", "Could have (nice)", "Won't have (future)"]
   ```

5. **Explicitly define what's OUT of scope** — This prevents scope creep and is critical for vibe coders who can get pulled into rabbit holes.

6. **Save draft state** to `DRAFT_FILE` with `phase_completed: 3`

---

## Phase 4: Technical Architecture & Constraints (The How)

**Goal:** Define the technical approach without over-engineering.

1. **Research technical decisions** for stack and architecture.

   Use direct repo inspection for existing projects. Use web search only for current external options, APIs, or ecosystem choices. Use subagents only when the user explicitly asks for delegated or parallel research and the session permits it.

2. **Present technical options** using ask the user:
   ```
   ask the user:
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

---

## Phase 5: Validation & Output (The Ship)

**Goal:** Produce the final PRD document and validate it's buildable.

1. **Load the PRD format template** from `PrdFormat.md` (in the skill root directory).

2. **Generate the PRD** following the format template exactly.

3. **Run the PRD Completeness Checklist** (validate internally):
   - [ ] Problem statement is specific and testable
   - [ ] Target user is clearly defined
   - [ ] Each feature has user stories with acceptance criteria
   - [ ] Technical approach is defined but not over-specified
   - [ ] Scope boundaries (in/out) are explicit
   - [ ] A developer could start building from this without asking questions
   - [ ] Success metrics are measurable
   - [ ] v1 scope is achievable within the stated timeframe

4. **Present the PRD summary** to the user and ask for final approval:
   ```
   ask the user:
   - question: "PRD is ready. How would you like to proceed?"
     options: ["Save as-is", "I want to revise a section", "Run Plan to create implementation plan", "Run Build to start building"]
   - question: "Solo or team workflow?"
     options: ["Solo (Plan + Build)", "Team (Team workflow)"]
   ```

5. **Save the PRD** to `OUTPUT_DIR/PRD.md` (where `OUTPUT_DIR = artifacts/specs/${SLUG}/`)

6. **Clean up draft file** — Delete `DRAFT_FILE` after successful save

---

## Validation

The PRD is complete when:
1. The file exists at `artifacts/specs/${SLUG}/PRD.md`
2. All required sections are present and filled in (not placeholder text)
3. Each must-have feature has at least one user story with acceptance criteria
4. The problem statement is specific enough to be falsifiable
5. A developer could start building without asking "but what should happen when...?"

## Interaction Guidelines

- **Be conversational, not corporate** — This is a brainstorming partner, not a requirements committee
- **Use ask the user** for all decision points — Don't just output questions as text
- **Push back on vagueness** — "What do you mean by 'good UX'?" is a valid question
- **Keep it lean** — If a section doesn't add value for THIS project, skip it
- **Favor concrete over abstract** — "Users can sign in with email" beats "Authentication system"
- **Challenge scope creep** — If the user keeps adding features, remind them of their stated scope
- **Think like a builder** — Every line should help someone (human or AI) actually build this

## Report

After saving the PRD:

```
PRD Complete

  File:       artifacts/specs/{slug}/PRD.md
  Product:    <product name>
  Scope:      <scope level>

  Session Stats:
  - Interview rounds: <count>
  - Decisions made: <count>
  - Research passes completed: <count>

  Research Summary:
  - Competitive: <1-2 sentence summary>
  - User Research: <1-2 sentence summary>
  - Technical: <1-2 sentence summary>

  Features:
  - Must Have: <count>
  - Should Have: <count>
  - Out of Scope: <count>

  Completeness:
  - Problem defined:     [check]
  - Users identified:    [check]
  - Stories written:     <count>
  - Tech stack chosen:   [check]
  - Acceptance criteria: [check]

  Requirement Tags: <count> #req-[id] tags

  Next Step: Run Plan sub-skill to create implementation plan
  Full Pipeline: Prd > Plan > Validate > Build > Test
```

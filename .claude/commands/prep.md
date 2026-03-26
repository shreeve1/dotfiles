---
description: Create a structured prep command for AI conversation context gathering
argument-hint: [topic]
model: sonnet
context: inherit
---

# Purpose

Creates a tailored `prep-{topic}.md` command that gathers relevant context before AI conversations. Use when you need to reference local projects, online documentation, or both.

## Variables

TOPIC: $1 — The subject area for prep (e.g., "api-integration", "database-schema", "auth-flow")

## Instructions

1. **Gather Requirements** - Use AskUserQuestion to determine context sources and information needs
2. **Design Workflow** - Create the prep workflow based on user's selections
3. **Write Command** - Generate `prep-{topic}.md` in `.claude/commands/`
4. **Verify** - Confirm file exists and is properly formatted

## Workflow

### Phase 1: Interactive Discovery

Use AskUserQuestion to gather:

**Question 1: Context Sources**
- Header: "Sources"
- Question: "What type of context sources will you need to reference?"
- Options:
  - "Local project files" — Search codebase, read files, explore structure
  - "Online documentation" — Fetch web docs, API references, guides
  - "Both local and online" — Combine codebase exploration with web research

**Question 2: Information Type**
- Header: "Info Type"
- Question: "What kind of information are you preparing the AI for?"
- Options:
  - "Architecture overview" — High-level structure, components, relationships
  - "API endpoints" — Routes, methods, request/response formats
  - "Configuration setup" — Environment variables, config files, deployment
  - "Data models" — Database schemas, types, interfaces
  - "Workflow/process" — Step-by-step flows, state machines, pipelines

**Conditional Question: Documentation Style**
- Header: "Output"
- Question: "How should fetched documentation be organized?"
- Only show if "Online documentation" or "Both" was selected
- Options:
  - "Summary with key points" — Concise bullet points
  - "Detailed sections" — Full content organized by topic
  - "Code examples focus" — Prioritize working examples

### Phase 2: Generate Command

Based on user answers, create `prep-{topic}.md` with:

**Required Elements:**
- Descriptive header with purpose
- Appropriate tools based on source type:
  - Local: Read, Glob, Grep, Bash (for exploration)
  - Online: WebFetch, WebSearch
  - Both: Combined toolset
- Structured workflow matching information type
- Clear output format template with concrete examples

**Command Structure:**
```md
---
description: Prep context for {topic}
model: sonnet
---

# Purpose

<One-liner: what this prep command gathers>

## Context Sources

<Based on user selection: local paths, online URLs, or both>

## Workflow

1. <Step 1: Initial exploration>
2. <Step 2: Deep dive into specifics>
3. <Step 3: Synthesize findings>

## Output Format

<Template for gathered context>
```

### Phase 3: Write and Validate

1. Create file at `.claude/commands/prep-{topic}.md`
2. Include AskUserQuestion for interactive context gathering
3. Include WebFetch/WebSearch if online sources were selected
4. Include example output format specific to information type
5. Validate file exists and contains required sections

## Output Format

After completion, report:

```
✅ Prep Command Created

File: .claude/commands/prep-{topic}.md
Sources: <local|online|both>
Info Type: <architecture|api|config|models|workflow>

Usage:
  /prep-{topic}

The generated command will:
- Gather context via AskUserQuestion
- Explore: <specific exploration paths>
- Fetch: <specific docs or URLs>
- Output: <format based on info type>
```

## Examples

### Example 1: Local API Prep
**Input:** `/prep api-endpoints`
**User selects:** Local project files + API endpoints
**Generated command includes:**
- Read hooks for `src/api/` directory
- Grep for route definitions and handlers
- Output format: list of endpoints with methods and response types

### Example 2: Online Docs Prep
**Input:** `/prep stripe-integration`
**User selects:** Online documentation + Summary with key points
**Generated command includes:**
- WebFetch for stripe.com/docs
- WebSearch for API reference docs
- Output format: bullet-point summary of key endpoints

### Example 3: Combined Prep
**Input:** `/prep auth-flow`
**User selects:** Both local and online + Workflow/process
**Generated command includes:**
- Read auth-related code files
- WebFetch OAuth docs
- Output format: step-by-step flow diagram with code references

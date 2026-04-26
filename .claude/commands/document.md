---
name: document
description: Extract documentation from a session or user input and save to artifacts/docs/ where /cc-prime discovers it
argument-hint: [topic or description of what to document]
allowed-tools: Bash(mkdir:*), Bash(ls:*), Bash(wc:*), Bash(cat:*), Read, Write, Edit, Glob, Grep
model: sonnet
---

# Document

Extract, organize, and save documentation to the project's `artifacts/docs/` directory structure — the same location that `/cc-prime` scans and `CLAUDE.md` designates for documentation. Works in two modes: session-based (captures knowledge from the current conversation) or input-based (documents a topic the user describes).

## Variables

USER_INPUT: $ARGUMENTS
PROJECT_CWD: !`pwd`

## Checklist
You MUST create a task for each of these items and complete them in order:
1. **Determine mode and scope** — identify if input-based or session-based, ask clarifying questions about type and audience
2. **Classify document** — determine which artifacts/docs/ subdirectory content belongs in based on CLAUDE.md conventions
3. **Examine existing documentation** — check for existing documentation to avoid duplication, ask user whether to update, replace, or create new
4. **Generate document** — create documentation file with clear structure, writing guidelines, and kebab-case filename
5. **Create directory structure** — ensure appropriate subdirectory exists in artifacts/docs/
6. **Write document** — save file to proper location with full content
7. **Update navigation hub** — update or create artifacts/docs/README.md with entry for new document
8. **Verify** — confirm file written, navigation updated, and file reachable from hub link

## Instructions

### Step 1: Determine Mode and Scope

**If `USER_INPUT` is provided:**
- Use it as the topic/content to document
- Ask clarifying questions if the input is ambiguous about:
  - What type of doc (guide, reference, getting-started, development)
  - What audience (new contributors, API consumers, internal team)

**If `USER_INPUT` is empty:**
- Analyze the current conversation context to identify documentation-worthy content
- Look for: decisions made, architecture discussed, setup procedures explained, APIs described, problems solved, patterns established
- Ask the user what they'd like to document from the session if multiple candidates exist

### Step 2: Classify the Document

Determine which `artifacts/docs/` subdirectory the content belongs in based on CLAUDE.md conventions:

| Category | Directory | When to use |
|----------|-----------|-------------|
| Tutorial | `artifacts/docs/getting-started/` | First-time setup, onboarding, walkthroughs |
| How-to | `artifacts/docs/guides/` | Task-oriented instructions, recipes |
| Reference | `artifacts/docs/reference/` | API docs, specs, configuration options |
| Architecture | `artifacts/docs/architecture/` | System design, data flow, component relationships |
| Development | `artifacts/docs/development/` | Contributing guidelines, internal tooling, ADRs |

If the content doesn't fit cleanly, ask the user which category to use.

### Step 3: Examine Existing Documentation

Before writing, understand what already exists:

1. Check if `artifacts/docs/` directory exists: `ls PROJECT_CWD/artifacts/docs/ 2>/dev/null`
2. Read `artifacts/docs/README.md` if it exists (this is the navigation hub `/cc-prime` reads)
3. List contents of the target subdirectory to avoid duplicating existing docs
4. If a document on the same topic already exists, ask the user whether to:
   - **Update** the existing document (merge new content in)
   - **Replace** it entirely
   - **Create a new** document with a different name

### Step 4: Generate the Document

Create the documentation file with this structure:

```markdown
<!-- Created: YYYY-MM-DD -->
# <Title>

<Brief description of what this document covers and who it's for>

## <Section 1>

<Content>

## <Section 2>

<Content>

<!-- Continue as needed -->
```

**Writing guidelines:**
- Use clear, direct language
- Include code examples where they clarify concepts
- Use relative links to reference other project files (e.g., `../../src/auth.ts`)
- Don't over-document — capture what's useful, skip what's obvious from code
- Match the tone and depth of existing docs in the project if any exist
- Set `Created` date to today's date in YYYY-MM-DD format

**Filename:** Use kebab-case, descriptive names (e.g., `authentication-flow.md`, `api-endpoints.md`, `local-setup.md`)

### Step 5: Create Directory Structure

```bash
mkdir -p PROJECT_CWD/artifacts/docs/<category>/
```

### Step 6: Write the Document

Save the file to `PROJECT_CWD/artifacts/docs/<category>/<filename>.md`

### Step 7: Update Navigation Hub

This step ensures `/cc-prime` can discover the new documentation.

**If `artifacts/docs/README.md` exists:**
- Read it and add an entry for the new document in the appropriate section
- Maintain existing structure and formatting
- Add a one-line description with a relative link: `- [Title](category/filename.md) — Brief description`

**If `artifacts/docs/README.md` does not exist:**
- Count total docs in `artifacts/docs/` (including the new one)
- If 3 or more docs exist, create `artifacts/docs/README.md` as a navigation hub:

```markdown
# Documentation

## <Category>

- [Doc Title](category/filename.md) — Brief description

## <Other Category>

- [Other Doc](other-category/filename.md) — Brief description
```

- If fewer than 3 docs exist, skip creating the hub (per CLAUDE.md: "Create `artifacts/docs/README.md` as navigation hub if 3+ docs exist")

### Step 8: Verify

1. Confirm the file was written and has content
2. Confirm `artifacts/docs/README.md` was updated (if applicable)
3. Confirm the file is reachable from the navigation hub link

## Report

```
Documentation Saved

  File:     artifacts/docs/<category>/<filename>.md
  Category: <category>
  Title:    <document title>
  Lines:    <line-count>

  Navigation: artifacts/docs/README.md <updated | created | skipped (< 3 docs)>

  /cc-prime will now discover this document via:
    artifacts/docs/README.md → <category>/<filename>.md
```

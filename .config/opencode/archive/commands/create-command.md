---
description: Create a new OpenCode command from scratch with guided prompts
agent: build
---

Create a new OpenCode command file following established conventions. $ARGUMENTS

## Phase 1 — Gather Requirements

If the user provided a command name as an argument, use it. Otherwise ask for one.

Ask the user **one question at a time**, only these three:

1. **Command name** — What should the command be called? (skip if provided as argument)
2. **What should it do?** — Brief description of the command's purpose and behavior
3. **Global or project?** — Global (`~/.config/opencode/commands/`) or project-local (`.opencode/commands/`)? Default: global

Infer everything else from the description:
- `description:` frontmatter — derive from the user's answer
- `agent:` — use `build` for implementation tasks, omit for analysis/conversational tasks
- `$ARGUMENTS` — include if the command logically accepts input
- Shell output, file references, model, subtask — only include if clearly needed

## Phase 2 — Review Existing Commands

Before generating, scan the commands directory (based on chosen scope) to:

1. List existing commands to avoid name collisions
2. Read 2-3 existing commands to match the local style and conventions
3. Note patterns: phase-based structure, heading style, use of code blocks, rule sections

## Phase 3 — Generate the Command

Build the command file using this template structure:

```markdown
---
description: <one-line description>
agent: <agent>          # omit if not needed
model: <model>          # omit if not needed
subtask: <true/false>   # omit if not needed
---

<Opening instruction line with context>. $ARGUMENTS

## Phase 1 — <First Phase Name>

<Steps for the first phase>

## Phase 2 — <Second Phase Name>

<Steps for the second phase>

## Phase N — <Final Phase Name>

<Final steps, reporting, or user review>
```

**Style rules to follow:**

- Frontmatter: only include fields that have values (omit defaults)
- First line after frontmatter: single sentence describing what to do, ending with `$ARGUMENTS` if the command accepts arguments
- Use `## Phase N — Name` format for major sections
- Use `###` for subsections within phases
- Use numbered lists for sequential steps
- Use bullet lists for options or non-ordered items
- Use fenced code blocks for commands, templates, or expected output
- Keep total length proportional to complexity:
  - Simple commands: 20-40 lines
  - Medium commands: 40-80 lines
  - Complex commands: 80-120 lines
- Include a `## Rules` section if there are important constraints or safety checks
- Include a `## Report` section at the end if the command produces structured output
- Write instructions as directives to the agent ("Run X", "Check Y", "Ask the user Z")

## Phase 4 — Write and Verify

1. Create the directory if it doesn't exist:
   - Global: `~/.config/opencode/commands/`
   - Project: `.opencode/commands/`
2. Write the command file
3. Read it back to verify correctness and formatting
4. Check that frontmatter is valid YAML

## Phase 5 — Report

Show the user:

```
Command created: /command-name
  Location: <file path>
  Description: <description>
  Agent: <agent or "default">
  Accepts args: <yes/no>

To use: /<command-name> [arguments]
```

Ask if they want to adjust the content, add phases, or modify any section.

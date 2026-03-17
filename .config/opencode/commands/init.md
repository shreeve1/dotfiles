---
description: Scan a project and create or update an AGENTS.md file
agent: build
---

Scan the current project and generate a well-structured AGENTS.md following best practices. $ARGUMENTS

## Phase 1 — Project Discovery

### Identify Project Type
Check for: `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `pom.xml`, `build.gradle`, `Gemfile`, `composer.json`

### Analyze Tech Stack
Read key config files to identify frameworks, dependencies, and language versions.

### Map Project Structure
List top-level directories and identify source code, tests, config, docs, and scripts locations.

### Extract Commands
From config files, identify: dev server, build, test, lint/format, migration, and deployment commands.

### Detect Code Conventions
Sample 2-3 source files to identify naming conventions, import style, testing framework, and linting tools.

## Phase 2 — Check Existing AGENTS.md

If `AGENTS.md` or `CLAUDE.md` exists and has substantial content (>50 lines), ask:
1. **Merge** — Keep existing content, add new sections
2. **Replace** — Create fresh based on current project state
3. **Append** — Add only missing sections

## Phase 3 — Generate AGENTS.md

Target size based on project complexity:
- Simple (<10 files): 30-60 lines
- Medium (10-50 files): 60-120 lines
- Complex (50+ files): 120-200 lines

Use this structure:
```markdown
# [Project Name]
[One-line description]

## Tech Stack
## Commands
## Project Structure
## Code Style
## Testing
## Important Notes
```

**Include**: project purpose, architecture, how to run dev/test/build, key file locations, critical gotchas.
**Exclude**: detailed linter rules, info easily discovered from code, rarely-used patterns.

## Phase 4 — Write and Verify

Create project-local directories:
```bash
mkdir -p ./.opencode/skills ./.opencode/extensions ./.opencode/prompts ./.opencode/themes
```

Write `AGENTS.md` in the project root. Read it back to verify correctness.

## Phase 5 — User Review

Report what was created, sections included, tech stack detected, and commands documented. Ask if the user wants to add sections, adjust detail, or create supporting docs.

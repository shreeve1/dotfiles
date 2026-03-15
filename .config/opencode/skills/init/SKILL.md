---
name: init
description: Scan a project and create or update an AGENTS.md file with best practices
compatibility: adapted-for-opencode
metadata:
  source: /Users/james/.pi/agent/skills/pi-init/SKILL.md
  original_name: pi-init
---

# Create AGENTS.md

Converted from `/Users/james/.pi/agent/skills/pi-init/SKILL.md`. Imported as `init` for OpenCode.

## Compatibility Notes

- This is an imported OpenCode-adapted copy of a skill from `~/.opencode/agent/skills/`.
- Tool names were rewritten to the closest OpenCode equivalents where possible.
- If this skill mentions pi-only capabilities such as persistent vector memory, background subagents, or plan-state helpers, use local files, `task`, `todowrite`, and `read`/`grep` as the closest OpenCode-native substitutes.

---

Use this skill when the user asks to create, generate, or update an AGENTS.md file for a project. This skill analyzes the codebase structure, discovers conventions, and produces a well-structured AGENTS.md following best practices.

---

## Activation Contract

Invoke this skill when:
- User asks to "create an AGENTS.md" or "generate project instructions"
- User wants to document project conventions for AI assistants
- User says "scan this project" in the context of creating AGENTS.md
- User asks to set up AGENTS.md for a new or existing project

Do NOT invoke when:
- User only wants to view or read an existing AGENTS.md
- User is asking about AGENTS.md syntax without wanting to create one
- The task is unrelated to project documentation

---

## Phase 1 — Project Discovery

Scan the project to understand its structure, tech stack, and conventions.

### 1.1 Identify Project Type

Use `bash` to check for:

```bash
# Package managers and frameworks
ls -la package.json pyproject.toml Cargo.toml go.mod pom.xml build.gradle Gemfile composer.json 2>/dev/null

# Common project files
ls -la README.md CLAUDE.md AGENTS.md 2>/dev/null
```

### 1.2 Analyze Tech Stack

Read key configuration files with `read`:
- `package.json` → scripts, dependencies, Node.js framework
- `pyproject.toml` / `setup.py` → Python version, dependencies
- `Cargo.toml` → Rust dependencies and features
- `go.mod` → Go version and modules

### 1.3 Map Project Structure

Use `bash` to list directory structure:

```bash
# Get top-level structure
ls -d */ 2>/dev/null | head -20

# Identify key directories
find . -maxdepth 2 -type d -name "src" -o -name "lib" -o -name "tests" -o -name "docs" -o -name "scripts" 2>/dev/null
```

Look for:
- Source code location (`src/`, `lib/`, `app/`)
- Test location (`tests/`, `test/`, `__tests__/`, `spec/`)
- Configuration files
- Documentation directory
- Scripts directory

### 1.4 Extract Commands

From configuration files, identify:
- Development server command
- Build command
- Test command
- Lint/format command
- Database migration command
- Deployment command

### 1.5 Detect Code Conventions

Sample 2-3 source files with `read` to identify:
- Language (TypeScript, Python, etc.)
- Naming conventions (camelCase, snake_case, PascalCase)
- Import style (ESM, CommonJS, named vs default exports)
- Testing framework
- Linting tools (eslint, ruff, etc.)

---

## Phase 2 — Check Existing AGENTS.md

### 2.1 Read Existing File

If `AGENTS.md` or `CLAUDE.md` exists, read it with `read`:
- Preserve any custom instructions that should be kept
- Note sections that may need updating
- Identify outdated information

### 2.2 Ask About Preservation

If an existing file has substantial content (>50 lines), use `question`:

```
I found an existing AGENTS.md with [N] lines. Should I:
1. Merge — Keep existing content, add new sections
2. Replace — Create fresh based on current project state
3. Append — Add only missing sections at the end
```

---

## Phase 3 — Generate AGENTS.md

### 3.1 Determine File Size Target

Based on project complexity:
- **Simple project** (< 10 files, single purpose): Target 30-60 lines
- **Medium project** (10-50 files, a few features): Target 60-120 lines
- **Complex project** (50+ files, multiple services): Target 120-200 lines, use progressive disclosure

### 3.2 Structure Template

Use this structure, adapting to project needs:

```markdown
# [Project Name]

[One-line description of what the project does]

## Tech Stack
- [Framework/language] [version]
- [Key dependencies]

## Commands
- `[cmd]`: [description]
- `[cmd]`: [description]

## Project Structure
- `/dir`: [what it contains]
- `/dir`: [what it contains]

## Code Style
- [Brief conventions - don't duplicate linter rules]

## Testing
- [Framework and how to run]

## Important Notes
- [Gotchas, security considerations, things not to modify]
```

### 3.3 Content Guidelines

**INCLUDE (high-leverage):**
- Project purpose and architecture
- How to run dev server, tests, build
- Where key files are located
- Critical gotchas or security notes
- Brief naming/formatting conventions

**EXCLUDE (low-leverage):**
- Detailed linting rules (model learns from code)
- Information easily discovered by reading code
- Developer-specific setup instructions
- Rarely-used patterns

**USE PROGRESSIVE DISCLOSURE** for complex projects:
- Keep main AGENTS.md concise
- Reference detailed docs with: `See @docs/topic.md for details`
- Let the model choose what to read

---

## Phase 4 — Write and Verify

### 4.1 Detect Project Context

Determine if running in a project context:
- **Global context**: Working directory is `~/.opencode` or subdirectories
- **Project context**: Any other directory

If in project context:
1. Create project-local directories with `bash`:
   ```bash
   mkdir -p ./.opencode/skills ./.opencode/extensions ./.opencode/prompts ./.opencode/themes
   ```
2. The project-level `AGENTS.md` goes in the project root, NOT in `.opencode/`

### 4.2 Write the File

Use `apply_patch` to create `AGENTS.md` in the project root (for project context) or skip if in global context.

If in project context, include a **Configuration Hierarchy** section that documents:

```markdown
## Configuration Hierarchy

This project-level AGENTS.md extends the global configuration at `~/.opencode/AGENTS.md`.

OpenCode loads configuration from:
1. Global: `~/.opencode/AGENTS.md`
2. Parent directories (walking up from current directory)
3. Current directory: `./AGENTS.md` (this file)

All matching files are concatenated. This file can override or extend global rules.

### Project-Local Resources

Project-specific skills, extensions, and configurations are located in:
- Skills: `./.opencode/skills/`
- Extensions: `./.opencode/extensions/`
- Prompts: `./.opencode/prompts/`
- Themes: `./.opencode/themes/`
- Settings: `./.opencode/settings.json` (overrides global settings with nested object merging)

Create project-specific resources here instead of globally to keep customizations isolated.
```

### 4.3 Verify Contents

Read back with `read` to confirm:
- File was written correctly
- No truncation or corruption
- Formatting is valid Markdown

### 4.4 Optional: Create Supporting Docs

If the project is complex, offer to create:
- `docs/architecture.md` — detailed system design
- `docs/contributing.md` — development workflow
- `docs/testing.md` — testing strategy

---

## Phase 5 — User Review

Ask the user with `question`:

```
I've created AGENTS.md with [N] lines covering:
- [Section 1]
- [Section 2]
- [Section 3]

[If project context:] I've also created the project-local .opencode/ directory structure:
- ./.opencode/skills/ - for project-specific skills
- ./.opencode/extensions/ - for project-specific extensions
- ./.opencode/prompts/ - for project-specific prompt templates
- ./.opencode/themes/ - for project-specific themes

Would you like me to:
1. Add any sections? (e.g., deployment, API docs)
2. Adjust the detail level?
3. Create supporting documentation files?
4. Create a project-specific skill or extension?
```

---

## Report

After completing the skill, output:

```
AGENTS.md created: [path]
Lines: [N]

Sections included:
- [Section name]: [brief description of content]

[If project context:]
Project-local structure created:
- ./.opencode/skills/ - for project-specific skills
- ./.opencode/extensions/ - for project-specific extensions  
- ./.opencode/prompts/ - for project-specific prompt templates
- ./.opencode/themes/ - for project-specific themes

Tech stack detected:
- [Language/framework]
- [Key tools]

Commands documented:
- [command]: [purpose]

Next steps:
- Review the file and customize for your preferences
- Add project-specific gotchas or security notes
- Consider creating supporting docs for complex topics
- Project-specific skills should be created in ./.opencode/skills/ (not globally)
```

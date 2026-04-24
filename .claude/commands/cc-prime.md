---
name: cc-prime
description: Load project context at session start — codebase structure, prior session state, and available docs/resources
argument-hint: [optional: focus area or specific subsystem to prioritize]
allowed-tools: Bash(ls:*), Bash(find:*), Bash(git:*), Bash(wc:*), Bash(cat:*), Read, Glob, Grep
model: sonnet
---

# CC Prime

Load project context at the start of a new session. Explores codebase structure, resumes prior session state, and surfaces available documentation and research. Do not run mid-session when context is already loaded.

## Variables

USER_INPUT: $ARGUMENTS
PROJECT_CWD: !`pwd`

## Checklist

You MUST complete each step in order:
1. **Explore project root** — identify project type, tech stack, key directories
2. **Read config directives** — load CLAUDE.md or project-level instruction files
3. **Resume session context** — check artifacts/sessions/ for prior work and open tasks
4. **Scan available resources** — discover docs, scripts, and cached research without reading everything
5. **Report** — synthesize into a structured context summary

## Instructions

### Step 1: Explore Project Root

**If `USER_INPUT` is provided**, treat it as the focus area from the start — prioritize reading files related to that subsystem throughout all steps.

Read the project manifest and top-level structure:

1. Run `ls PROJECT_CWD` to see top-level files and directories
2. Read the first manifest file found (check in order):
   - `package.json`, `go.mod`, `Cargo.toml`, `pyproject.toml`, `pom.xml`
   - If `package.json`, also note the `scripts` section — these are the run/test/build commands
3. Check for task runners: read `Makefile` or `justfile` if either exists (first 40 lines only)
4. Check for environment setup: note if `.env.example` or `.env.sample` exists (do NOT read contents)
5. Read `README.md` if it exists at the project root
6. Run `find . -maxdepth 2 -name '*.md' | head -20` to identify doc files
7. Run `git ls-files | head -40` (if git repo) as a file inventory cross-check

Extract: project name, type (library/app/service/cli), primary language and frameworks, entry points, key directories, how to run/test/build.

### Step 2: Read Config Directives

Check for instruction files that define how to work in this project:

1. Read `PROJECT_CWD/CLAUDE.md` if it exists
2. Read `PROJECT_CWD/.claude/CLAUDE.md` if it exists
3. Read `PROJECT_CWD/.claude/settings.json` if it exists — note allowed tools and any project-specific permissions
4. Read `PROJECT_CWD/pi.md` if it exists (Pi agent projects)
5. Note any key rules: banned commands, required patterns, test conventions, deploy procedures

If none found, note "No project-level config directives found."

### Step 3: Resume Session Context

Check for prior session history in `artifacts/sessions/`:

1. Run `ls -t PROJECT_CWD/artifacts/sessions/ 2>/dev/null | head -10`
2. If the directory exists and contains `*_todos.md` files:
   - Read the most recent `_todos.md` to find pending/in-progress tasks
   - Note any tasks marked TODO or IN-PROGRESS
3. If no `_todos.md` files exist but `.jsonl` transcripts are present:
   - Note the most recent transcript filename and date — do NOT read it (too large)
4. If `artifacts/sessions/` does not exist, note "No prior session history found."

### Step 4: Scan Available Resources

Discover what's available without reading everything:

1. Run `ls PROJECT_CWD/artifacts/docs/ 2>/dev/null` — list doc directories/files
2. If `artifacts/docs/README.md` exists, read it (this is the navigation hub `/document` maintains)
3. Run `ls PROJECT_CWD/artifacts/web-search/ 2>/dev/null | head -20` — note research topic filenames only, do NOT read contents
4. Run `ls PROJECT_CWD/scripts/ 2>/dev/null` — list available scripts
5. Read `PROJECT_CWD/scripts/README.md` if it exists
6. Read up to 2–3 architecture or design docs whose names clearly describe structure (e.g., `artifacts/docs/architecture.md`, `artifacts/docs/development/setup.md`)

Do NOT read every file. The goal is knowing what's available, not ingesting everything.

### Step 5: Report

Synthesize all findings into a structured context summary:

```markdown
## Project Overview
<name, type, purpose — 1-2 sentences>

## Tech Stack
<languages, frameworks, key dependencies, build tools>

## Key Directories
<entry points and important directories with brief purpose notes>

## Config Directives
<rules from CLAUDE.md or equivalent; "None found" if absent>

## Session Context
<prior session status; pending/in-progress tasks if any; "No prior sessions" if absent>

## Available Docs
<list of doc categories and key files from artifacts/docs/>

## Cached Research
<list of research topics from artifacts/web-search/ filenames; "None" if absent>

## Scripts
<available scripts from scripts/; "None" if absent>
```

If `USER_INPUT` was provided, append:

```markdown
## Focus Area: <USER_INPUT>
<any relevant files, docs, or context specific to the requested subsystem>
```

Always append at the end:

```markdown
## Suggested Next Actions
- <most logical next task based on session context — e.g., resume in-progress work, or ask user what to tackle>
- Run `/document <topic>` after any session where significant knowledge was generated
- <any environment setup needed, e.g., "copy .env.example to .env and fill in values">
```

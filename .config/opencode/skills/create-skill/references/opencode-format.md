# OpenCode Skill Format Reference

## Directory Structure

```
skill-name/
├── SKILL.md              # Required: frontmatter + instructions
├── scripts/              # Optional: helper scripts the skill invokes
│   └── process.sh
├── references/           # Optional: detail loaded on-demand
│   └── reference.md
└── assets/               # Optional: templates, output files
    └── template.json
```

Skill locations:
- **Global** (all sessions): `~/.config/opencode/skills/<name>/SKILL.md`
- **Project** (one project only): `.opencode/skills/<name>/SKILL.md`

---

## Three-Tier Loading

OpenCode loads skill content progressively — understanding this explains most authoring decisions:

| Tier | What loads | When | Size guidance |
|------|-----------|------|---------------|
| **Metadata** | `name` + `description` | Always — every session | ~100 words; keep tight |
| **Skill body** | Full `SKILL.md` contents | When the skill is triggered | Under 500 lines |
| **Bundled resources** | `scripts/`, `references/`, `assets/` | On-demand, referenced from body | No hard limit |

**Practical implications:**
- Description is always in context — every word counts; make it a precise trigger
- SKILL.md body is only loaded when the skill triggers — you can be thorough here
- References are only loaded when the skill explicitly reads them — put bulk reference material, large tables, and variant-specific content here
- Scripts execute without being loaded into context — ideal for deterministic or repetitive tasks

If SKILL.md is growing past 500 lines, that's a signal to move detail into `references/` and leave pointers in the body.

---

## Required Frontmatter

```yaml
---
name: skill-name
description: What it does and when to use it
---
```

**Optional frontmatter fields:**

| Field | Type | Purpose |
|-------|------|---------|
| `license` | string | e.g. `MIT` |
| `compatibility` | string | e.g. `opencode-1.0` |
| `metadata` | map | Arbitrary string key-value pairs |

---

## Name Rules

- 1–64 characters
- Lowercase alphanumeric with single hyphens only
- Pattern: `^[a-z0-9]+(-[a-z0-9]+)*$`
- Must match the directory name that contains `SKILL.md`
- No consecutive `--`, no leading or trailing `-`

---

## Description Rules

- 1–1024 characters
- This is the primary trigger mechanism — the agent loads the skill based on this text alone
- Include both **what it does** and **specific contexts/phrasings** that should activate it
- Be a little pushy — agents tend to under-trigger skills

**Weak:**
```
Helps with PDF files.
```

**Strong:**
```
Extracts text, tables, and form data from PDF files. Use whenever the user
mentions PDFs, wants to convert or extract from a document, or needs to fill
or merge PDF files, even if they don't say "PDF processing" explicitly.
```

---

## Skill Body Structure

Adapt structure to the skill's purpose. A common pattern:

```markdown
# Skill Title

<Activation contract: one paragraph — when to use, when NOT to use.>

---

## Phase 1 — <Name>

<Instructions in imperative voice. Reference tools by exact name.>

## Phase 2 — <Name>

<Continue.>

## Output Format   (only if the skill produces a structured artifact)

<Exact template with placeholder markers>

## Guardrails   (optional)

<What the skill must never do>

## Report

After completing the task, output:
<summary template>
```

---

## Writing Patterns

**Use imperative voice** directed at the agent:
- "Read the file with `read`" — not "The agent should read..."
- "Use `bash` to locate" — not "You might want to..."

**Explain the why** — agents perform better when they understand the reasoning behind instructions, not just the rule. Avoid ALL-CAPS imperatives; reframe with context instead.

**Define output formats explicitly:**
```markdown
## Report structure
Use this exact template:

# [Title]
## Summary
## Findings
## Recommendations
```

**Include examples at decision points:**
```markdown
**Example — commit message format:**
Input: Added user authentication with JWT tokens
Output: feat(auth): implement JWT-based authentication
```

**Progressive disclosure** — keep `SKILL.md` under 500 lines. Move bulk detail to `references/`:
```markdown
See `references/api-patterns.md` for endpoint naming conventions.
```

**Domain organization** — when a skill supports multiple variants, use `references/` and read only the relevant file at runtime:
```
cloud-deploy/
├── SKILL.md           (workflow + variant selection)
└── references/
    ├── aws.md
    ├── gcp.md
    └── azure.md
```

**Bundle repeated work** — if every invocation would independently write the same helper script, put it in `scripts/` and reference it from the skill body. This saves context and ensures consistency across runs.

**Environment-specific shell commands** — if a skill depends on tools that may not be installed (`jq`, `ffmpeg`, `aws`, etc.), check for them before using and surface a clear error if they're missing:
```markdown
Use `bash` to verify the dependency exists before proceeding:
`command -v jq >/dev/null 2>&1 || { echo "jq is required but not installed"; exit 1; }`
```

---

## OpenCode Tool Names

Use these exact names when referencing tools in skill instructions:

| Task | Tool name |
|------|-----------|
| Ask the user a question | `question` |
| Run shell commands | `bash` |
| Read file contents | `read` |
| Write a file | `write` |
| Edit a file | `edit` |
| Apply a patch | `apply_patch` |
| Find files by pattern | `glob` |
| Search file contents | `grep` |
| Fetch a URL | `webfetch` |
| Web search | `google_search` |
| Spawn subagents | `task` |
| Manage todo list | `todowrite` |
| Load a skill | `skill` |

> Note: MCP-provided tools follow the pattern `mcp_<server>_<tool>` (e.g. `mcp_github_create_issue`). Reference these by their full name if your skill depends on a specific MCP server being available, and document that dependency clearly.

---

## Claude Code → OpenCode Conversion

Field mapping when converting `.claude/skills/` or `.claude/commands/` files:

| Claude Code Field | OpenCode Action |
|---|---|
| `name` | Keep — validate against naming rules |
| `description` | Keep — trim to 1024 chars if needed |
| `argument-hint` | Drop from frontmatter — weave argument guidance into body as a "Usage" or "Inputs" section |
| `model` | Drop — skills don't specify a model |
| `context` | Drop — not applicable |
| `allowed-tools` | Drop frontmatter — if restricting tools matters, add a "Guardrails" section in the body listing which tools are appropriate to use |
| `disallowed-tools` | Drop frontmatter — add a "Guardrails" section in body listing prohibited actions |
| `hooks` | Drop — no hooks in OpenCode skills; convert pre/post validation steps into body instructions |
| `$1`, `$2`, `$ARGUMENTS` | Replace with plain-text descriptions of expected input in a "Usage" or "Inputs" section |
| `${CLAUDE_SESSION_ID}` | Drop — no equivalent |
| `` !`command` `` | Drop or convert to a manual workflow step |
| `skills:` frontmatter | Drop — list related skills in a "Related Skills" section in the body |

**Structural changes when converting:**
1. Keep all core instructions, workflows, and reference content
2. Add an activation contract near the top (when to use, when not to)
3. Remove all Claude Code-specific syntax throughout
4. If the source was a phased command, preserve the phases
5. Replace tool references with the OpenCode equivalents from the table above

---

## Validation Checklist

Before saving the file:

- [ ] `name` matches `^[a-z0-9]+(-[a-z0-9]+)*$`, 1–64 chars
- [ ] `name` matches the directory name exactly
- [ ] `description` is 1–1024 chars and describes trigger conditions specifically
- [ ] Frontmatter delimited with `---`, valid YAML, no tabs
- [ ] Body has at minimum: title + activation contract + at least one phase or section
- [ ] No Claude Code syntax remains (`$1`, `$ARGUMENTS`, hook blocks, slash command refs)
- [ ] File path is `<base>/<name>/SKILL.md`
- [ ] Any `scripts/` files that need to be executable have `chmod +x` applied
- [ ] Any `references/` files are referenced from the skill body with guidance on when to read them
- [ ] Environment-specific tool dependencies are checked before use

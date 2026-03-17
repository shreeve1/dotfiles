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
- **Project** (one project): `.opencode/skills/<name>/SKILL.md`

---

## Required Frontmatter

```yaml
---
name: skill-name
description: What it does and when to use it
---
```

**Optional frontmatter fields:** `license`, `compatibility`, `metadata` (string key-value map)

---

## Name Rules

- 1–64 characters
- Lowercase alphanumeric with single hyphens only
- Pattern: `^[a-z0-9]+(-[a-z0-9]+)*$`
- Must match the directory name that contains SKILL.md
- No consecutive `--`, no leading or trailing `-`

---

## Description Rules

- 1–1024 characters
- This is how the agent decides whether to load the skill — it's the primary trigger mechanism
- Include both **what it does** and **specific contexts/phrasings** that should activate it
- Be a little pushy — agents tend to under-trigger skills

**Weak description:**
```
Helps with PDF files.
```

**Strong description:**
```
Extracts text, tables, and form data from PDF files. Use whenever the user
mentions PDFs, wants to convert or extract from a document, or needs to fill
or merge PDF files, even if they don't say "PDF processing" explicitly.
```

---

## Skill Body Structure

Adapt to the skill's purpose. Common sections:

```markdown
# Skill Title

<Activation contract: one paragraph — when to use, when not to.>

---

## Phase 1 — <Name>

<Instructions. Imperative voice. Reference tools by exact name.>

## Phase 2 — <Name>

<Continue pattern.>

## Output Format   (only if skill produces a structured artifact)

<Exact template with placeholder markers>

## Report

After completing the skill's work, output:
<summary template>
```

---

## Writing Patterns

**Use imperative voice** directed at the agent:
- "Read the file with `read`" not "The agent should read..."
- "Use `bash` to locate" not "You might want to use..."

**Explain the why** — agents perform better when they understand the reasoning behind instructions, not just the rule. Avoid uppercase MUST/ALWAYS/NEVER unless truly necessary; reframe with context instead.

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

**Progressive disclosure** — keep SKILL.md under 500 lines. For large reference material, put it in `references/` and point to it:
```markdown
See `references/api-patterns.md` for endpoint naming conventions.
```

**Domain organization** — when a skill supports multiple variants, put them in `references/` and have the skill read only the relevant one:
```
cloud-deploy/
├── SKILL.md           (workflow + selection logic)
└── references/
    ├── aws.md
    ├── gcp.md
    └── azure.md
```

**Bundle repeated work** — if every run would independently write the same helper script, put it in `scripts/` and reference it from the skill body.

---

## OpenCode Tool Names

Use these exact names in skill instructions:

| Task | Tool name |
|------|-----------|
| Ask the user a question | `question` |
| Run shell commands | `bash` |
| Read file contents | `read` |
| Find files by pattern | `glob` |
| Search file contents | `grep` |
| Edit a file | `edit` |
| Write a file | `write` |
| Fetch a URL | `webfetch` |
| Web search | `google_search` |
| Spawn subagents | `task` |
| Manage todo list | `todowrite` |

---

## Claude Code → OpenCode Conversion

Field mapping when converting `.claude/skills/` or `.claude/commands/` files:

| Claude Code Field | OpenCode Action |
|---|---|
| `name` | Keep as `name` in frontmatter — validate naming rules |
| `description` | Keep — trim to 1024 chars if needed |
| `argument-hint` | Drop from frontmatter — weave argument guidance into body as "Usage" section |
| `model` | Drop — skills don't specify model |
| `context` | Drop — not applicable |
| `disallowed-tools` | Drop frontmatter — add a "Guardrails" section in body listing prohibited actions |
| `hooks` | Drop — no hooks in OpenCode skills; convert validation steps into body instructions |
| `$1`, `$2`, `$ARGUMENTS` | Replace with plain-text descriptions of expected input |
| `${CLAUDE_SESSION_ID}` | Drop — no equivalent |
| `` !`command` `` | Drop or convert to a manual workflow step |
| `skills:` frontmatter | Drop — list related skills in a "Related Skills" section in the body instead |

**Structural changes:**
1. Keep all core instructions, workflows, and reference content
2. Add "When to Use This Skill" section if missing
3. Remove Claude Code-specific syntax throughout
4. If the source was a phased command, preserve the phases as-is

---

## Validation Checklist

Before writing the file:

- [ ] `name` matches `^[a-z0-9]+(-[a-z0-9]+)*$`, 1–64 chars
- [ ] `name` matches the directory name
- [ ] `description` is 1–1024 chars and describes trigger conditions
- [ ] Frontmatter delimited with `---`, valid YAML
- [ ] Body has at minimum: title + activation contract + one phase or section
- [ ] No Claude Code syntax remains (`$1`, `$ARGUMENTS`, hook blocks, slash refs)
- [ ] File path is `<base>/<name>/SKILL.md`

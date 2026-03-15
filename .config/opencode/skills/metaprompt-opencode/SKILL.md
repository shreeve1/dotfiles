---
name: metaprompt-opencode
description: Generate or convert OpenCode skills. Creates new SKILL.md files from a description, or converts existing Claude Code skills/commands (.claude/skills/, .claude/commands/) into OpenCode format. Use when asked to "create a skill", "make a skill", "convert a Claude skill", or "build a metaprompt for opencode".
---

# OpenCode Skill Generator

You are a skill architect for OpenCode. Your job is to create or convert high-quality `SKILL.md` files that follow OpenCode's exact format.

## Determine Mode First

Parse the user's request:
- **Create mode** — user describes what a new skill should do
- **Convert mode** — user references an existing Claude Code skill or command to convert (e.g. "convert the chrome-devtools skill")

Ask if the intent is unclear.

---

## OpenCode SKILL.md Format

Skills live at:
- **Project:** `.opencode/skills/<name>/SKILL.md`
- **Global:** `~/.config/opencode/skills/<name>/SKILL.md`

### Required Frontmatter

```yaml
---
name: skill-name
description: When and why agents should invoke this skill
---
```

**Name rules:** 1-64 chars, lowercase alphanumeric with single hyphens. Pattern: `^[a-z0-9]+(-[a-z0-9]+)*$`

**Description rules:** 1-1024 chars. This is how agents decide whether to load the skill — be specific about trigger conditions.

**Optional fields:** `license`, `compatibility`, `metadata` (string key-value pairs)

---

## CREATE MODE — New Skill from Description

### Step 1: Clarify intent
Ask the user:
1. What should this skill do? (if not already clear)
2. Should it be project-level (`.opencode/skills/`) or global (`~/.config/opencode/skills/`)? Default: project-level.

### Step 2: Generate the name
Derive a kebab-case name from the purpose. Validate it matches `^[a-z0-9]+(-[a-z0-9]+)*$`.

### Step 3: Write the description
The `description` field must answer: *when should an agent load this skill?* Include specific trigger phrases and use cases. Keep it under 1024 chars.

### Step 4: Write the body
Structure the markdown body to suit the skill's purpose. Include these sections as relevant:

```markdown
# Skill Title

Brief overview.

## When to Use This Skill

- Trigger condition 1
- Trigger condition 2

## Tools Required

- **ToolName** — why it's needed

## Key Principles

Core rules and behaviors.

## Workflow / Quick Reference / Common Patterns

(Adapt section names and content to the skill's domain)

## Guardrails

What this skill must NOT do (if applicable).

## Best Practices

Numbered tips.

## Troubleshooting

| Problem | Solution |
|---------|----------|
```

### Step 5: Save
1. Create directory: `<output-base>/<name>/`
2. Write `SKILL.md`

---

## CONVERT MODE — Claude Code → OpenCode

### Step 1: Locate the source file

Check in order:
1. `.claude/skills/<name>.md`
2. `.claude/commands/<name>.md`
3. `~/.claude/skills/<name>.md`
4. `~/.claude/commands/<name>.md`

Read the file before proceeding.

### Step 2: Field mapping

| Claude Code Field | OpenCode Action |
|---|---|
| `name` | Keep as `name` in frontmatter — validate against OpenCode naming rules |
| `description` | Keep as `description` — trim to 1024 chars if needed |
| `argument-hint` | Drop from frontmatter — weave argument guidance into skill body as "Usage" section |
| `model` | Drop — skills don't specify model |
| `context` | Drop — not applicable |
| `disallowed-tools` | Drop frontmatter — add a "Guardrails" section in the body listing prohibited actions |
| `hooks` | Drop — OpenCode skills have no hooks; convert validation steps into body instructions |
| `$1`, `$2`, `$ARGUMENTS` | Replace with plain-text descriptions of expected input |
| `${CLAUDE_SESSION_ID}` | Drop — no equivalent |
| `!`command`` | Drop or convert to a manual step in the workflow |

### Step 3: Restructure the body

1. Keep all core instructions, workflows, and reference content
2. Add "When to Use This Skill" section if missing
3. Add "Tools Required" section listing what the skill needs
4. Remove Claude Code-specific syntax (variable substitution, hook blocks, slash command refs)
5. If the source referenced other skills via `skills:` frontmatter field, list them in a "Related Skills" section — note they must be loaded separately in OpenCode
6. If the source was a command with phases, preserve them as-is

### Step 4: Scope decision
Ask the user: project-level (`.opencode/skills/`) or global (`~/.config/opencode/skills/`)? Default: project-level.

### Step 5: Save
1. Create `<output-base>/<name>/` directory
2. Write `SKILL.md`

---

## Validation Checklist

Before writing the file, verify:
- [ ] `name` matches `^[a-z0-9]+(-[a-z0-9]+)*$`, 1-64 chars
- [ ] `description` is 1-1024 chars and describes trigger conditions
- [ ] Frontmatter delimited with `---`, valid YAML
- [ ] Body has at minimum: title heading + purpose + trigger conditions
- [ ] No Claude Code syntax remains (`$1`, `$ARGUMENTS`, hooks, slash command syntax)
- [ ] File path is `<base>/<name>/SKILL.md`

---

## Report

After saving, output:

```
Skill saved: <name>
File: <full path>
Mode: Created | Converted from <source path>

Description:
  "<description field>"

Sections:
  - <list of ## headings>

Validation:
  name format ............. pass / fail
  description length ....... pass / fail
  frontmatter valid ........ pass / fail
  no Claude Code syntax .... pass / fail
```

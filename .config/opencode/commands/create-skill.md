---
description: Create a new OpenCode skill or convert an existing Claude Code skill into OpenCode format
agent: build
---

Create or convert an OpenCode skill. $ARGUMENTS

## Determine Mode

- **Create mode** — user describes what a new skill should do
- **Convert mode** — user references an existing Claude Code skill or command to convert

Ask if intent is unclear.

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

---

## CREATE MODE

1. Clarify what the skill should do and whether it should be project-level or global (default: project-level)
2. Derive a kebab-case name matching `^[a-z0-9]+(-[a-z0-9]+)*$`
3. Write a description that answers: *when should an agent load this skill?* Include specific trigger phrases.
4. Write the body with these sections as relevant:

```markdown
# Skill Title

Brief overview and activation contract (when to use, when not to).

## When to Use This Skill
## Tools Required
## Key Principles
## Workflow / Quick Reference / Common Patterns
## Guardrails
## Best Practices
## Troubleshooting
```

5. Create `<output-base>/<name>/` directory and write `SKILL.md`

---

## CONVERT MODE

1. Locate source file — check `.claude/skills/`, `.claude/commands/`, `~/.claude/skills/`, `~/.claude/commands/`
2. Apply field mapping:

| Claude Code Field | OpenCode Action |
|---|---|
| `name` | Keep — validate naming rules |
| `description` | Keep — trim to 1024 chars |
| `argument-hint` | Drop — weave into body as "Usage" section |
| `model`, `context` | Drop |
| `disallowed-tools` | Drop — add "Guardrails" section in body |
| `hooks` | Drop — convert to body instructions |
| `$1`, `$2`, `$ARGUMENTS` | Replace with plain-text input descriptions |
| `!`command`` | Convert to manual workflow step |

3. Restructure body: add "When to Use This Skill" and "Tools Required" sections if missing, remove Claude Code-specific syntax
4. Ask: project-level or global? (default: project-level)
5. Create directory and write `SKILL.md`

---

## Validation Checklist

- [ ] `name` matches `^[a-z0-9]+(-[a-z0-9]+)*$`, 1-64 chars
- [ ] `description` is 1-1024 chars and describes trigger conditions
- [ ] Frontmatter delimited with `---`, valid YAML
- [ ] Body has at minimum: title + purpose + trigger conditions
- [ ] No Claude Code syntax remains
- [ ] File path is `<base>/<name>/SKILL.md`

## Report

```
Skill saved: <name>
File: <full path>
Mode: Created | Converted from <source path>

Description: "<description>"
Sections: <list of ## headings>

Validation:
  name format ............. pass / fail
  description length ....... pass / fail
  frontmatter valid ........ pass / fail
  no Claude Code syntax .... pass / fail
```

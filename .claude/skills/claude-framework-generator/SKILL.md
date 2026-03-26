---
name: cc-claude-framework-generator
description: Interactive framework generator. Creates skills, subagents, and commands for the 3-layer Claude Code architecture. Walks through the complete setup process with templates and examples.
version: 1.0.0
category: meta
tags:
  - framework
  - generator
  - skills
  - subagents
  - commands
  - scaffolding
allowed-tools: ["Read", "Write", "Bash", "Glob", "Grep", "Edit"]
templates:
  workflow:
    - Identify domain and use case
    - Create SKILL.md with knowledge base
    - Create subagent(s) for behavior
    - Create command for orchestration
    - Review and finalize setup
---

# Claude Framework Generator

Interactive scaffolding tool for the 3-layer Claude Code architecture:
- **Layer 1: Skills** — Knowledge and documentation
- **Layer 2: Subagents** — Behavior that consumes skills
- **Layer 3: Commands** — Orchestration and routing

## When to Use This Skill

Use this skill when you want to:
- Create a new skill for a tool, API, or concept
- Build subagents that specialize in specific tasks
- Create commands that orchestrate multiple subagents
- Bootstrap a complete framework set for a new domain

**Prerequisites:**
- Clear understanding of the domain you're targeting
- Familiarity with the tool/API/concept for the skill layer
- Understanding of what tasks subagents should perform

## Framework Structure

```
.claude/
├── skills/
│   └── {domain}/
│       └── SKILL.md           # Knowledge base
├── agents/
│   └── {domain}/
│       ├── {subagent-1}.md    # Behavior 1
│       ├── {subagent-2}.md    # Behavior 2
│       └── ...
└── commands/
    └── {command}.md           # Orchestration
```

## Key Principles

1. **Start with knowledge (skills) before behavior (subagents)** — The skill layer provides the foundation that subagents consume
2. **One skill, many subagents (many-to-one consumption)** — Design skills to be reusable across multiple specialized subagents
3. **Thin commands that only route/orchestrate** — Commands should dispatch work, not contain business logic
4. **Use task lists for all execution** — Generate todos before execution to track progress and enable recovery
5. **Iterate based on real usage** — Start simple, enhance based on actual use cases

## Quick Reference

| Task | Approach |
|------|----------|
| Create new skill | Use this generator interactively |
| Add subagent to skill | Spawn framework-builder with skill context |
| Create command | Define orchestration pattern first (router/pipeline/etc.) |
| Debug framework | Check skill → subagent → command chain |
| Extend existing framework | Add subagents, don't modify skill core |

## Common Patterns

### 1. Router Pattern
Simple classification and dispatch based on input type.
- Use when: Input can be categorized into distinct types
- Example: Route API requests to different handlers

### 2. Pipeline Pattern
Sequential dependent steps where output of one feeds into next.
- Use when: Tasks have clear dependencies and order
- Example: Validate → Transform → Report

### 3. Scatter-Gather Pattern
Parallel subtasks with result aggregation.
- Use when: Tasks can run independently and results combine
- Example: Analyze multiple files simultaneously

### 4. Hierarchical Pattern
Coordinator manages multiple worker subagents.
- Use when: Complex workflows need central coordination
- Example: Project manager delegates to specialists

### 5. Adaptive Pattern
Choose pattern based on input analysis.
- Use when: Input variability requires dynamic routing
- Example: Simple queries use router, complex use pipeline

## Usage

### Option 1: Interactive Mode (Recommended)

Simply invoke the generator and follow the prompts:

```
Use skill cc-claude-framework-generator
```

The skill will walk you through:
1. Domain identification
2. Skill creation
3. Subagent creation (multiple allowed)
4. Command creation
5. Setup verification

### Option 2: Direct Generation

Generate components directly by specifying what you need:

```
Generate framework for:
- Domain: api-integration
- Skill: stripe-api
- Subagents: payment-processor, refund-handler
- Command: process-payment
```

## Generation Process

### Phase 1: Skill Creation

The generator will create a `SKILL.md` with:
- Frontmatter (name, description, tags, allowed-tools)
- When to use guidance
- Key principles for the domain
- Quick reference tables
- Common patterns and examples
- Task templates for subagents
- Troubleshooting section

### Phase 2: Subagent Creation

For each subagent, the generator creates:
- Frontmatter with skill reference
- Purpose and scope definition
- Step-by-step instructions
- Task list template
- Error handling guidance
- Examples specific to the domain

### Phase 3: Command Creation

The generator creates a command with:
- Router or orchestration pattern selection
- Argument parsing instructions
- Task list generation
- Subagent dispatch logic
- Result aggregation
- Output formatting

## Best Practices

1. **Start with the skill** — Knowledge must be solid before behavior
2. **One skill, many subagents** — Design for many-to-one consumption
3. **Thin commands** — Commands route; subagents work
4. **Use task lists** — Always generate todos before execution
5. **Iterate** — Start simple, enhance based on usage

## Templates Included

This skill includes templates for:
- `SKILL.md.template` — Universal skill structure
- `SUBAGENT.md.template` — Behavior definition
- `COMMAND.md.template` — Orchestration patterns

All templates use `{{variables}}` for customization.

## Examples

### Example: Data Processing Framework

**User Request:** "I want to create a framework for processing CSV files with pandas"

**Generated Structure:**
```
.claude/
├── skills/
│   └── pandas-data/
│       └── SKILL.md
├── agents/
│   └── data/
│       ├── data-validator.md
│       ├── data-transformer.md
│       └── data-reporter.md
└── commands/
    └── process-data.md
```

### Example: API Integration Framework

**User Request:** "Create a framework for Stripe API operations"

**Generated Structure:**
```
.claude/
├── skills/
│   └── stripe-api/
│       └── SKILL.md
├── agents/
│   └── payments/
│       ├── payment-creator.md
│       ├── refund-processor.md
│       └── webhook-handler.md
└── commands/
    └── manage-payments.md
```

## Integration

### Works With
- Any skill that needs subagents for behavior
- Commands requiring orchestration patterns
- Existing skills for pattern reference

### Related Skills
- **brainstorm-idea** — Use for initial concept exploration before framework generation
- **metateam** — Use when creating multi-agent teams that use your framework

## Security Considerations

### Generated Files
- Review all generated files before committing to version control
- Templates contain placeholders, not secrets — verify no hardcoded values
- Ensure generated commands validate inputs before passing to subagents

### Best Practices
- Never include API keys, tokens, or passwords in generated templates
- Use `.gitignore` for sensitive paths that frameworks may reference
- Document security requirements in generated SKILL.md

## Next Steps After Generation

1. **Review generated files** — Check that content matches your intent
2. **Customize templates** — Add domain-specific details
3. **Test incrementally** — Start with skill, then subagent, then command
4. **Iterate** — Refine based on real usage
5. **Document** — Add examples and edge cases as you discover them

## Troubleshooting

### Generator doesn't understand my domain
- Be more specific about the tool or concept
- Provide examples of what you want to accomplish
- Reference similar existing skills

### Generated content is too generic
- This is expected — templates need customization
- Use the generated files as starting points
- Add specific commands, patterns, and examples

### Not sure how many subagents to create
- Start with one subagent per major task type
- You can always add more later
- Follow the pattern: validate → transform → report

## Resources

- **Framework Guide:** See `examples/` directory for complete working examples
- **Template Reference:** All templates include usage comments
- **Best Practices:** See brainstorm-idea documentation for deep dive

---

**Ready to generate?** Start with "Create framework for [your domain]"

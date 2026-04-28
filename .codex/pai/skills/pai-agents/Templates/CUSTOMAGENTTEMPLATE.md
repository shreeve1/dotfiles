# Custom Agent Template

> Canonical identity schema for all PAI agents - built-in and custom.

## Template Usage

- **Built-in agents** (`.codex/pai/agents/*.md`): Use this format for the persona section
- **Custom agents** (`.codex/pai/custom-agents/*.md`): Use this format for the entire file
- **Dynamic agents** (ComposeAgent ephemeral): Generated prompts follow this structure

---

## YAML Frontmatter Schema

```yaml
---
# === Identity ===
name: ""                    # Agent type name (e.g., "Engineer", "SecurityAnalyst")
description: ""             # One-line functional description
model: opus                 # opus | sonnet | haiku
color: ""                   # Hex color for terminal output (e.g., "#9B59B6")

# === Permissions (Codex tool access) ===
permissions:
  allow:
    - "Bash"
    - "Read(*)"
    - "Write(*)"
    - "Edit(*)"
    - "MultiEdit(*)"
    - "Grep(*)"
    - "Glob(*)"
    - "web access(domain:*)"
    - "mcp__*"
    - "TodoWrite(*)"

# === Custom Agent Metadata (omit for built-in agents) ===
custom_agent: true          # Distinguishes from built-in agents
created: ""                 # ISO date (e.g., "2026-02-12")
traits: []                  # ComposeAgent trait keys used to create this agent
source: "ComposeAgent"      # Creation method
---
```

---

## Markdown Body Structure

## Point of View

[What this agent believes about their domain. Their worldview.
What principles guide their work. What hills they'd die on.
2-3 short paragraphs.]

## Opinions

[Strong opinions this agent holds. Things they'd push back on.
Preferences that color their work. Written as bullet points.]

- [Opinion 1]
- [Opinion 2]
- [Opinion 3]

## Personality Traits

- [Trait 1 - brief explanation of how it manifests]
- [Trait 2 - brief explanation]
- [Trait 3 - brief explanation]
- [Trait 4 - brief explanation]
- [Trait 5 - brief explanation]

## Communication Style

"[Example phrase 1]" | "[Example phrase 2]" | "[Example phrase 3]"

[Brief description of how they communicate - speed, formality, verbal tics,
characteristic expressions, emotional range.]

# Operational Context

## Startup Sequence

\`\`\`bash
  -H "Content-Type: application/json" \
\`\`\`

2. Load knowledge base:
   - Read: [relevant context files]

## Output Format

[Standard PAI output format with sections:
SUMMARY, ANALYSIS, ACTIONS, RESULTS, STATUS, CAPTURE, NEXT, STORY EXPLANATION, COMPLETED]
```

---

## Custom Agent vs Built-in Agent Differences

| Aspect | Built-in (`agents/*.md`) | Custom (`custom-agents/*.md`) |
|--------|-------------------------|-------------------------------|
| Location | `.codex/pai/agents/` | `.codex/pai/custom-agents/` |
| `custom_agent` field | Omitted | `true` |
| `created` field | Omitted | ISO date |
| `traits` field | Omitted | ComposeAgent trait keys |
| `source` field | Omitted | `"ComposeAgent"` or `"manual"` |
| Permissions | Full custom permissions block | Standard permissions (can customize) |
| `subagent_type` | Uses agent name (e.g., `Engineer`) | Always `general-purpose` |
| Lifecycle | Permanent, ships with PAI | User-managed (create/delete) |

---
name: "pai-thinking-council"
description: "PAI Codex port: Multi-agent debate with visible transcripts where agents respond to each other. USE WHEN council, debate, perspectives, weigh options, deliberate, multiple viewpoints. Unlike RedTeam (adversarial), Council is collaborat..."
---

# Council

This is a Codex-native port of an upstream PAI skill. Codex instructions, local tools, and higher-priority AGENTS.md guidance take precedence.

Use local Codex skills, shell tools, subagents, and web access only when the current session permits them. Do not assume external providers are configured.

## Gated Dependencies

- External media processing tools

## Ported Workflow

## Customization

**Before executing, check for user customizations at:**
`.codex/pai/PAI/USER/SKILLCUSTOMIZATIONS/Council/`

If this directory exists, load and apply any PREFERENCES.md, configurations, or resources found there. These override default behavior. If the directory does not exist, proceed with skill defaults.


# Council Skill

Multi-agent debate system where specialized agents discuss topics in rounds, respond to each other's points, and surface insights through intellectual friction.

**Key Differentiator from RedTeam:** Council is collaborative-adversarial (debate to find best path), while RedTeam is purely adversarial (attack the idea). Council produces visible conversation transcripts; RedTeam produces steelman + counter-argument.


## Workflow Routing

Route to the appropriate workflow based on the request.


```
Running the **WorkflowName** workflow in the **Council** skill to ACTION...
```

| Trigger | Workflow |
|---------|----------|
| Full structured debate (3 rounds, visible transcript) | `Workflows/Debate.md` |
| Quick consensus check (1 round, fast) | `Workflows/Quick.md` |
| Pure adversarial analysis | RedTeam skill |

## Quick Reference

| Workflow | Purpose | Rounds | Output |
|----------|---------|--------|--------|
| **DEBATE** | Full structured discussion | 3 | Complete transcript + synthesis |
| **QUICK** | Fast perspective check | 1 | Initial positions only |

## Context Files

| File | Content |
|------|---------|
| `RoundStructure.md` | Three-round debate structure and timing |
| `OutputFormat.md` | Transcript format templates |

## Core Philosophy

**Origin:** Best decisions emerge from diverse perspectives challenging each other. Not just collecting opinions - genuine intellectual friction where experts respond to each other's actual points.

**Speed:** Parallel execution within rounds, sequential between rounds. A 3-round debate of 4 agents = 12 agent calls but only 3 sequential waits. Complete in 30-90 seconds.

## Examples

```
"Council: Should we use WebSockets or SSE?"
-> Invokes DEBATE workflow -> 3-round transcript

"Quick council check: Is this API design reasonable?"
-> Invokes QUICK workflow -> Fast perspectives

"Council with security: Evaluate this auth approach"
-> DEBATE with Security agent added
```

## Integration

**Works well with:**
- **RedTeam** - Pure adversarial attack after collaborative discussion
- **Development** - Before major architectural decisions
- **Research** - Gather context before convening the council

## Best Practices

1. Use QUICK for sanity checks, DEBATE for important decisions
2. Add domain-specific experts as needed (security for auth, etc.)
3. Review the transcript - insights are in the responses, not just positions
4. Trust multi-agent convergence when it occurs

---

**Last Updated:** 2025-12-20

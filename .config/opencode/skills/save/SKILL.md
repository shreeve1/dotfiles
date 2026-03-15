---
name: save
description: Persist important session or project knowledge into local documentation or saved session artifacts. Use when the user asks to remember something for later, preserve conventions, or capture reusable notes in an OpenCode-friendly way.
compatibility: adapted-for-opencode
metadata:
  source: /Users/james/.pi/agent/skills/pi-save/SKILL.md
  original_name: pi-save
---

# OpenCode Memory — Save to Knowledge Base

Converted from `/Users/james/.pi/agent/skills/pi-save/SKILL.md`. Imported as `save` for OpenCode.

## Compatibility Notes

- This is an imported OpenCode-adapted copy of a skill from `~/.opencode/agent/skills/`.
- Tool names were rewritten to the closest OpenCode equivalents where possible.
- If this skill mentions pi-only capabilities such as persistent vector memory, background subagents, or plan-state helpers, use local files, `task`, `todowrite`, and `read`/`grep` as the closest OpenCode-native substitutes.

---

Use this skill whenever you need to persist information for future sessions. The knowledge base is a local vector store powered by Ollama (`nomic-embed-text`). Content saved here is searchable via `grep`/`read` over local notes in any future session.

---

## When to Use

- User says "remember this", "save this", "add this to memory"
- You've just learned something valuable about the user's infrastructure, clients, or project conventions
- End of a session that produced useful runbooks, configs, or decisions
- After reading documentation that will be needed repeatedly

---

## What to Save

**Good candidates:**
- Infrastructure details (server IPs, hostnames, services, credentials patterns)
- Project conventions and architectural decisions
- Runbooks and troubleshooting steps
- Client environment details
- API patterns or integration notes

**Skip:**
- Ephemeral data (one-off values, timestamps, draft thoughts)
- Content the user explicitly says is temporary

---

## How to Save

Call `document` or local notes with:

- `content` — the full text to save. Be thorough; more context = better recall.
- `source` — a concise label identifying where this came from. Use lowercase-kebab format.

**Source label conventions:**
| Type | Example |
|---|---|
| Infrastructure | `infra-proxmox`, `infra-k8s-prod` |
| Client | `client-acme`, `client-initech` |
| Project | `project-api-gateway` |
| Docs | `docs-terraform`, `docs-nginx` |
| Session notes | `session-2026-03-02` |
| Runbook | `runbook-deploy`, `runbook-incident` |

---

## Before Saving — Search First

Before saving new content, call `grep`/`read` over local notes with the key topic to check if it already exists. If similar content is found:
- If it's outdated → save the updated version (duplicates are hash-deduplicated at the chunk level)
- If it's current → skip saving and tell the user it's already in the knowledge base

---

## Formatting Content for Best Recall

Structure content clearly before saving:

```
# <Topic Title>

## Context
<What this is about, why it matters>

## Details
<The actual information — be specific>

## Notes
<Caveats, last-updated date, related topics>
```

Plain prose is fine for shorter items. The chunker splits on ~250 words with 50-word overlap, so dense bullet lists work well.

---

## After Saving

Report back:
```
Saved to memory ✓
  Source:  <source-label>
  Chunks:  <N> new chunks added
  Total:   <N> chunks in knowledge base

Tip: Search with `grep`/`read` over local notes in any future session.
```

If save fails (Ollama not running):
```
Save failed — Ollama is not reachable at http://localhost:11434
Start it with: ollama serve
Then retry.
```

---

## Searching Memory

When starting work on a familiar topic, proactively call `grep`/`read` over local notes to pull relevant context. Don't wait for the user to ask — if you're about to work on something that might have prior context (infra, clients, known projects), search first.

Use 2–3 targeted queries rather than one broad one for better recall coverage.

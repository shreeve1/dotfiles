---
name: dev-prd
description: Create a lean, AI-agent-actionable Product Requirements Document from a raw idea, notes, brainstorming output, or partial spec through a guided interview and validation process. Use when the user asks to create a PRD, write product requirements, turn an idea into a spec, define features, capture product vision, or convert brainstorming notes into buildable requirements.
---

# Dev PRD

Create a concise, buildable PRD that another coding agent or developer can implement without guessing.

## Workflow

1. Confirm the idea and any source notes.
2. Ask only the clarifying questions needed to make the PRD buildable.
3. Define target user, problem, scope, features, acceptance criteria, technical constraints, and out-of-scope items.
4. Use `references/prd-format.md` for the final document structure.
5. Save the PRD under `artifacts/specs/{slug}/PRD.md`.

Read `references/create-prd.md` for the full multi-phase workflow when the request requires a guided interview, draft persistence, source discovery, or detailed PRD generation.

## Codex Adaptation

- Do not use source-system voice-notification hooks.
- Use normal conversation for decisions; ask directly when needed.
- Use subagents only when the user explicitly asks for delegated research or parallel agent work and the session permits it.
- Keep the PRD lean. Remove sections that do not help implementation.

## Paths

All artifacts use the canonical layout at `artifacts/{kind}/{slug}/`. See `~/.codex/skills/dev-development/references/Paths.md` for slug rules and the full directory map.

## Output

Report the saved PRD path, scope, core features, requirement tag count, and recommended next step, usually `$dev-plan`.

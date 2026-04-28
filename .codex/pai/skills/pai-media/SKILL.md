---
name: "pai-media"
description: "PAI Codex port: Visual and video content creation - illustrations, diagrams, mermaid flowcharts, infographics, header images, PAI pack icons, thumbnails, comics, and programmatic video via Remotion. USE WHEN art, header images, visuali..."
---

# Media

This is a Codex-native port of an upstream PAI skill. Codex instructions, local tools, and higher-priority AGENTS.md guidance take precedence.

Use local Codex skills, shell tools, subagents, and web access only when the current session permits them. Do not assume external providers are configured.

## Gated Dependencies

- External media processing tools

## Ported Workflow

# Media

Unified skill for visual and video content creation.

## Workflow Routing

| Request Pattern | Route To |
|---|---|
| Art, header images, visualizations, mermaid, diagrams, flowcharts, infographics, pack icons | `Art/SKILL.md` |
| Video, animation, motion graphics, video rendering, Remotion, React video | `Remotion/SKILL.md` |

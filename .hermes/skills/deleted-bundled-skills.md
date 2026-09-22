# Hermes Bundled Skills Deletion Manifest

This document tracks upstream bundled Hermes skills intentionally removed from `~/.hermes/skills/`.
It is portable configuration for reapplying those removals after `hermes update` on other systems.

## Upstream baseline

- Repository: `git@github.com:NousResearch/hermes-agent.git`
- Revision: `fca3221df48d4ae1e4db9e8a1a041de21ea4d9cf`
- Source tree: `skills/`
- Bundled skills recorded: 58
- Excludes optional, hub-installed, external, and Hermes-created local skills.

## Intentionally deleted skills

Recorded by comparing the upstream bundled inventory with `~/.hermes/skills/` after cleanup.
Deleted bundled skills: 42.

| Skill | Upstream path |
|---|---|
| `apple-notes` | `skills/apple/apple-notes/` |
| `apple-reminders` | `skills/apple/apple-reminders/` |
| `findmy` | `skills/apple/findmy/` |
| `imessage` | `skills/apple/imessage/` |
| `claude-code` | `skills/autonomous-ai-agents/claude-code/` |
| `codex` | `skills/autonomous-ai-agents/codex/` |
| `opencode` | `skills/autonomous-ai-agents/opencode/` |
| `architecture-diagram` | `skills/creative/architecture-diagram/` |
| `ascii-video` | `skills/creative/ascii-video/` |
| `baoyu-infographic` | `skills/creative/baoyu-infographic/` |
| `claude-design` | `skills/creative/claude-design/` |
| `design-md` | `skills/creative/design-md/` |
| `humanizer` | `skills/creative/humanizer/` |
| `manim-video` | `skills/creative/manim-video/` |
| `p5js` | `skills/creative/p5js/` |
| `popular-web-designs` | `skills/creative/popular-web-designs/` |
| `songwriting-and-ai-music` | `skills/creative/songwriting-and-ai-music/` |
| `email-inbox-triage` | `skills/email/email-inbox-triage/` |
| `himalaya` | `skills/email/himalaya/` |
| `gif-search` | `skills/media/gif-search/` |
| `songsee` | `skills/media/songsee/` |
| `youtube-content` | `skills/media/youtube-content/` |
| `obsidian` | `skills/note-taking/obsidian/` |
| `airtable` | `skills/productivity/airtable/` |
| `box` | `skills/productivity/box/` |
| `document-to-action-items` | `skills/productivity/document-to-action-items/` |
| `docx` | `skills/productivity/docx/` |
| `google-workspace` | `skills/productivity/google-workspace/` |
| `maps` | `skills/productivity/maps/` |
| `meeting-action-items` | `skills/productivity/meeting-action-items/` |
| `notion` | `skills/productivity/notion/` |
| `pdf` | `skills/productivity/pdf/` |
| `powerpoint` | `skills/productivity/powerpoint/` |
| `product-price-monitor` | `skills/productivity/product-price-monitor/` |
| `teams-meeting-pipeline` | `skills/productivity/teams-meeting-pipeline/` |
| `weekly-review-planning` | `skills/productivity/weekly-review-planning/` |
| `xlsx` | `skills/productivity/xlsx/` |
| `arxiv` | `skills/research/arxiv/` |
| `competitor-news-monitor` | `skills/research/competitor-news-monitor/` |
| `llm-wiki` | `skills/research/llm-wiki/` |
| `xurl` | `skills/social-media/xurl/` |
| `blocked-page-recovery` | `skills/web/blocked-page-recovery/` |

## Upstream bundled inventory

- `apple-notes` — `skills/apple/apple-notes/`
- `apple-reminders` — `skills/apple/apple-reminders/`
- `findmy` — `skills/apple/findmy/`
- `imessage` — `skills/apple/imessage/`
- `claude-code` — `skills/autonomous-ai-agents/claude-code/`
- `codex` — `skills/autonomous-ai-agents/codex/`
- `computer-use` — `skills/autonomous-ai-agents/computer-use/`
- `hermes-agent` — `skills/autonomous-ai-agents/hermes-agent/`
- `opencode` — `skills/autonomous-ai-agents/opencode/`
- `architecture-diagram` — `skills/creative/architecture-diagram/`
- `ascii-video` — `skills/creative/ascii-video/`
- `baoyu-infographic` — `skills/creative/baoyu-infographic/`
- `claude-design` — `skills/creative/claude-design/`
- `design-md` — `skills/creative/design-md/`
- `humanizer` — `skills/creative/humanizer/`
- `manim-video` — `skills/creative/manim-video/`
- `p5js` — `skills/creative/p5js/`
- `popular-web-designs` — `skills/creative/popular-web-designs/`
- `songwriting-and-ai-music` — `skills/creative/songwriting-and-ai-music/`
- `sdlc-review` — `skills/devops/sdlc-review/`
- `email-inbox-triage` — `skills/email/email-inbox-triage/`
- `himalaya` — `skills/email/himalaya/`
- `gif-search` — `skills/media/gif-search/`
- `songsee` — `skills/media/songsee/`
- `youtube-content` — `skills/media/youtube-content/`
- `obsidian` — `skills/note-taking/obsidian/`
- `airtable` — `skills/productivity/airtable/`
- `box` — `skills/productivity/box/`
- `document-to-action-items` — `skills/productivity/document-to-action-items/`
- `docx` — `skills/productivity/docx/`
- `google-workspace` — `skills/productivity/google-workspace/`
- `maps` — `skills/productivity/maps/`
- `meeting-action-items` — `skills/productivity/meeting-action-items/`
- `notion` — `skills/productivity/notion/`
- `pdf` — `skills/productivity/pdf/`
- `powerpoint` — `skills/productivity/powerpoint/`
- `product-price-monitor` — `skills/productivity/product-price-monitor/`
- `teams-meeting-pipeline` — `skills/productivity/teams-meeting-pipeline/`
- `weekly-review-planning` — `skills/productivity/weekly-review-planning/`
- `xlsx` — `skills/productivity/xlsx/`
- `arxiv` — `skills/research/arxiv/`
- `competitor-news-monitor` — `skills/research/competitor-news-monitor/`
- `grounded-citations` — `skills/research/grounded-citations/`
- `llm-wiki` — `skills/research/llm-wiki/`
- `xurl` — `skills/social-media/xurl/`
- `codebase-inspection` — `skills/software-development/codebase-inspection/`
- `dogfood` — `skills/software-development/dogfood/`
- `github` — `skills/software-development/github/`
- `hermes-agent-skill-authoring` — `skills/software-development/hermes-agent-skill-authoring/`
- `inspecting-hermes-desktop-dom` — `skills/software-development/inspecting-hermes-desktop-dom/`
- `node-inspect-debugger` — `skills/software-development/node-inspect-debugger/`
- `python-debugpy` — `skills/software-development/python-debugpy/`
- `requesting-code-review` — `skills/software-development/requesting-code-review/`
- `simplify-code` — `skills/software-development/simplify-code/`
- `spike` — `skills/software-development/spike/`
- `systematic-debugging` — `skills/software-development/systematic-debugging/`
- `test-driven-development` — `skills/software-development/test-driven-development/`
- `blocked-page-recovery` — `skills/web/blocked-page-recovery/`

## Maintenance workflow

1. Run `hermes update`.
2. Reapply the deletions recorded above to `~/.hermes/skills/`.
3. Refresh the upstream baseline and inventory when Hermes adds, removes, renames, or moves bundled skills.
4. Keep Hermes-created/local skills out of this manifest.

---
title: pi Tool-Call Content Blocks
summary: In pi messages a tool call is a toolCall block (name, arguments), not Anthropic's tool_use/input; parsing tool_use silently finds nothing.
type: doc
status: promoted
created: 2026-10-25
updated: 2026-10-25
topics: []
---

## Active memory

- pi's assistant content-block type for a tool call is `toolCall` (camelCase), not Anthropic's `tool_use`. The tool name is `block.name` and the arguments are in `block.arguments`; the read tool reports `.path`, not `.file_path`.
- Code that looks for `tool_use` / `input` silently does nothing on pi transcripts. Use this shape in any extension or script that reads pi sessions.

## Related

- `docs/pi-extensions.md` - event timing (`turn_end` fires per agent step).

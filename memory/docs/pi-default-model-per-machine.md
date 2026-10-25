---
title: pi Default Model Is Per Machine
summary: pi's defaultModel lives in each machine's gitignored .pi/agent/settings.json; a change must be made on every machine, only the template travels by git.
type: doc
status: promoted
created: 2026-10-25
updated: 2026-10-25
topics: []
---

## Active memory

- pi's default model is `defaultModel` in each machine's `.pi/agent/settings.json` (currently `glm-5.3`). That file is gitignored (`.gitignore`, `.pi/agent/settings.json`), so changing the default means editing it on every machine directly.
- Only `.pi/agent/settings.json.template` travels by git; a fresh machine copies it by hand (`README.md`). Update the template too so new machines match.

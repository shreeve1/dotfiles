---
title: pi Default Model Is Per Machine
summary: pi's defaultModel lives in each machine's gitignored .pi/agent/settings.json; a change must be made on every machine, only the template travels by git.
type: doc
status: promoted
created: 2026-10-25
updated: 2026-10-28
topics: []
---

## Active memory

- pi's default model is `defaultModel` in each machine's `.pi/agent/settings.json` (currently `minimax-m3` at `defaultThinkingLevel` `high`, set on aidev, itan8n, wrk WSL, wrk Windows and surftop 2026-10-28). That file is gitignored (`.gitignore`, `.pi/agent/settings.json`), so changing the default means editing it on every machine directly.
- `.pi/agent/models.json` is gitignored per machine too. `.pi/agent/advisor.json` (aidev, itan8n) is a leftover: no loaded extension reads it since pi-advisor-flow was archived on 2026-10-16, so editing it changes nothing. A model rename must also change the alias in cliproxy's `~/cliproxyapi/config.yaml` on both aidev and itan8n, and cliproxy reads that file only at start: `systemctl --user restart cliproxyapi`. wrk and surftop use aidev's proxy.
- Only `.pi/agent/settings.json.template` travels by git; a fresh machine copies it by hand (`README.md`). Update the template too so new machines match.

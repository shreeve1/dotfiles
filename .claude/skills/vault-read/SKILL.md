---
name: vault-read
description: Answer a question from the personal Obsidian vault at /home/james/ob. Use when the user asks "what does my vault know about X", "check my notes/vault", or wants past learnings, client records, or personal notes recalled from any session.
---

Vault root: `/home/james/ob`.

1. Read `/home/james/ob/Index.md`, then grep `1.Work/`, `2.Personal/`, `3.Resources/`, `Daily/` for terms the index misses. Skip `.obsidian/`, `Sync/`, `config/`, `logs/`, `.brainstorming/`.
2. Read the matching notes fully before answering.
3. Answer with citations as vault paths (e.g. `3.Resources/1.Docker/Foo.md`). If nothing relevant exists, say so plainly — never present model knowledge as vault content.

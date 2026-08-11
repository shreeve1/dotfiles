---
disable-model-invocation: true
name: vault-todo
description: Create, complete, or list todos in the Obsidian vault using the Tasks-plugin format. Use when the user says "add a todo", "remind me to", "vault todo", "mark X done", or "what's on my todo list".
---

Vault root: `~/ob` (resolve `~` from the current user's home directory; do not hardcode `/home/...` or `/Users/...`). Todos use Tasks-plugin emoji format and MUST carry the `#task` tag — untagged checkboxes are invisible to the todo plugins.

Format: `- [ ] #task description 📅 YYYY-MM-DD` — due date only if the user gave one (`⏳` scheduled, `🔁` recurrence, `- [/]` in progress).

**Create** (only on explicit request — never invent todos):
- Default target: `ToDos.md` under `# Active`.
- If the user says "today" or it's day-specific: today's daily note at `Daily/YYYY/MonthName/DD-MM-YYYY.md` (create from `Templates/Daily Notes.md` if missing).
- One line per todo. Work-ticket todos may include the Halo ticket URL.

**Complete**: check the box and append ` ✅ YYYY-MM-DD` (today). Never strip existing `✅` dates.

After any create or complete, append a line to `~/ob/log.md` (`YYYY-MM-DD HH:MM | vault-todo | path | summary`).

**List**: grep `- \[ \] #task` across `ToDos.md`, `Daily/`, `1.Work/`, `2.Personal/`. Report with file paths; flag anything with a past-due `📅` date.

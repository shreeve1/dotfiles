---
name: vault-save
description: Save a learning, decision, or note from the current session into the Obsidian vault at /home/james/ob. Use when the user says "save this to my vault", "vault this", "add to my notes", or wants knowledge from any repo or session captured permanently.
---

Vault root: `/home/james/ob`. Read `/home/james/ob/CLAUDE.md` first — it owns the filing rules.

1. Distill what to keep: the reusable lesson, decision, or reference — not a transcript. One note per distinct topic.
2. Decide placement per the vault's filing rules (knowledge → `3.Resources/<tech>/`, records → `1.Work/2.Clients/<client>/` or `2.Personal/`, unsure → specific location + `#candidate` tag). Create folders only per the rules.
3. Search the vault for related existing notes first — extend or [[wikilink]] them rather than duplicating.
4. Write the note per the vault's note conventions. No secrets anywhere; no client identifiers in Resources.
5. Add a one-line entry to `/home/james/ob/Index.md` under the matching section, and append a line to `/home/james/ob/log.md` (`YYYY-MM-DD HH:MM | vault-save | path | summary`).
6. Tell the user the path(s) you filed to.

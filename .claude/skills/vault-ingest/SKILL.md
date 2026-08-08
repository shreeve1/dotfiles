---
disable-model-invocation: true
name: vault-ingest
description: Extract notes, decisions, and knowledge from meeting-transcription summaries in the Obsidian vault's Transcriptions/ folder (or any file the user points at). Use when the user says "ingest transcriptions", "process transcriptions", or "extract notes from this transcript".
---

Vault root: `~/ob` (resolve `~` from the current user's home directory; do not hardcode `/home/...` or `/Users/...`). Read `~/ob/CLAUDE.md` first — it owns the filing rules. Transcriptions land in `Transcriptions/` as `Title - YYYY-MM-DD_HH-MM-SS.md`, written by an external app: **never move, rename, or edit files in that folder.**

File quirks: some files append the full raw transcript below the summary with no section marker (check size first — summaries are ~2KB); extract from the summary only. Heading styles vary between files (`**Bold:**` vs `1. Numbered`) — never rely on exact headers.

Client attribution: file into a client folder only when the client is **explicitly named** in the content. An inferred match (folder cross-reference, location names, personnel overlap) is not enough — inference misfiled a client before. If inferred, unknown, or a prospect: file in `1.Work/2.Clients/Prospects/` and ask the user in the report.

1. Find unprocessed files: those with no `vault-ingest` line in `log.md` (the dedup ledger). Process oldest first — or only the file(s) the user named.
2. For each, read fully and file per the vault rules:
   - Meeting record → `1.Work/` (client meeting → `2.Clients/<client>/`, internal → `3.Internal/` or the matching L10 folder): decisions, concerns, next steps, and a [[wikilink]] to the raw transcription. Condense — it's a record, not a copy.
   - Reusable knowledge mentioned in passing → separate sanitized note in `3.Resources/<tech>/` per the split rule.
3. Action items stay plain `-` bullets in the meeting note. Do NOT create `#task` todos unless the user explicitly asked for todos this run.
4. Update `Index.md`; append one `log.md` line per transcription processed.
5. Report: files processed, notes created, and the action items found — so the user can pick which become todos.

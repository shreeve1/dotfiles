# Learning Capture

Use persistent learning tools to keep high-signal discoveries available across sessions:
- `add_session_note()` — default tool for short, append-only observations
- `update_expertise()` — use sparingly when a discovery changes your durable understanding of how this team should work

## Cadence

Write at least one session note in every substantive session — any session where you completed meaningful work, found something unexpected, or uncovered a recurring risk.

## What to Capture

Capture only information that will help a future session move faster or avoid a mistake:
- non-obvious codebase patterns or conventions
- undocumented behavior, gotchas, or surprising architecture details
- important dependency or control-flow relationships
- recurring risks or repeated failure modes
- durable gaps in tests, docs, or infrastructure

## Quick Examples

- **Scout / Investigator:** where behavior actually lives, surprising control flow, or what was searched but not found
- **Builder:** implementation conventions, dependency assumptions, or patterns future changes should follow
- **Reviewer:** recurring plan or code review failures worth checking early next time
- **Tester:** verification gaps, brittle environments, or acceptance criteria that commonly lack coverage

## What NOT to Capture

Do not waste note space on:
- obvious facts visible from filenames alone
- a restatement of the task you were assigned
- a full file-by-file change log already preserved elsewhere
- information already captured in expertise

## Rules of Thumb

- Prefer `add_session_note()` unless the insight clearly belongs in long-term expertise
- Keep notes concise — usually 1-3 sentences
- Avoid duplication; add only the new fact or pattern
- Optimize for future usefulness, not completeness

## Note Compaction

When notes grow to roughly 15+ entries, compact older ones with `compact_session_notes` so recent notes stay visible and older patterns remain available in summary form.

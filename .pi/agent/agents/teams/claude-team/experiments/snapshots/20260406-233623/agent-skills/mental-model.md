# Learning Capture

Use persistent learning tools to preserve only future-useful signal:
- `add_session_note()` — default for short append-only observations
- `update_expertise()` — only when durable team guidance should change
- `compact_session_notes` — when notes reach ~15 entries or become repetitive

## Minimum

In every substantive session, record at least one note.

## Capture

Capture only things a future session would not infer quickly:
- non-obvious repo conventions, architecture edges, or control-flow relationships
- undocumented behavior, repeated failure modes, or notable absences
- durable gaps in tests, docs, or infrastructure
- failed searches or dead ends that should change how future work starts

## Skip

Skip task restatements, obvious filename facts, full change logs, and anything already covered in expertise.

## Quality

Prefer `add_session_note()`. Keep notes to 1-3 sentences, capture one new fact or pattern per note, and avoid duplicates.
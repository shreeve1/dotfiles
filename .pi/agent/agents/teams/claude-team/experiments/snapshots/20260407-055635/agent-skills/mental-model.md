# Learning Capture

Use persistent learning tools to keep high-signal discoveries available across sessions:
- `add_session_note()` — default for short, append-only observations
- `update_expertise()` — only when a discovery changes durable team guidance
- `compact_session_notes` — use when notes reach roughly 15+ entries

## Minimum Cadence

In every substantive session, write at least one session note.

## Capture Only Future-Useful Signal

Capture information that will help a future session move faster or avoid a mistake:
- non-obvious repo conventions, architecture details, or control-flow relationships
- undocumented behavior, surprising gotchas, or repeated failure modes
- durable gaps in tests, docs, or infrastructure
- key searches that failed or evidence that was notably absent when that changes future work

## Skip

Do not capture:
- obvious facts from filenames alone
- a restatement of the assigned task
- full change logs already preserved elsewhere
- details already covered by expertise

## Quality Bar

- Prefer `add_session_note()` unless the insight clearly belongs in expertise
- Keep notes concise — usually 1-3 sentences
- Add only the new fact or pattern; avoid duplication
- Optimize for future usefulness, not completeness

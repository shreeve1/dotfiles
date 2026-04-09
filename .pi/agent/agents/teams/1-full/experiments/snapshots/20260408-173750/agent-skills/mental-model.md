# Learning Capture

Keep only future-useful signal in persistent learning tools:
- `add_session_note()` — default for short append-only observations
- `update_expertise()` — only for durable team guidance changes
- `compact_session_notes` — when notes reach ~15 entries or get repetitive

## When to Record Session Notes

**Always** call `add_session_note()` before finishing any substantive task. Make this a mandatory habit, not optional.

A "substantive task" is anything where you:
- Investigate a bug or unexpected behavior
- Discover architecture patterns or repo conventions
- Hit dead ends that others should avoid
- Find undocumented behaviors or hidden dependencies
- Learn a workflow that worked (or didn't work)
- Make decisions based on new context

Don't skip this step. Before you finish, ask: "What did I learn that would help me (or another agent) do this faster next time?" If the answer is non-empty, record it.

## What Makes a Good Session Note

Keep notes to 1-3 sentences and center on one non-obvious reusable fact.

**Good topics:**
- Repo conventions discovered (e.g., "Test files live in `__tests__/` not `tests/`")
- Architecture edges found (e.g., "Auth middleware runs before rate limiting, not after")
- Undocumented behavior (e.g., "The build script silently ignores missing env vars")
- Repeated failure modes (e.g., "CI fails if PR description contains 'WIP' even with labels")
- Dead ends worth avoiding (e.g., "Don't use the v2 API — it's deprecated but not removed")
- Patterns that worked well (e.g., "Use `grep --include='*.ts'` to avoid node_modules noise")

**Anti-patterns:**
- Task restatements ("Fixed the login bug by updating the auth token")
- Obvious filename facts ("The config file is in config/")
- Full change logs or git commit summaries
- Duplicates of what's already in your expertise file
- Repetitive notes about the same thing

## When to Update Expertise

Don't update your expertise file after every task. Batch it.

Every 5-10 session notes accumulated, review them and fold durable learnings into your expertise via `update_expertise()`. Ask:
- Is this pattern repeated across sessions?
- Will this be useful for many future tasks?
- Is this a structural fact about the project or domain?

If yes, move it from session notes to expertise. If no, leave it as a note.

You own your expertise file. Reorganize it as you learn. Add sections that make sense for YOUR work. Remove sections that aren't useful. The initial structure is a starting template, not a rigid format.

## Compact Session Notes

When session notes reach ~15-20 entries, use `compact_session_notes()` to summarize and compress. Don't let notes grow unbounded.

Compression guidelines:
- Keep the strongest, most reusable insights
- Summarize related notes into single entries
- Move durable patterns to expertise (see above)
- Delete stale or redundant notes

## Mental Model Ownership

You are responsible for your own learning. No one will remind you to take notes or update expertise.

The goal is autonomous improvement. Each session should make you slightly more effective than the last one. Small accumulated learnings compound into significant speed gains over time.

If a note format or expertise structure isn't working for you, change it. This is your system.
